import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import {
  TrendingDown, TrendingUp, AlertCircle, ChevronRight,
  PieChart as PieChartIcon, BarChart3, ArrowUpRight, Wallet,
  Plus, Edit3, CheckCircle2,
} from 'lucide-react';

import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { ProgressBar } from '../components/common/ProgressBar';
import { formatRupiah, formatRupiahCompact, formatNumber, parseRawAmount } from '../utils/currency';
import { formatDateReadable, formatShortDate, getCurrentMonthYear, getLast7DaysISO, formatMonthReadable } from '../utils/date';
import { cn } from '../utils/cn';
import { Transaction, Category, Budget } from '../types';

interface DashboardPageProps {
  onNavigateToTransactions: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTransactions,
}) => {
  const currentMonth = getCurrentMonthYear();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Budget set/edit modal states
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [inputLimit, setInputLimit]               = useState('');
  const [isSaving, setIsSaving]                   = useState(false);
  const [saveOk, setSaveOk]                       = useState(false);

  // ── Live Queries ─────────────────────────────────────────────
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
  const categories   = useLiveQuery(() => db.categories.toArray(), []);
  const budgets      = useLiveQuery(() => db.budgets.where('monthYear').equals(currentMonth).toArray(), [currentMonth]);

  // ── Category map ─────────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    categories?.forEach((c: Category) => map.set(c.id, { name: c.name, icon: c.icon, color: c.color }));
    return {
      get: (id: string) => map.get(id) || { name: 'Tanpa Kategori', icon: 'HelpCircle', color: '#9CA3AF' }
    };
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

  // ── Budget alerts (≥80%) ─────────────────────────────────────
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
      .filter((item) => item.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, categoryMap, currentMonth]);

  // ── Spending per category this month ──
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions?.forEach((tx: Transaction) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
      }
    });
    return map;
  }, [transactions, currentMonth]);

  // ── Budget limits map ──
  const budgetMap = useMemo(() => {
    const map = new Map<string, { id?: number; amountLimit: number }>();
    budgets?.forEach((b: Budget) => map.set(b.categoryId, { id: b.id, amountLimit: b.amountLimit }));
    return map;
  }, [budgets]);

  // ── Overall budget summary ──
  const budgetSummary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;
    const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];
    expenseCategories.forEach((cat: Category) => {
      const budget = budgetMap.get(cat.id);
      if (budget) {
        totalLimit += budget.amountLimit;
        totalSpent += categorySpentMap.get(cat.id) || 0;
      }
    });
    const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    return { totalLimit, totalSpent, pct };
  }, [categories, budgetMap, categorySpentMap]);

  const setBudgetCount = budgetMap.size;

  /* ── Save Budget Handler ── */
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;

    const numericLimit = parseRawAmount(inputLimit);
    const existing     = budgetMap.get(editingCategoryId);

    setIsSaving(true);
    try {
      if (numericLimit <= 0) {
        if (existing?.id) await db.budgets.delete(existing.id);
      } else if (existing?.id) {
        await db.budgets.update(existing.id, { amountLimit: numericLimit });
      } else {
        await db.budgets.add({
          categoryId: editingCategoryId,
          amountLimit: numericLimit,
          monthYear: currentMonth,
        });
      }
      setSaveOk(true);
      setTimeout(() => {
        setSaveOk(false);
        setEditingCategoryId(null);
        setInputLimit('');
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

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
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp size={15} className="text-rose-100" />
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

      {/* ── Anggaran Bulanan Section ─────────────────────── */}
      <Card animate>
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-rose-500" />
            <h2 className="text-sm font-bold text-slate-800">Anggaran Bulanan</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {formatMonthReadable(currentMonth)}
          </span>
        </div>

        {/* Overall Limit Progress (Only if limits are set) */}
        {budgetSummary.totalLimit > 0 ? (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-500">Total Terpakai</span>
              <span className="text-slate-700 font-bold">
                {formatRupiah(budgetSummary.totalSpent)} / {formatRupiah(budgetSummary.totalLimit)}
              </span>
            </div>
            <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  budgetSummary.pct >= 100
                    ? 'bg-rose-700 animate-pulse-soft'
                    : budgetSummary.pct >= 85
                    ? 'bg-rose-500'
                    : budgetSummary.pct >= 60
                    ? 'bg-rose-400'
                    : 'bg-rose-300'
                )}
                style={{ width: `${Math.min(budgetSummary.pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>Sisa: {formatRupiah(Math.max(0, budgetSummary.totalLimit - budgetSummary.totalSpent))}</span>
              <span>{Math.round(budgetSummary.pct)}%</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Belum ada budget bulanan yang diatur</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Atur budget per kategori di bawah ini untuk memantau pengeluaran.</p>
          </div>
        )}

        {/* Category Budget List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {categories?.filter((c) => c.type === 'expense').map((cat: Category) => {
            const budget = budgetMap.get(cat.id);
            const limit  = budget?.amountLimit || 0;
            const spent  = categorySpentMap.get(cat.id) || 0;
            const pct    = limit > 0 ? (spent / limit) * 100 : 0;
            const hasSet = limit > 0;

            return (
              <div key={cat.id} className="flex flex-col gap-1.5 pb-2.5 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{cat.name}</p>
                      {hasSet ? (
                        <p className="text-[9px] text-slate-400">Limit: {formatRupiah(limit)}</p>
                      ) : (
                        <p className="text-[9px] text-slate-400 italic">Belum diatur</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant={hasSet ? 'ghost' : 'outline'}
                    size="xs"
                    onClick={() => {
                      setEditingCategoryId(cat.id);
                      setInputLimit(limit ? formatNumber(limit) : '');
                      setSaveOk(false);
                    }}
                    className={cn('h-6 px-2 text-[10px]', hasSet ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-500')}
                  >
                    {hasSet ? 'Edit' : 'Atur'}
                  </Button>
                </div>

                {hasSet && (
                  <ProgressBar
                    value={pct}
                    subLabel={`${formatRupiah(spent)} terpakai`}
                    showPercent
                    animated
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

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
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={categoryPieData}
                      cx="50%" cy="50%"
                      innerRadius={46} outerRadius={68}
                      paddingAngle={3} dataKey="value"
                      stroke="none"
                      style={{ outline: 'none' }}
                    >
                      {categoryPieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} stroke="none" style={{ outline: 'none' }} />
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
              <BarChart data={dailyBarData} margin={{ top: 6, right: 6, left: -26, bottom: 0 }} style={{ outline: 'none' }}>
                <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), 'Total']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                  cursor={{ fill: 'rgba(201,96,104,0.06)' }}
                />
                <Bar dataKey="amount" fill="#C96068" radius={[6, 6, 0, 0]} maxBarSize={32} stroke="none" style={{ outline: 'none' }} />
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
                    isIncome ? 'text-slate-800' : 'text-rose-600',
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

      {/* ── Edit Budget Modal ─────────────────────────── */}
      <Modal
        isOpen={Boolean(editingCategoryId)}
        onClose={() => { setEditingCategoryId(null); setInputLimit(''); }}
        title="Atur Limit Budget"
        size="sm"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label
              htmlFor="budget-limit-input"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Limit Budget Bulanan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 select-none">Rp</span>
              <input
                id="budget-limit-input"
                type="text"
                inputMode="numeric"
                value={inputLimit}
                onChange={(e) => setInputLimit(formatNumber(parseRawAmount(e.target.value)) || '')}
                placeholder="0"
                autoFocus
                className="w-full pl-10 pr-4 py-3.5 text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 ml-0.5">
              Isi 0 atau kosongkan untuk menghapus limit budget.
            </p>
          </div>

          <Button
            id="btn-save-budget"
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSaving}
            className={cn(saveOk && 'bg-rose-500')}
          >
            {saveOk ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} /> Tersimpan!
              </span>
            ) : 'Simpan Budget'}
          </Button>
        </form>
      </Modal>

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
