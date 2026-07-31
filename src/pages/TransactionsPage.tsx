import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatRupiah } from '../utils/currency';
import { formatDateReadable, getCurrentMonthYear } from '../utils/date';
import { Transaction, TransactionType } from '../types';
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
    categories?.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon, color: c.color }));
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx) => {
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
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      await db.transactions.delete(id);
    }
  };

  return (
    <div className="space-y-4 px-4 pt-3">
      {/* Search & Filter Header */}
      <Card className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi atau catatan..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar size={14} className="text-rose-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden w-full"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter size={14} className="text-rose-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden w-full"
            >
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
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
          {categories?.map((cat) => (
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
      </Card>

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
