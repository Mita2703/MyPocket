import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatRupiah, formatNumber, parseRawAmount } from '../utils/currency';
import { getCurrentMonthYear, formatMonthReadable } from '../utils/date';
import { Edit3, Plus, PieChart as PieChartIcon } from 'lucide-react';

export const BudgetPage: React.FC = () => {
  const currentMonth = getCurrentMonthYear();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [inputLimit, setInputLimit] = useState('');

  const expenseCategories = useLiveQuery(
    () => db.categories.where('type').equals('expense').toArray(),
    []
  );
  const budgets = useLiveQuery(
    () => db.budgets.where('monthYear').equals(currentMonth).toArray(),
    [currentMonth]
  );
  const transactions = useLiveQuery(
    () => db.transactions.where('type').equals('expense').toArray(),
    []
  );

  // Map category spent for current month
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions?.forEach((tx) => {
      if (tx.date.startsWith(currentMonth)) {
        map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
      }
    });
    return map;
  }, [transactions, currentMonth]);

  // Map budget limits
  const budgetMap = useMemo(() => {
    const map = new Map<string, { id?: number; amountLimit: number }>();
    budgets?.forEach((b) => map.set(b.categoryId, { id: b.id, amountLimit: b.amountLimit }));
    return map;
  }, [budgets]);

  // Total Summary
  const summary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;

    expenseCategories?.forEach((cat) => {
      const budget = budgetMap.get(cat.id);
      if (budget) {
        totalLimit += budget.amountLimit;
        totalSpent += categorySpentMap.get(cat.id) || 0;
      }
    });

    const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    return { totalLimit, totalSpent, totalPct };
  }, [expenseCategories, budgetMap, categorySpentMap]);

  const handleOpenEdit = (categoryId: string, currentLimit?: number) => {
    setEditingCategoryId(categoryId);
    setInputLimit(currentLimit ? formatNumber(currentLimit) : '');
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;

    const numericLimit = parseRawAmount(inputLimit);
    const existing = budgetMap.get(editingCategoryId);

    if (numericLimit <= 0) {
      if (existing?.id) {
        await db.budgets.delete(existing.id);
      }
    } else {
      if (existing?.id) {
        await db.budgets.update(existing.id, { amountLimit: numericLimit });
      } else {
        await db.budgets.add({
          categoryId: editingCategoryId,
          amountLimit: numericLimit,
          monthYear: currentMonth,
        });
      }
    }

    setEditingCategoryId(null);
    setInputLimit('');
  };

  return (
    <div className="space-y-4 px-4 pt-3">
      {/* Hero Budget Overview Card */}
      <Card variant="rose">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieChartIcon size={20} className="text-rose-100" />
            <span className="text-xs font-bold text-rose-100">Anggaran Bulanan</span>
          </div>
          <span className="text-[11px] font-semibold text-rose-100 bg-white/20 px-2.5 py-0.5 rounded-full">
            {formatMonthReadable(currentMonth)}
          </span>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-extrabold">{formatRupiah(summary.totalSpent)}</p>
          <p className="text-xs text-rose-100 font-medium mt-0.5">
            dari total budget {formatRupiah(summary.totalLimit)}
          </p>

          <div className="mt-4 bg-white/20 p-2 rounded-xl">
            <ProgressBar value={summary.totalPct} showPercent />
          </div>
        </div>
      </Card>

      {/* Category Budgets List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Budget per Kategori
        </h3>

        {expenseCategories?.map((cat) => {
          const budget = budgetMap.get(cat.id);
          const limit = budget?.amountLimit || 0;
          const spent = categorySpentMap.get(cat.id) || 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;

          return (
            <Card key={cat.id} className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{cat.name}</h4>
                    <p className="text-[10px] text-slate-400">
                      {limit > 0 ? `Limit: ${formatRupiah(limit)}` : 'Belum diset'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(cat.id, limit)}
                  className="text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  {limit > 0 ? <Edit3 size={14} /> : <Plus size={14} />}
                  <span>{limit > 0 ? 'Edit' : 'Set Budget'}</span>
                </Button>
              </div>

              {limit > 0 && (
                <ProgressBar
                  value={pct}
                  subLabel={`${formatRupiah(spent)} terpakai`}
                  showPercent
                />
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={Boolean(editingCategoryId)}
        onClose={() => setEditingCategoryId(null)}
        title="Atur Limit Budget Kategori"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Limit Budget Bulanan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={inputLimit}
              onChange={(e) => setInputLimit(formatNumber(parseRawAmount(e.target.value)))}
              placeholder="0"
              autoFocus
              className="w-full px-4 py-3 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Set ke 0 untuk menghapus limit budget pada kategori ini.
            </p>
          </div>

          <Button type="submit" fullWidth size="lg">
            Simpan Limit Budget
          </Button>
        </form>
      </Modal>
    </div>
  );
};
