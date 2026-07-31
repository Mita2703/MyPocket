import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import {
  TrendingDown, TrendingUp, AlertCircle, ChevronRight,
  PieChart as PieChartIcon, BarChart3, ArrowUpRight, Wallet,
} from 'lucide-react';

import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { ProgressBar } from '../components/common/ProgressBar';
import { formatRupiah, formatRupiahCompact } from '../utils/currency';
import { formatDateReadable, formatShortDate, getCurrentMonthYear, getLast7DaysISO } from '../utils/date';
import { cn } from '../utils/cn';
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

  // ── Live Queries ─────────────────────────────────────────────
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
  const categories   = useLiveQuery(() => db.categories.toArray(), []);
  const budgets      = useLiveQuery(() => db.budgets.where('monthYear').equals(currentMonth).toArray(), [currentMonth]);

  // ── Category map ─────────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    categories?.forEach((c: Category) => map.set(c.id, { name: c.name, icon: c.icon, color: c.color }));
    return map;
  }, [categories]);

  // ── Monthly totals ───────────────────────────────────────────
  const monthlyData = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpense: 0, balance: 0 };
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((tx: Transaction) => {
      if (!tx.date.startsWith(currentMonth)) return;
      if (tx.type === 'income')  totalIncome  += tx.amount;
      if (tx.type === 'expense') totalExpense += tx.amount;
    });
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [transactions, currentMonth]);

  // ── Pie chart — expenses per category this month ─────────────
  const categoryPieData = useMemo(() => {
    if (!transactions) return [];
    const totals: Record<string, number> = {};
    transactions.forEach((tx: Transaction) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        totals[tx.categoryId] = (totals[tx.categoryId] || 0) + tx.amount;
      }
    });
    return Object.entries(totals)
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        return { name: cat?.name || catId, value: amount, color: cat?.color || '#C96068' };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categoryMap, currentMonth]);

  // ── Bar chart — last 7 days spending ─────────────────────────
  const dailyBarData = useMemo(() => {
    const last7 = getLast7DaysISO();
    const data = last7.map((iso) => ({
      date: iso,
      displayDate: formatShortDate(iso),
      amount: 0,
    }));
    transactions?.forEach((tx: Transaction) => {
      if (tx.type === 'expense') {
        const found = data.find((d) => d.date === tx.date);
        if (found) found.amount += tx.amount;
      }
    });
    return data;
  }, [transactions]);

  // ── Budget alerts (≥70%) ─────────────────────────────────────
  const budgetAlerts = useMemo(() => {
    if (!budgets || !transactions) return [];
    const spent: Record<string, number> = {};
    transactions.forEach((tx: Transaction) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        spent[tx.categoryId] = (spent[tx.categoryId] || 0) + tx.amount;
      }
    });
    return budgets
      .map((b: Budget) => {
        const s = spent[b.categoryId] || 0;
        const pct = (s / b.amountLimit) * 100;
        const cat = categoryMap.get(b.categoryId);
        return { categoryId: b.categoryId, name: cat?.name || 'Kategori', limit: b.amountLimit, spent: s, pct };
      })
      .filter((item) => item.pct >= 70)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, categoryMap, currentMonth]);

  const recentTransactions = transactions?.slice(0, 5) || [];
  const isLoading = transactions === undefined;

  return (
    <div className="space-y-4 px-4 pt-3 pb-6">

      {/* ── Hero Balance Card ─────────────────────────────── */}
      <Card variant="rose" animate className="relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet size={14} className="text-rose-200" />
            <p className="text-[11px] font-semibold text-rose-100 uppercase tracking-widest">Sisa Saldo Bulan Ini</p>
          </div>

          <p className="text-4xl font-extrabold tracking-tight mt-1">
            {isLoading ? '—' : formatRupiahCompact(monthlyData.balance)}
          </p>
          <p className="text-[11px] text-rose-200 mt-0.5">
            {isLoading ? '' : formatRupiah(monthlyData.balance)}
          </p>

          {/* Income / Expense mini stats */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-rose-400/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                <TrendingUp size={15} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] text-rose-200 font-medium">Pemasukan</p>
                <p className="text-xs font-bold text-white">{formatRupiah(monthlyData.totalIncome)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingDown size={15} className="text-rose-200" />
              </div>
              <div>
                <p className="text-[10px] text-rose-200 font-medium">Pengeluaran</p>
                <p className="text-xs font-bold text-white">{formatRupiah(monthlyData.totalExpense)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Budget Alerts ─────────────────────────────────── */}
      {budgetAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2.5 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertCircle size={15} className="text-amber-500 shrink-0" />
              <span>Peringatan Budget ({budgetAlerts.length})</span>
            </div>
            <button
              onClick={onNavigateToBudget}
              className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-0.5"
            >
              Detail <ChevronRight size={12} />
            </button>
          </div>

          {budgetAlerts.slice(0, 2).map((alert) => (
            <div key={alert.categoryId} className="bg-white rounded-xl p-3 shadow-card">
              <ProgressBar
                value={alert.pct}
                label={alert.name}
                subLabel={`${formatRupiah(alert.spent)} / ${formatRupiah(alert.limit)}`}
                showPercent
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Analytics Chart ──────────────────────────────── */}
      <Card animate>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">Analisis Pengeluaran</h2>

          {/* Chart type toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-500">
            <ChartToggleBtn
              active={chartType === 'pie'}
              icon={<PieChartIcon size={13} />}
              label="Pie"
              onClick={() => setChartType('pie')}
            />
            <ChartToggleBtn
              active={chartType === 'bar'}
              icon={<BarChart3 size={13} />}
              label="Tren"
              onClick={() => setChartType('bar')}
            />
          </div>
        </div>

        {chartType === 'pie' ? (
          categoryPieData.length > 0 ? (
            <div>
              {/* Donut chart */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%" cy="50%"
                      innerRadius={46} outerRadius={68}
                      paddingAngle={3} dataKey="value"
                    >
                      {categoryPieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatRupiah(val), 'Pengeluaran']}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 pt-3 border-t border-slate-100">
                {categoryPieData.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[11px] text-slate-500 truncate flex-1">{cat.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 shrink-0">{formatRupiah(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="Belum ada pengeluaran bulan ini" />
          )
        ) : (
          /* Bar chart — 7-day spending */
          <div className="h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBarData} margin={{ top: 6, right: 6, left: -26, bottom: 0 }}>
                <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), 'Total']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                  cursor={{ fill: 'rgba(201,96,104,0.06)' }}
                />
                <Bar dataKey="amount" fill="#C96068" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Recent Transactions ────────────────────────── */}
      <Card animate>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">Transaksi Terakhir</h2>
          <button
            onClick={onNavigateToTransactions}
            className="flex items-center gap-0.5 text-xs font-bold text-rose-600 hover:text-rose-700 tap-feedback"
          >
            Semua <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            /* Skeleton */
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2.5 w-16 rounded" />
                </div>
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            ))
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((tx: Transaction) => {
              const cat = categoryMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {/* Icon badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: cat?.color || '#C96068' }}
                  >
                    <CategoryIcon name={cat?.icon || 'Circle'} size={18} />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {cat?.name || tx.categoryId}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {formatDateReadable(tx.date)}{tx.note ? ` · ${tx.note}` : ''}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className={cn(
                    'text-xs font-extrabold shrink-0 tabular-nums',
                    isIncome ? 'text-emerald-600' : 'text-slate-800',
                  )}>
                    {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">Belum ada transaksi dicatat</p>
          )}
        </div>
      </Card>

    </div>
  );
};

/* ── Internal helpers ──────────────────────────────────────── */
const ChartToggleBtn: React.FC<{
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all duration-150',
      active ? 'bg-white text-rose-700 shadow-sm font-bold' : 'hover:text-slate-800',
    )}
  >
    {icon} {label}
  </button>
);

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-300">
    <PieChartIcon size={36} strokeWidth={1.2} />
    <p className="text-xs">{message}</p>
  </div>
);
