import React, { useState, useEffect } from 'react';
import { Target, CalendarDays } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SavingGoal } from '../../types';
import { formatNumber, parseRawAmount } from '../../utils/currency';
import { getCurrentDateISO } from '../../utils/date';
import { cn } from '../../utils/cn';

const EMOJI_OPTIONS = [
  '💻', '📱', '🧴', '✈️', '👟', '📚', '🎮', '🏠',
  '💄', '🎵', '🚗', '⌚', '📷', '🎒', '🍕', '💍',
  '🏋️', '🎨', '🎁', '🌴', '💰', '🛒', '🎓', '🐾',
];

interface SavingGoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, modal is in "edit" mode */
  editGoal?: SavingGoal;
  onSubmit: (data: Omit<SavingGoal, 'id' | 'createdAt'>) => Promise<void>;
}

export const SavingGoalFormModal: React.FC<SavingGoalFormModalProps> = ({
  isOpen,
  onClose,
  editGoal,
  onSubmit,
}) => {
  const isEditing = !!editGoal;

  const [name, setName]               = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate]   = useState('');
  const [emoji, setEmoji]             = useState('💰');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill on edit
  useEffect(() => {
    if (editGoal) {
      setName(editGoal.name);
      setTargetAmount(formatNumber(editGoal.targetAmount));
      setTargetDate(editGoal.targetDate || '');
      setEmoji(editGoal.emoji);
    } else {
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setEmoji('💰');
    }
  }, [editGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRawAmount(targetAmount);
    if (!name.trim() || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: amount,
        targetDate: targetDate || undefined,
        emoji,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Target Tabungan' : 'Tambah Target Tabungan'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Emoji Picker ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Ikon
          </label>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn(
                  'h-9 w-full rounded-xl text-xl flex items-center justify-center border-2 transition-all',
                  emoji === e
                    ? 'border-rose-400 bg-rose-50 scale-110'
                    : 'border-transparent bg-slate-50 hover:bg-slate-100',
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* ── Selected preview ── */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{name || 'Nama target...'}</p>
            <p className="text-xs text-slate-400">
              {parseRawAmount(targetAmount) > 0
                ? `Target: Rp ${formatNumber(parseRawAmount(targetAmount))}`
                : 'Nominal target...'}
            </p>
          </div>
        </div>

        {/* ── Nama Target ── */}
        <div>
          <label htmlFor="goal-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5"><Target size={12} /> Nama Target</span>
          </label>
          <input
            id="goal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Laptop Gaming, Liburan Bali..."
            required
            autoFocus
            maxLength={50}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>

        {/* ── Nominal Target ── */}
        <div>
          <label htmlFor="goal-amount" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Nominal Target
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">Rp</span>
            <input
              id="goal-amount"
              type="text"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => {
                const raw = parseRawAmount(e.target.value);
                setTargetAmount(raw > 0 ? formatNumber(raw) : '');
              }}
              placeholder="0"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl text-base font-bold bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* ── Target Tanggal (opsional) ── */}
        <div>
          <label htmlFor="goal-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} /> Target Tanggal
              <span className="text-slate-300 font-normal normal-case">(opsional)</span>
            </span>
          </label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={getCurrentDateISO()}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>

        {/* ── Submit ── */}
        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          {isEditing ? 'Simpan Perubahan' : 'Buat Target Tabungan'}
        </Button>

      </form>
    </Modal>
  );
};
