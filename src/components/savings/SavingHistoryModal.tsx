import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, ClockIcon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { SavingGoal, SavingEntry } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { db } from '../../db/database';
import { cn } from '../../utils/cn';

interface SavingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingGoal | null;
}

function formatDateReadable(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const SavingHistoryModal: React.FC<SavingHistoryModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const entries = useLiveQuery<SavingEntry[]>(
    () => {
      if (!goal?.id) return Promise.resolve([]);
      return db.savingEntries
        .where('goalId')
        .equals(goal.id)
        .reverse()
        .sortBy('date');
    },
    [goal?.id],
  );

  const handleDelete = async (id?: number) => {
    if (!id) return;
    await db.savingEntries.delete(id);
  };

  if (!goal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Riwayat — ${goal.emoji} ${goal.name}`}>
      <div className="space-y-3">

        {/* ── Header summary ── */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pb-1 border-b border-slate-100">
          <ClockIcon size={12} />
          <span>{(entries ?? []).length} top-up tercatat</span>
        </div>

        {/* ── Entry list ── */}
        {(entries ?? []).length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-medium text-slate-400">Belum ada riwayat top-up</p>
            <p className="text-xs text-slate-300 mt-1">Mulai top-up untuk melihat riwayat di sini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(entries ?? []).map((entry: SavingEntry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-100 group"
              >
                {/* Left — photo dot */}
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {goal.photo ? (
                    <img src={goal.photo} alt={goal.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">💰</span>
                  )}
                </div>

                {/* Middle */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 tabular-nums">
                    + {formatRupiah(entry.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {formatDateReadable(entry.date)}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-150',
                    'text-slate-300 hover:text-rose-500 hover:bg-rose-50',
                    'opacity-0 group-hover:opacity-100',
                  )}
                  aria-label="Hapus entri"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </Modal>
  );
};
