import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { ProgressBar } from '../components/common/ProgressBar';
import { formatRupiah } from '../utils/currency';
import { formatDateReadable, getCurrentMonthYear } from '../utils/date';
import { TrendingDown, TrendingUp, AlertCircle, ChevronRight, PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Transaction, Category, Budget } from '../types';

interface DashboardPageProps {
  onNavigateToTransactions: () => void;
  onNavigateToBudget: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTransactions,
  onNavigateToBudget,
}) => {
  const currentMonth = getCurrentMonthYear();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Fetch all transactions and categories
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const budgets = useLiveQuery(() => db.budgets.where('monthYear').equals(currentMonth).toArray(), [currentMonth]);

  // Category map helper
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    categories?.forEach((c: Category) => map.set(c.id, { name: c.name, icon: c.icon, color: c.color }));
    return map;
  }, [categories]);

  // Calculate totals for current month
  const monthlyData = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpense: 0, balance: 0 };
    
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx: Transaction) => {
      if (tx.date.startsWith(currentMonth)) {
        if (tx.type === 'income') totalIncome += tx.amount;
        if (tx.type === 'expense') totalExpense += tx.amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions, currentMonth]);

  // Pie chart data: Expenses per category for current month
  const categoryPieData = useMemo(() => {
    if (!transactions) return [];
    const totals: Record<string, number> = {};

    transactions.forEach((tx: Transaction) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        totals[tx.categoryId] = (totals[tx.categoryId] || 0) + tx.amount;
      }
    });

    return Object.entries(totals).map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      return {
        name: cat?.name || catId,
        value: amount,
        color: cat?.color || '#C96068',
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categoryMap, currentMonth]);

  // Bar chart data: Spending breakdown by last 7 days
  const dailyBarData = useMemo(() => {
    if (!transactions) return [];
    const last7Days: { date: string; displayDate: string; amount: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const displayDate = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      last7Days.push({ date: isoDate, displayDate, amount: 0 });
    }

    transactions.forEach((tx: Transaction) => {
      if (tx.type === 'expense') {
        const found = last7Days.find((item) => item.date === tx.date);
        if (found) {
          found.amount += tx.amount;
        }
      }
    });

    return last7Days;
  }, [transactions]);

  // Check budget warnings (>70% or >100%)
  const budgetAlerts = useMemo(() => {
    if (!budgets || !transactions) return [];

    const categorySpent: Record<string, number> = {};
    transactions.forEach((tx: Transaction) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        categorySpent[tx.categoryId] = (categorySpent[tx.categoryId] || 0) + tx.amount;
      }
    });

    return budgets.map((b: Budget) => {
      const spent = categorySpent[b.categoryId] || 0;
      const pct = (spent / b.amountLimit) * 100;
      const cat = categoryMap.get(b.categoryId);
      return {
        categoryId: b.categoryId,
        name: cat?.name || 'Kategori',
        limit: b.amountLimit,
        spent,
        pct,
      };
    }).filter((item: { pct: number }) => item.pct >= 70);
  }, [budgets, transactions, categoryMap, currentMonth]);

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="space-y-4 px-4 pt-3">
      {/* Hero Balance Card */}
      <Card variant="rose" className="relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">Sisa Saldo Bulan Ini</p>
          <h2 className="text-3xl font-extrabold mt-1 tracking-tight">
            {formatRupiah(monthlyData.balance)}
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-rose-400/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-200">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-[10px] text-rose-100 font-medium">Pemasukan</p>
                <p className="text-xs font-bold text-white">{formatRupiah(monthlyData.totalIncome)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                <TrendingDown size={16} />
              </div>
              <div>
                <p className="text-[10px] text-rose-100 font-medium">Pengeluaran</p>
                <p className="text-xs font-bold text-white">{formatRupiah(monthlyData.totalExpense)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Budget Alerts Section (If any category >= 70%) */}
      {budgetAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertCircle size={16} className="text-amber-600" />
              <span>Peringatan Limit Budget!</span>
            </div>
            <button
              onClick={onNavigateToBudget}
              className="text-[11px] font-bold text-amber-700 hover:underline flex items-center"
            >
              Detail <ChevronRight size={12} />
            </button>
          </div>
          {budgetAlerts.slice(0, 2).map((alert: { categoryId: string; name: string; limit: number; spent: number; pct: number }) => (
            <div key={alert.categoryId} className="bg-white/80 rounded-xl p-2.5 shadow-2xs">
              <ProgressBar
                value={alert.pct}
                label={alert.name}
                subLabel={`${formatRupiah(alert.spent)} / ${formatRupiah(alert.limit)}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Chart Section */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Analisis Pengeluaran</h3>
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chartType === 'pie' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <PieChartIcon size={14} /> Pie
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chartType === 'bar' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <BarChart3 size={14} /> Tren
            </button>
          </div>
        </div>

        {chartType === 'pie' ? (
          categoryPieData.length > 0 ? (
            <div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatRupiah(val), 'Pengeluaran']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                {categoryPieData.slice(0, 4).map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-600 truncate">{cat.name}</span>
                    <span className="font-bold text-slate-800 ml-auto">{formatRupiah(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              Belum ada data pengeluaran bulan ini
            </div>
          )
        ) : (
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), 'Total']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#C96068" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Recent Transactions List */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Transaksi Terakhir</h3>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
          >
            Lihat Semua <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx: Transaction) => {
              const cat = categoryMap.get(tx.categoryId);
              return (
                <div key={tx.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#C96068' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Circle'} size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{cat?.name || tx.categoryId}</p>
                      <p className="text-[10px] text-slate-400">{formatDateReadable(tx.date)} {tx.note ? `• ${tx.note}` : ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">Belum ada catatan transaksi</p>
          )}
        </div>
      </Card>
    </div>
  );
};
