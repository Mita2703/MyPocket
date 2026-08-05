import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, RefreshCw, Plus, ShieldCheck, Database, Info, CheckCircle2 } from 'lucide-react';

import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Input } from '../components/common/Input';
import { DEFAULT_CATEGORIES } from '../db/defaultCategories';
import { cn } from '../utils/cn';
import { Transaction, Category } from '../types';

import { ManageCategoriesModal } from '../components/settings/ManageCategoriesModal';

export const SettingsPage: React.FC = () => {
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isExporting, setIsExporting]     = useState(false);
  const [isResetting, setIsResetting]     = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const transactionsCount = useLiveQuery(() => db.transactions.count(), []);
  const categoriesCount   = useLiveQuery(() => db.categories.count(), []);

  // Export CSV helper
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const transactions = await db.transactions.toArray();
      const categories = await db.categories.toArray();
      const catMap = new Map(categories.map((c: Category) => [c.id, c.name]));

      let csvContent = 'ID,Tanggal,Tipe,Kategori,Nominal,Catatan\n';
      transactions.forEach((tx: Transaction, index: number) => {
        const categoryName = catMap.get(tx.categoryId) || tx.categoryId;
        const note = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : '';
        csvContent += `${index + 1},${tx.date},${tx.type},"${categoryName}",${tx.amount},${note}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MyPocket_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset database helper
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.categories.clear();
      await db.savingGoals.clear();
      await db.savingEntries.clear();
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
      setIsResetModalOpen(false);
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-6">
      {/* Privacy & Storage Card */}
      <Card animate className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Privasi & Penyimpanan</h2>
            <p className="text-xs text-slate-500">100% Data Tersimpan di Perangkat Anda (Offline IndexedDB)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-rose-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Total Transaksi</p>
              <p className="font-bold text-slate-700">{transactionsCount ?? 0} Item</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info size={16} className="text-rose-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Kategori</p>
              <p className="font-bold text-slate-700">{categoriesCount ?? 0} Kategori</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions Section */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Aksi & Kelola Data
        </h2>

        <Card animate className="space-y-2.5 p-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setIsManageCatOpen(true)}
            leftIcon={<Plus size={16} className="text-rose-500" />}
            className="justify-start text-xs text-slate-700"
          >
            Kelola Kategori Anggaran
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={handleExportCSV}
            isLoading={isExporting}
            leftIcon={exportSuccess ? <CheckCircle2 size={16} className="text-rose-500" /> : <Download size={16} className="text-rose-500" />}
            className={cn('justify-start text-xs text-slate-700', exportSuccess && 'border-rose-300 bg-rose-50')}
          >
            {exportSuccess ? 'CSV Berhasil Diunduh!' : 'Export Backup Data (CSV)'}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onClick={() => setIsResetModalOpen(true)}
            leftIcon={<RefreshCw size={16} />}
            className="justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Reset Data Aplikasi
          </Button>
        </Card>
      </div>

      {/* App Info Card */}
      <Card animate className="text-center py-6 space-y-1">
        <h3 className="text-sm font-bold text-slate-800">MyPocket v1.0</h3>
        <p className="text-xs text-slate-400">Personal Expense Tracker (Offline PWA)</p>
        <p className="text-[10px] text-rose-700 font-semibold pt-1">Single-User Offline Edition</p>
      </Card>

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCatOpen}
        onClose={() => setIsManageCatOpen(false)}
      />

      {/* Confirm Reset Data Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Data Aplikasi?"
        confirmText="Ya, Reset Data"
        cancelText="Batal"
        isLoading={isResetting}
        description={
          <span className="text-xs text-slate-600 block mt-1">
            PERINGATAN: Seluruh catatan transaksi, tabungan, dan limit anggaran akan dihapus permanen dari perangkat Anda. Data akan dikembalikan ke kondisi awal.
          </span>
        }
      />
    </div>
  );
};
