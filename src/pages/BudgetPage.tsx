import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Edit3, Plus, TrendingDown, CheckCircle2 } from 'lucide-react';

import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatRupiah, formatNumber, parseRawAmount } from '../utils/currency';
import { getCurrentMonthYear, formatMonthReadable } from '../utils/date';
import { cn } from '../utils/cn';
import { Transaction, Category, Budget } from '../types';

export const BudgetPage: React.FC = () => {
  const currentMonth = getCurrentMonthYear();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [inputLimit, setInputLimit]               = useState('');
  const [isSaving, setIsSaving]                   = useState(false);
  const [saveOk, setSaveOk]                       = useState(false);

  // ── Live Queries ─────────────────────────────────────────────
  const expenseCategories = useLiveQuery(
    () => db.categories.where('type').equals('expense').toArray(), []
  );
  const budgets = useLiveQuery(
    () => db.budgets.where('monthYear').equals(currentMonth).toArray(), [currentMonth]
  );
  const transactions = useLiveQuery(
    () => db.transactions.where('type').equals('expense').toArray(), []
  );

  // ── Spending per category this month ─────────────────────────
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions?.forEach((tx: Transaction) => {
      if (tx.date.startsWith(currentMonth)) {
        map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
      }
    });
    return map;
  }, [transactions, currentMonth]);

  // ── Budget limits map ────────────────────────────────────────
  const budgetMap = useMemo(() => {
    const map = new Map<string, { id?: number; amountLimit: number }>();
    budgets?.forEach((b: Budget) => map.set(b.categoryId, { id: b.id, amountLimit: b.amountLimit }));
    return map;
  }, [budgets]);

  // ── Overall summary ──────────────────────────────────────────
  const summary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;
    expenseCategories?.forEach((cat: Category) => {
      const budget = budgetMap.get(cat.id);
      if (budget) {
        totalLimit += budget.amountLimit;
        totalSpent += categorySpentMap.get(cat.id) || 0;
      }
    });
    const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    return { totalLimit, totalSpent, pct };
  }, [expenseCategories, budgetMap, categorySpentMap]);

  const setBudgetCount = budgetMap.size;
  const isLoading = expenseCategories === undefined;

  /* ── Handlers ─────────────────────────────────────── */
  const handleOpenEdit = (categoryId: string, currentLimit?: number) => {
    setEditingCategoryId(categoryId);
    setInputLimit(currentLimit ? formatNumber(currentLimit) : '');
    setSaveOk(false);
  };

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

  return (
    <div className="space-y-4 px-4 pt-3 pb-6">

      {/* ── Hero Card ────────────────────────────────── */}
      <Card variant="rose" animate className="relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-200" />
              <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">Anggaran Bulanan</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              {formatMonthReadable(currentMonth)}
            </span>
          </div>

          {/* Numbers */}
          <p className="text-3xl font-extrabold tracking-tight">{formatRupiah(summary.totalSpent)}</p>
          <p className="text-[11px] text-rose-200 mt-0.5">
            dari total budget {formatRupiah(summary.totalLimit)} ({setBudgetCount} kategori)
          </p>

          {/* Progress track */}
          <div className="mt-4 pt-3 border-t border-rose-400/30">
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  summary.pct >= 100 ? 'bg-white animate-pulse-soft' : 'bg-white/80',
                )}
                style={{ width: `${Math.min(summary.pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-rose-200 mt-1.5 font-medium">
              <span>Terpakai {Math.round(summary.pct)}%</span>
              <span>Sisa {formatRupiah(Math.max(0, summary.totalLimit - summary.totalSpent))}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Budget per Category ───────────────────────── */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Budget per Kategori
        </h2>

        {isLoading ? (
          /* Skeleton */
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base animate-pulse flex items-center gap-3 p-3.5">
              <div className="skeleton w-8 h-8 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-2 w-14 rounded" />
              </div>
              <div className="skeleton h-6 w-16 rounded-lg" />
            </div>
          ))
        ) : (
          expenseCategories?.map((cat: Category) => {
            const budget = budgetMap.get(cat.id);
            const limit  = budget?.amountLimit || 0;
            const spent  = categorySpentMap.get(cat.id) || 0;
            const pct    = limit > 0 ? (spent / limit) * 100 : 0;
            const hasSet = limit > 0;

            return (
              <Card key={cat.id} className="p-3.5 space-y-3">
                {/* Row top */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-800 truncate">{cat.name}</h3>
                      <p className="text-[10px] text-slate-400">
                        {hasSet
                          ? `Limit: ${formatRupiah(limit)}`
                          : 'Belum ada budget'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={hasSet ? 'ghost' : 'secondary'}
                    size="xs"
                    onClick={() => handleOpenEdit(cat.id, limit)}
                    className={cn('shrink-0', hasSet ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-700')}
                  >
                    {hasSet ? <Edit3 size={13} /> : <Plus size={13} />}
                    {hasSet ? 'Edit' : 'Set'}
                  </Button>
                </div>

                {/* Progress bar (only if budget is set) */}
                {hasSet && (
                  <ProgressBar
                    value={pct}
                    subLabel={`${formatRupiah(spent)} terpakai`}
                    showPercent
                    animated
                  />
                )}
              </Card>
            );
          })
        )}
      </div>

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
