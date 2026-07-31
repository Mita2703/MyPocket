import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Trash2, ChevronDown } from 'lucide-react';

import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatRupiah } from '../utils/currency';
import { formatDateReadable, formatMonthReadable, getCurrentMonthYear } from '../utils/date';
import { cn } from '../utils/cn';
import { Transaction, TransactionType, Category } from '../types';

export const TransactionsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth]     = useState(getCurrentMonthYear());
  const [filterType, setFilterType]           = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery]         = useState('');

  // Delete modal state
  const [deletingTx, setDeletingTx]           = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting]           = useState(false);

  // ── Live Queries ────────────────────────────────────────────
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
  const categories   = useLiveQuery(() => db.categories.toArray(), []);

  // ── Category map ─────────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    categories?.forEach((c: Category) => map.set(c.id, { name: c.name, icon: c.icon, color: c.color }));
    return map;
  }, [categories]);

  // ── Available Months Options (Top option: "Semua Riwayat") ────
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(getCurrentMonthYear());

    transactions?.forEach((tx: Transaction) => {
      if (tx.date) monthsSet.add(tx.date.slice(0, 7));
    });

    const sorted = Array.from(monthsSet).sort().reverse();
    return sorted.map((m) => ({
      value: m,
      label: formatMonthReadable(m),
    }));
  }, [transactions]);

  // ── Filtered transactions ────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((tx: Transaction) => {
      if (selectedMonth && !tx.date.startsWith(selectedMonth)) return false;
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = categoryMap.get(tx.categoryId)?.name.toLowerCase() || '';
        const note    = tx.note?.toLowerCase() || '';
        if (!catName.includes(q) && !note.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, selectedMonth, filterType, selectedCategory, searchQuery, categoryMap]);

  // ── Group by date ────────────────────────────────────────────
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx: Transaction) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  // ── Monthly totals (for summary bar) ────────────────────────
  const monthTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx: Transaction) => {
      if (tx.type === 'income')  income  += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    });
    return { income, expense };
  }, [filteredTransactions]);

  const handleConfirmDelete = async () => {
    if (!deletingTx?.id) return;
    setIsDeleting(true);
    try {
      await db.transactions.delete(deletingTx.id);
      setDeletingTx(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = transactions === undefined;
  const deletingCat = deletingTx ? categoryMap.get(deletingTx.categoryId) : null;

  return (
    <div className="flex flex-col gap-3 px-4 pt-3 pb-6">

      {/* ── Search Bar + Month Dropdown ───────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kategori atau catatan…"
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>

        {/* ── Month Select Dropdown with "Semua Riwayat" option at the top ── */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none py-2.5 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
          >
            <option value="">Semua Riwayat</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Type Filter Tabs ──────────────────────────────── */}
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl" role="group" aria-label="Filter tipe transaksi">
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 tap-feedback',
              filterType === t
                ? t === 'income'
                  ? 'bg-white text-emerald-700 shadow-card'
                  : t === 'expense'
                  ? 'bg-white text-rose-700 shadow-card'
                  : 'bg-white text-slate-800 shadow-card'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'all' ? 'Semua' : t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      {/* ── Category Pill Filters ─────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <PillBtn
          label="Semua"
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        {categories?.map((cat: Category) => (
          <PillBtn
            key={cat.id}
            label={cat.name}
            active={selectedCategory === cat.id}
            color={cat.color}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      {/* ── Summary Bar ──────────────────────────────────── */}
      {filteredTransactions.length > 0 && (
        <div className="flex gap-2 text-xs">
          <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2.5 text-center border border-emerald-100">
            <p className="text-emerald-600 font-medium text-[10px]">Total Masuk</p>
            <p className="font-bold text-emerald-700 mt-0.5">{formatRupiah(monthTotals.income)}</p>
          </div>
          <div className="flex-1 bg-rose-50 rounded-xl px-3 py-2.5 text-center border border-rose-100">
            <p className="text-rose-600 font-medium text-[10px]">Total Keluar</p>
            <p className="font-bold text-rose-700 mt-0.5">{formatRupiah(monthTotals.expense)}</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-200">
            <p className="text-slate-500 font-medium text-[10px]">Saldo Bersih</p>
            <p className={cn(
              'font-bold mt-0.5',
              monthTotals.income - monthTotals.expense >= 0 ? 'text-slate-700' : 'text-rose-600',
            )}>
              {formatRupiah(monthTotals.income - monthTotals.expense)}
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction List Grouped by Date ─────────────── */}
      {isLoading ? (
        /* Skeleton */
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-28 rounded" />
              <Card className="divide-y divide-slate-50 p-0 overflow-hidden">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-3">
                    <div className="skeleton w-9 h-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-20 rounded" />
                      <div className="skeleton h-2.5 w-14 rounded" />
                    </div>
                    <div className="skeleton h-3 w-14 rounded" />
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, txs]) => {
            const dayBalance = txs.reduce(
              (acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount,
              0,
            );
            return (
              <div key={date} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-500">{formatDateReadable(date)}</h3>
                  <span className={cn(
                    'text-[11px] font-bold tabular-nums',
                    dayBalance >= 0 ? 'text-emerald-600' : 'text-rose-600',
                  )}>
                    {dayBalance >= 0 ? '+' : ''}{formatRupiah(dayBalance)}
                  </span>
                </div>

                {/* Transaction list */}
                <Card className="divide-y divide-slate-50 p-0 overflow-hidden">
                  {txs.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const isIncome = tx.type === 'income';
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 transition-colors group"
                      >
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                          style={{ backgroundColor: cat?.color || '#C96068' }}
                        >
                          <CategoryIcon name={cat?.icon || 'Circle'} size={17} />
                        </div>

                        {/* Labels */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {cat?.name || tx.categoryId}
                          </p>
                          {tx.note && (
                            <p className="text-[10px] text-slate-400 truncate">{tx.note}</p>
                          )}
                        </div>

                        {/* Amount + Delete Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            'text-xs font-extrabold tabular-nums',
                            isIncome ? 'text-emerald-600' : 'text-slate-800',
                          )}>
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>

                          <button
                            onClick={() => setDeletingTx(tx)}
                            className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all tap-feedback"
                            title="Hapus transaksi"
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <p className="text-slate-300 text-4xl mb-3">📭</p>
          <p className="text-sm font-semibold text-slate-400">Tidak ada transaksi</p>
          <p className="text-xs text-slate-300 mt-1">Coba ubah filter atau tambah transaksi baru</p>
        </Card>
      )}

      {/* ── Custom Styled Confirm Modal for Transaction Deletion ── */}
      <ConfirmModal
        isOpen={Boolean(deletingTx)}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi?"
        isLoading={isDeleting}
        confirmText="Hapus Transaksi"
        cancelText="Batal"
        description={
          deletingTx ? (
            <div className="space-y-3 my-2">
              <p className="text-slate-500 text-xs">
                Apakah Anda yakin ingin menghapus catatan transaksi ini?
              </p>

              {/* Item preview card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: deletingCat?.color || '#C96068' }}
                  >
                    <CategoryIcon name={deletingCat?.icon || 'Circle'} size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {deletingCat?.name || deletingTx.categoryId}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatDateReadable(deletingTx.date)}{deletingTx.note ? ` · ${deletingTx.note}` : ''}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    'text-xs font-extrabold tabular-nums shrink-0',
                    deletingTx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                  )}
                >
                  {deletingTx.type === 'income' ? '+' : '-'}{formatRupiah(deletingTx.amount)}
                </span>
              </div>
            </div>
          ) : undefined
        }
      />

    </div>
  );
};

/* ── Internal PillBtn ──────────────────────────────────────── */
const PillBtn: React.FC<{
  label: string; active: boolean; color?: string; onClick: () => void;
}> = ({ label, active, color, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all tap-feedback shrink-0',
      active
        ? 'text-white shadow-sm'
        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300',
    )}
    style={active ? { backgroundColor: color ?? '#C96068' } : undefined}
  >
    {label}
  </button>
);
