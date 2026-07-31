import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, Edit3, Trash2, History, TrendingUp, PiggyBank, Sparkles } from 'lucide-react';

import { db } from '../db/database';
import { SavingGoal, SavingEntry } from '../types';
import { formatRupiah } from '../utils/currency';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SavingGoalFormModal } from '../components/savings/SavingGoalFormModal';
import { TopUpModal } from '../components/savings/TopUpModal';
import { SavingHistoryModal } from '../components/savings/SavingHistoryModal';
import { cn } from '../utils/cn';

/* ── Filter types ───────────────────────────────── */
type FilterStatus = 'all' | 'ongoing' | 'achieved';

/* ── Helper: format date readable ─────────────── */
function formatTargetDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ═══════════════════════════════════════════════
   SavingsPage
   ═══════════════════════════════════════════════ */
export const SavingsPage: React.FC = () => {
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<FilterStatus>('all');
  const [isFormOpen, setIsFormOpen]   = useState(false);
  const [editGoal, setEditGoal]       = useState<SavingGoal | undefined>(undefined);

  const [topUpGoal, setTopUpGoal]         = useState<SavingGoal | null>(null);
  const [historyGoal, setHistoryGoal]     = useState<SavingGoal | null>(null);
  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<SavingGoal | null>(null);
  const [isDeleting, setIsDeleting]       = useState(false);

  /* ── DB queries ── */
  const goals   = useLiveQuery<SavingGoal[]>(() => db.savingGoals.toArray(), []);
  const entries = useLiveQuery<SavingEntry[]>(() => db.savingEntries.toArray(), []);

  /* ── Compute saved amount per goal ── */
  const savedMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of (entries ?? [])) {
      map.set(e.goalId, (map.get(e.goalId) ?? 0) + e.amount);
    }
    return map;
  }, [entries]);

  /* ── Filtered goals ── */
  const filtered = useMemo(() => {
    if (!goals) return [];
    return goals.filter((g: SavingGoal) => {
      const saved   = savedMap.get(g.id!) ?? 0;
      const pct     = saved / g.targetAmount;
      const achieved = pct >= 1;

      if (filter === 'ongoing'  && achieved) return false;
      if (filter === 'achieved' && !achieved) return false;

      if (search.trim()) {
        return g.name.toLowerCase().includes(search.trim().toLowerCase());
      }
      return true;
    });
  }, [goals, savedMap, filter, search]);

  /* ── Stats for hero card ── */
  const totalGoals    = goals?.length ?? 0;
  const achievedCount = useMemo(
    () => (goals ?? []).filter((g: SavingGoal) => (savedMap.get(g.id!) ?? 0) >= g.targetAmount).length,
    [goals, savedMap],
  );
  const totalSaved    = useMemo(
    () => [...savedMap.values()].reduce((a, b) => a + b, 0),
    [savedMap],
  );

  /* ── Handlers ── */
  const handleAddGoal = async (data: Omit<SavingGoal, 'id' | 'createdAt'>) => {
    await db.savingGoals.add({ ...data, createdAt: new Date().toISOString() });
  };

  const handleEditGoal = async (data: Omit<SavingGoal, 'id' | 'createdAt'>) => {
    if (!editGoal?.id) return;
    await db.savingGoals.update(editGoal.id, data);
  };

  const handleDeleteGoal = async () => {
    if (!deleteConfirmGoal?.id) return;
    setIsDeleting(true);
    try {
      await db.savingEntries.where('goalId').equals(deleteConfirmGoal.id).delete();
      await db.savingGoals.delete(deleteConfirmGoal.id);
      setDeleteConfirmGoal(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTopUp = async (amount: number, note: string, date: string) => {
    if (!topUpGoal?.id) return;
    await db.savingEntries.add({
      goalId: topUpGoal.id,
      amount,
      note: note || undefined,
      date,
      createdAt: new Date().toISOString(),
    });
  };

  const openEdit = (goal: SavingGoal) => {
    setEditGoal(goal);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditGoal(undefined);
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-6">

      {/* ── Hero summary card ──────────────────────────── */}
      <Card variant="rose" animate className="relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <PiggyBank size={14} className="text-rose-200" />
            <p className="text-[11px] font-semibold text-rose-100 uppercase tracking-widest">Target Tabungan</p>
          </div>

          <p className="text-3xl font-extrabold tracking-tight mt-1">
            {formatRupiah(totalSaved)}
          </p>
          <p className="text-[11px] text-rose-200 mt-0.5">Total terkumpul dari semua target</p>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-rose-400/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp size={15} className="text-rose-100" />
              </div>
              <div>
                <p className="text-[10px] text-rose-200 font-medium">Total Target</p>
                <p className="text-xs font-bold text-white">{totalGoals} target</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles size={15} className="text-rose-100" />
              </div>
              <div>
                <p className="text-[10px] text-rose-200 font-medium">Tercapai</p>
                <p className="text-xs font-bold text-white">{achievedCount} target 🎉</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Search bar ─────────────────────────────────── */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari target tabungan..."
          className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
      </div>

      {/* ── Filter pills ───────────────────────────────── */}
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
        {([
          { key: 'all',      label: 'Semua' },
          { key: 'ongoing',  label: '🔥 Berjalan' },
          { key: 'achieved', label: '🎉 Tercapai' },
        ] as { key: FilterStatus; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 tap-feedback',
              filter === key
                ? 'bg-white text-rose-700 shadow-card'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Goal card list ─────────────────────────────── */}
      {!goals ? (
        /* Skeleton loader */
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100 shadow-card">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="py-14 text-center">
          <p className="text-5xl mb-3">🐷</p>
          <p className="text-sm font-bold text-slate-600">
            {search || filter !== 'all' ? 'Tidak ada target yang cocok' : 'Belum ada target tabungan'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            {search || filter !== 'all'
              ? 'Coba ubah filter atau kata kunci pencarian'
              : 'Buat target pertamamu dan mulai menabung!'}
          </p>
          {(!search && filter === 'all') && (
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => { setEditGoal(undefined); setIsFormOpen(true); }}
            >
              Buat Target Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((goal: SavingGoal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              saved={savedMap.get(goal.id!) ?? 0}
              onTopUp={() => setTopUpGoal(goal)}
              onEdit={() => openEdit(goal)}
              onDelete={() => setDeleteConfirmGoal(goal)}
              onHistory={() => setHistoryGoal(goal)}
            />
          ))}
        </div>
      )}

      {/* ── FAB: Tambah target baru ─────────────────────── */}
      <div className="flex justify-center pt-2">
        <Button
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={() => { setEditGoal(undefined); setIsFormOpen(true); }}
          className="shadow-fab"
        >
          Tambah Target Baru
        </Button>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      <SavingGoalFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        editGoal={editGoal}
        onSubmit={editGoal ? handleEditGoal : handleAddGoal}
      />

      <TopUpModal
        isOpen={!!topUpGoal}
        onClose={() => setTopUpGoal(null)}
        goal={topUpGoal}
        currentSaved={topUpGoal ? (savedMap.get(topUpGoal.id!) ?? 0) : 0}
        onSubmit={handleTopUp}
      />

      <SavingHistoryModal
        isOpen={!!historyGoal}
        onClose={() => setHistoryGoal(null)}
        goal={historyGoal}
      />

      {/* ── Delete Confirmation Modal ────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteConfirmGoal}
        onClose={() => setDeleteConfirmGoal(null)}
        onConfirm={handleDeleteGoal}
        isLoading={isDeleting}
        title="Hapus Target Tabungan"
        description={
          <span>
            Hapus target{' '}
            <span className="font-bold text-slate-800">
              {deleteConfirmGoal?.name}
            </span>
            ? Semua riwayat top-up juga akan dihapus.
          </span>
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════
   GoalCard — individual saving goal card
   ═══════════════════════════════════════════════ */
interface GoalCardProps {
  goal: SavingGoal;
  saved: number;
  onTopUp: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, saved, onTopUp, onEdit, onDelete, onHistory }) => {
  const pct      = Math.min(100, Math.round((saved / goal.targetAmount) * 100));
  const sisa     = Math.max(0, goal.targetAmount - saved);
  const achieved = saved >= goal.targetAmount;

  /* Progress bar color based on percentage */
  const barColor = achieved
    ? 'bg-gradient-to-r from-rose-400 to-rose-600'
    : pct >= 75
    ? 'bg-rose-500'
    : pct >= 40
    ? 'bg-rose-400'
    : 'bg-rose-300';

  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-card overflow-hidden transition-all duration-200',
      achieved
        ? 'border-rose-200 shadow-rose/20'
        : 'border-slate-100 hover:border-rose-100 hover:shadow-md',
    )}>
      {/* Achieved banner */}
      {achieved && (
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-1.5 flex items-center gap-2">
          <Sparkles size={13} className="text-rose-100 animate-pulse" />
          <span className="text-xs font-bold text-white">🎉 Target Tercapai!</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Header row ── */}
        <div className="flex items-start gap-3">
          {/* Photo badge */}
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 bg-white',
            achieved ? 'bg-rose-50' : 'bg-slate-50',
          )}>
            {goal.photo ? (
              <img src={goal.photo} alt={goal.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">💰</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{goal.name}</p>
            {goal.targetDate && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Target: {formatTargetDate(goal.targetDate)}
              </p>
            )}
            {/* Amounts */}
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs font-extrabold text-rose-600 tabular-nums">
                {formatRupiah(saved)}
              </span>
              <span className="text-[10px] text-slate-400">dari</span>
              <span className="text-xs font-bold text-slate-600 tabular-nums">
                {formatRupiah(goal.targetAmount)}
              </span>
            </div>
          </div>

          {/* Percentage badge */}
          <div className={cn(
            'shrink-0 px-2.5 py-1 rounded-xl text-xs font-extrabold',
            achieved
              ? 'bg-rose-500 text-white'
              : 'bg-slate-100 text-slate-600',
          )}>
            {pct}%
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!achieved && sisa > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              Sisa: <span className="font-semibold text-slate-600">{formatRupiah(sisa)}</span>
            </p>
          )}
        </div>

        {/* ── Action row ── */}
        <div className="flex items-center gap-2 pt-1">
          {/* Top-up CTA */}
          {!achieved ? (
            <Button
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={onTopUp}
              className="flex-1 text-xs"
            >
              Top Up
            </Button>
          ) : (
            <div className="flex-1 flex items-center gap-1.5 justify-center py-1.5 bg-rose-50 rounded-xl border border-rose-100">
              <Sparkles size={12} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-600">Selesai 🎉</span>
            </div>
          )}

          {/* Icon buttons */}
          <button
            onClick={onHistory}
            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
            aria-label="Riwayat top-up"
            title="Riwayat"
          >
            <History size={14} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
            aria-label="Edit target"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            aria-label="Hapus target"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
