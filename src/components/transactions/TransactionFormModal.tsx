import React, { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MinusCircle, PlusCircle, CalendarDays, StickyNote, CheckCircle2 } from 'lucide-react';
import { db } from '../../db/database';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction, TransactionType, Category } from '../../types';
import { formatNumber, parseRawAmount } from '../../utils/currency';
import { getCurrentDateISO } from '../../utils/date';
import { cn } from '../../utils/cn';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional transaction to edit */
  editTransaction?: Transaction;
  /** Pre-fill type (optional, for quick-add shortcuts) */
  defaultType?: TransactionType;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  editTransaction,
  defaultType = 'expense',
}) => {
  const [type, setType]               = useState<TransactionType>(defaultType);
  const [displayAmount, setDisplayAmount] = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [date, setDate]               = useState(getCurrentDateISO());
  const [note, setNote]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess]   = useState(false);

  // Sync state when editing transaction changes
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setDisplayAmount(formatNumber(editTransaction.amount));
      setCategoryId(editTransaction.categoryId);
      setDate(editTransaction.date);
      setNote(editTransaction.note || '');
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen]);

  // Fetch categories filtered by active type
  const categories = useLiveQuery(
    () => db.categories.where('type').equals(type).toArray(),
    [type]
  );

  /* ── Handlers ──────────────────────────────────────── */
  const handleTypeSwitch = useCallback((newType: TransactionType) => {
    setType(newType);
    setCategoryId(''); // reset category when switching type
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRawAmount(e.target.value);
    setDisplayAmount(raw > 0 ? formatNumber(raw) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRawAmount(displayAmount);
    if (!amount || amount <= 0 || !categoryId) return;

    setIsSubmitting(true);
    try {
      if (editTransaction?.id) {
        // Edit existing transaction
        await db.transactions.update(editTransaction.id, {
          amount,
          type,
          categoryId,
          date,
          note: note.trim() || undefined,
        });
      } else {
        // Add new transaction
        await db.transactions.add({
          amount,
          type,
          categoryId,
          date,
          note: note.trim() || undefined,
          createdAt: new Date().toISOString(),
        });
      }

      // Brief success flash before closing
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        resetForm();
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error saving transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDisplayAmount('');
    setCategoryId('');
    setNote('');
    setDate(getCurrentDateISO());
    setType(defaultType);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isExpense = type === 'expense';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Type Switcher (Expense / Income) ─────────── */}
        <div
          className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl"
          role="group"
          aria-label="Jenis transaksi"
        >
          <TypeTab
            id="type-expense"
            active={isExpense}
            label="Pengeluaran"
            icon={<MinusCircle size={16} className={isExpense ? 'text-rose-500' : 'text-slate-400'} />}
            activeClass="text-rose-700"
            onClick={() => handleTypeSwitch('expense')}
          />
          <TypeTab
            id="type-income"
            active={!isExpense}
            label="Pemasukan"
            icon={<PlusCircle size={16} className={!isExpense ? 'text-rose-500' : 'text-slate-400'} />}
            activeClass="text-rose-700"
            onClick={() => handleTypeSwitch('income')}
          />
        </div>

        {/* ── Amount Input ───────────────────────────────── */}
        <div>
          <label
            htmlFor="amount-input"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Nominal
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 select-none">
              Rp
            </span>
            <input
              id="amount-input"
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              required
              autoFocus
              className={cn(
                'w-full pl-10 pr-4 py-3.5 rounded-xl text-xl font-bold tracking-tight',
                'bg-slate-50 border border-slate-200 text-slate-800',
                'focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white focus:border-rose-300',
                'transition-all duration-200',
                'placeholder:text-slate-300',
              )}
            />
          </div>
        </div>

        {/* ── Category Grid ──────────────────────────────── */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Kategori
          </label>

          {categories === undefined ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Memuat kategori...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-6 text-center text-xs text-rose-600 font-semibold bg-rose-50/50 border border-dashed border-rose-100 rounded-xl p-3">
              Belum ada kategori untuk tipe ini.<br/>Silakan buat kategori di tab Pengaturan.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto scrollbar-none pb-0.5">
              {categories.map((cat: Category) => {
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`cat-${cat.id}`}
                    onClick={() => setCategoryId(cat.id)}
                    aria-pressed={selected}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border-2',
                      'transition-all duration-150 tap-feedback focus:outline-none',
                      selected
                        ? 'border-rose-400 bg-rose-50 shadow-sm'
                        : 'border-transparent bg-white hover:bg-slate-50 hover:border-slate-200',
                    )}
                  >
                    {/* Icon badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={17} />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] text-center leading-tight line-clamp-1',
                        selected ? 'font-bold text-rose-700' : 'text-slate-500',
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Date Picker ────────────────────────────────── */}
        <div>
          <label
            htmlFor="date-input"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} /> Tanggal
            </span>
          </label>
          <input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getCurrentDateISO()}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl text-sm font-medium',
              'bg-slate-50 border border-slate-200 text-slate-700',
              'focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white',
              'transition-all duration-200',
            )}
          />
        </div>

        {/* ── Note Input (Optional) ─────────────────────── */}
        <div>
          <label
            htmlFor="note-input"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <StickyNote size={12} /> Catatan
              <span className="text-slate-300 font-normal normal-case">(opsional)</span>
            </span>
          </label>
          <input
            id="note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Misal: Nasi goreng kampus…"
            maxLength={80}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl text-sm',
              'bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-300',
              'focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white',
              'transition-all duration-200',
            )}
          />
        </div>

        {/* ── Submit Button ──────────────────────────────── */}
        <Button
          id="btn-save-transaction"
          type="submit"
          variant={isExpense ? 'primary' : 'primary'}
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={!categoryId || !displayAmount || isSubmitting}
          className={cn(
            'mt-1',
            saveSuccess && 'bg-rose-600',
          )}
        >
          {saveSuccess ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              Tersimpan!
            </span>
          ) : editTransaction ? (
            'Simpan Perubahan'
          ) : (
            `Simpan ${isExpense ? 'Pengeluaran' : 'Pemasukan'}`
          )}
        </Button>

      </form>
    </Modal>
  );
};

/* ── Internal TypeTab sub-component ──────────────────────────────── */
interface TypeTabProps {
  id: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  onClick: () => void;
}

const TypeTab: React.FC<TypeTabProps> = ({ id, active, label, icon, activeClass, onClick }) => (
  <button
    id={id}
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={cn(
      'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium',
      'transition-all duration-200 tap-feedback',
      active
        ? `bg-white shadow-sm font-semibold ${activeClass}`
        : 'text-slate-500 hover:text-slate-700',
    )}
  >
    {icon}
    {label}
  </button>
);
