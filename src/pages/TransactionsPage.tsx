import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatRupiah } from '../utils/currency';
import { formatDateReadable, getCurrentMonthYear } from '../utils/date';
import { Transaction, TransactionType, Category } from '../types';
import { Search, Filter, Trash2, Calendar } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    categories?.forEach((c: Category) => map.set(c.id, { name: c.name, icon: c.icon, color: c.color }));
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx: Transaction) => {
      // Month match
      if (selectedMonth && !tx.date.startsWith(selectedMonth)) return false;

      // Type match
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Category match
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const catName = categoryMap.get(tx.categoryId)?.name.toLowerCase() || '';
        const note = tx.note?.toLowerCase() || '';
        if (!catName.includes(query) && !note.includes(query)) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, filterType, selectedCategory, searchQuery, categoryMap]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx: Transaction) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      await db.transactions.delete(id);
    }
  };

  return (
    <div className="space-y-3 px-4 pt-3">
      {/* Month & Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi / catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
        <div className="relative">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      </div>

      {/* Filter Tabs (All / Expense / Income) */}
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'expense' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'income' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pemasukan
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-rose-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semua Kategori
        </button>
        {categories?.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

      {/* Transaction List Grouped by Date */}
      <div className="space-y-4">
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, txs]) => {
            const dayTotal = txs.reduce(
              (acc, tx) => (tx.type === 'expense' ? acc - tx.amount : acc + tx.amount),
              0
            );

            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-500">{formatDateReadable(date)}</h3>
                  <span className={`text-xs font-bold ${dayTotal < 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                    {dayTotal < 0 ? '-' : '+'}{formatRupiah(Math.abs(dayTotal))}
                  </span>
                </div>

                <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
                  {txs.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
                            style={{ backgroundColor: cat?.color || '#C96068' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Circle'} size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{cat?.name || tx.categoryId}</p>
                            {tx.note && <p className="text-[10px] text-slate-400">{tx.note}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-extrabold ${
                              tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Hapus transaksi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            );
          })
        ) : (
          <Card className="py-12 text-center">
            <p className="text-xs text-slate-400">Tidak ada transaksi yang cocok dengan filter</p>
          </Card>
        )}
      </div>
    </div>
  );
};
