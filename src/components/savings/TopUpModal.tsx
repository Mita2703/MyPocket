import React, { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SavingGoal } from '../../types';
import { formatNumber, parseRawAmount, formatRupiah } from '../../utils/currency';
import { getCurrentDateISO } from '../../utils/date';
import { cn } from '../../utils/cn';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingGoal | null;
  currentSaved: number;
  onSubmit: (amount: number, note: string, date: string) => Promise<void>;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  goal,
  currentSaved,
  onSubmit,
}) => {
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [date, setDate]           = useState(getCurrentDateISO());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setAmount('');
    setNote('');
    setDate(getCurrentDateISO());
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRawAmount(amount);
    if (!parsed || parsed <= 0 || !goal) return;

    setIsSubmitting(true);
    try {
      await onSubmit(parsed, note.trim(), date);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  const sisa = Math.max(0, goal.targetAmount - currentSaved);
  const pct  = Math.min(100, Math.round((currentSaved / goal.targetAmount) * 100));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Top Up Tabungan">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Goal summary card ── */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{goal.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{goal.name}</p>
              <p className="text-xs text-slate-500">
                Terkumpul: <span className="font-bold text-slate-700">{formatRupiah(currentSaved)}</span>
                {' / '}
                <span className="text-rose-600">{formatRupiah(goal.targetAmount)}</span>
              </p>
            </div>
            <span className="text-sm font-extrabold text-rose-600 shrink-0">{pct}%</span>
          </div>

          {/* Mini progress bar */}
          <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Sisa info ── */}
        {sisa > 0 && (
          <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100">
            <span className="text-slate-400">Sisa yang dibutuhkan:</span>
            <span className="font-bold text-rose-600">{formatRupiah(sisa)}</span>
          </div>
        )}

        {/* ── Nominal top-up ── */}
        <div>
          <label htmlFor="topup-amount" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Nominal Top-Up
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 select-none">Rp</span>
            <input
              id="topup-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const raw = parseRawAmount(e.target.value);
                setAmount(raw > 0 ? formatNumber(raw) : '');
              }}
              placeholder="0"
              required
              autoFocus
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-xl font-bold bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* ── Quick amount chips ── */}
        <div className="flex flex-wrap gap-2">
          {[50000, 100000, 200000, 500000].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setAmount(formatNumber(chip))}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                amount === formatNumber(chip)
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600',
              )}
            >
              +{formatRupiah(chip)}
            </button>
          ))}
        </div>

        {/* ── Tanggal ── */}
        <div>
          <label htmlFor="topup-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Tanggal
          </label>
          <input
            id="topup-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getCurrentDateISO()}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>

        {/* ── Catatan ── */}
        <div>
          <label htmlFor="topup-note" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <StickyNote size={12} /> Catatan
              <span className="text-slate-300 font-normal normal-case">(opsional)</span>
            </span>
          </label>
          <input
            id="topup-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Nabung dari uang jajan..."
            maxLength={80}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>

        {/* ── Submit ── */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={!amount || isSubmitting}
        >
          Simpan Tabungan
        </Button>
      </form>
    </Modal>
  );
};
