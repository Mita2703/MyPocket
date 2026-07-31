import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategoryIcon } from '../common/CategoryIcon';
import { TransactionType } from '../../types';
import { formatNumber, parseRawAmount } from '../../utils/currency';
import { getCurrentDateISO } from '../../utils/date';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [displayAmount, setDisplayAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getCurrentDateISO());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories based on active transaction type
  const categories = useLiveQuery(
    () => db.categories.where('type').equals(type).toArray(),
    [type]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numericVal = parseRawAmount(rawVal);
    if (numericVal === 0) {
      setDisplayAmount('');
    } else {
      setDisplayAmount(formatNumber(numericVal));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRawAmount(displayAmount);

    if (numericAmount <= 0) {
      alert('Nominal harus lebih dari Rp 0');
      return;
    }

    if (!categoryId && categories && categories.length > 0) {
      alert('Pilih salah satu kategori');
      return;
    }

    const selectedCategory = categoryId || (categories && categories[0]?.id) || 'lain_pengeluaran';

    setIsSubmitting(true);
    try {
      await db.transactions.add({
        amount: numericAmount,
        type,
        categoryId: selectedCategory,
        date,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      });

      // Reset form
      setDisplayAmount('');
      setNote('');
      setCategoryId('');
      onClose();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Transaksi">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MinusCircle size={18} />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle size={18} />
            Pemasukan
          </button>
        </div>

        {/* Large Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Nominal (Rp)</label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-xl font-extrabold text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              autoFocus
              className="w-full pl-12 pr-4 py-3 text-2xl font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Category Grid Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pilih Kategori</label>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {categories?.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold scale-105 shadow-xs'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-1 text-white shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={18} />
                  </div>
                  <span className="text-[10px] text-center line-clamp-1">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
          />
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Catatan (Opsional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Misal: Nasi goreng sepi manis"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
          />
        </div>

        {/* Submit CTA */}
        <Button
          type="submit"
          variant={type === 'expense' ? 'primary' : 'secondary'}
          fullWidth
          size="lg"
          disabled={isSubmitting}
          className="mt-2"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </Button>
      </form>
    </Modal>
  );
};
