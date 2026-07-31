import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { DEFAULT_CATEGORIES } from '../db/defaultCategories';
import { Download, RefreshCw, Plus, ShieldCheck, Database, Info } from 'lucide-react';
import { Transaction, Category } from '../types';

export const SettingsPage: React.FC = () => {
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');

  const transactionsCount = useLiveQuery(() => db.transactions.count(), []);
  const categoriesCount = useLiveQuery(() => db.categories.count(), []);

  // Export CSV helper
  const handleExportCSV = async () => {
    const transactions = await db.transactions.toArray();
    const categories = await db.categories.toArray();
    const catMap = new Map(categories.map((c: Category) => [c.id, c.name]));

    let csvContent = 'ID,Tanggal,Tipe,Kategori,Nominal,Catatan\n';
    transactions.forEach((tx: Transaction) => {
      const categoryName = catMap.get(tx.categoryId) || tx.categoryId;
      const note = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : '';
      csvContent += `${tx.id},${tx.date},${tx.type},"${categoryName}",${tx.amount},${note}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MyPocket_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset database helper
  const handleResetData = async () => {
    if (confirm('PERINGATAN: Seluruh data transaksi dan budget lokal akan dihapus permanen! Lanjutkan?')) {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.categories.clear();
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
      alert('Data berhasil di-reset ke kondisi awal.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const id = `custom_${Date.now()}`;
    await db.categories.add({
      id,
      name: catName.trim(),
      icon: catType === 'expense' ? 'ShoppingBag' : 'PlusCircle',
      color: catType === 'expense' ? '#C96068' : '#10B981',
      type: catType,
      isDefault: false,
    });

    setCatName('');
    setIsAddCatOpen(false);
  };

  return (
    <div className="space-y-4 px-4 pt-3">
      {/* Privacy & Storage Card */}
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Privasi & Penyimpanan</h3>
            <p className="text-xs text-slate-500">100% Data Tersimpan di Perangkat Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-rose-500" />
            <div>
              <p className="text-[10px] text-slate-400">Total Transaksi</p>
              <p className="font-bold text-slate-700">{transactionsCount ?? 0} Transaksi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info size={16} className="text-rose-500" />
            <div>
              <p className="text-[10px] text-slate-400">Kategori</p>
              <p className="font-bold text-slate-700">{categoriesCount ?? 0} Kategori</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Aksi & Kelola Data
        </h3>

        <Card className="space-y-2.5 p-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setIsAddCatOpen(true)}
            className="justify-start gap-2.5 text-xs text-slate-700"
          >
            <Plus size={16} className="text-rose-500" />
            Tambah Kategori Baru
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={handleExportCSV}
            className="justify-start gap-2.5 text-xs text-slate-700"
          >
            <Download size={16} className="text-rose-500" />
            Export Backup Data (CSV)
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onClick={handleResetData}
            className="justify-start gap-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <RefreshCw size={16} />
            Reset Data Aplikasi
          </Button>
        </Card>
      </div>

      {/* App Info Card */}
      <Card className="text-center py-6 space-y-1">
        <h4 className="text-sm font-bold text-slate-800">MyPocket v1.0</h4>
        <p className="text-xs text-slate-400">Personal Expense Tracker (Offline PWA)</p>
        <p className="text-[10px] text-rose-700 font-semibold pt-1">Single-User Edition</p>
      </Card>

      {/* Add Custom Category Modal */}
      <Modal isOpen={isAddCatOpen} onClose={() => setIsAddCatOpen(false)} title="Tambah Kategori Baru">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Kategori</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Misal: Langganan Stream"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tipe Transaksi</label>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value as 'expense' | 'income')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/50 font-semibold"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          <Button type="submit" fullWidth size="lg">
            Simpan Kategori
          </Button>
        </form>
      </Modal>
    </div>
  );
};
