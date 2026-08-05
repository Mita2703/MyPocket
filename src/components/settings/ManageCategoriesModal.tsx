import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Edit3, Trash2, HelpCircle } from 'lucide-react';
import { db, deleteCategoryAndMigrateTransactions } from '../../db/database';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import { CategoryIcon } from '../common/CategoryIcon';
import { Category, TransactionType } from '../../types';
import { CategoryFormModal } from './CategoryFormModal';
import { cn } from '../../utils/cn';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live query categories from Dexie
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  // Split categories
  const expenses = categories?.filter((c) => c.type === 'expense') || [];
  const incomes = categories?.filter((c) => c.type === 'income') || [];

  const handleFormSubmit = async (data: { name: string; type: TransactionType; icon: string; color: string }) => {
    if (selectedCategory) {
      // Edit
      await db.categories.update(selectedCategory.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
      });
    } else {
      // Add
      const newId = `custom_${Date.now()}`;
      await db.categories.add({
        id: newId,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        isDefault: false,
      });
    }
    setIsFormOpen(false);
    setSelectedCategory(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategoryAndMigrateTransactions(deletingCategory.id);
      setDeletingCategory(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddForm = () => {
    setSelectedCategory(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (cat: Category) => {
    setSelectedCategory(cat);
    setIsFormOpen(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Kategori Anggaran"
      size="md"
    >
      <div className="space-y-4">
        {/* Add Category Button */}
        <Button
          fullWidth
          onClick={openAddForm}
          leftIcon={<Plus size={16} />}
          className="shadow-sm text-xs py-2.5"
        >
          Tambah Kategori Baru
        </Button>

        {/* Categories List Container */}
        <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1 scrollbar-none">
          {/* Expenses Group */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-rose-700 uppercase tracking-widest px-1">
              Kategori Pengeluaran
            </h3>
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic px-1">Tidak ada kategori pengeluaran</p>
            ) : (
              <div className="space-y-1.5">
                {expenses.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    onEdit={() => openEditForm(cat)}
                    onDelete={() => setDeletingCategory(cat)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Incomes Group */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Kategori Pemasukan
            </h3>
            {incomes.length === 0 ? (
              <p className="text-xs text-slate-400 italic px-1">Tidak ada kategori pemasukan</p>
            ) : (
              <div className="space-y-1.5">
                {incomes.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    onEdit={() => openEditForm(cat)}
                    onDelete={() => setDeletingCategory(cat)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="outline"
          fullWidth
          onClick={onClose}
          className="text-xs text-slate-600 border-slate-200 mt-2"
        >
          Selesai
        </Button>
      </div>

      {/* Category Add/Edit Form Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCategory(undefined);
        }}
        editCategory={selectedCategory}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Hapus Kategori?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        description={
          deletingCategory ? (
            <div className="space-y-2 my-2">
              <p className="text-slate-500 text-xs">
                Apakah Anda yakin ingin menghapus kategori <span className="font-bold text-slate-800">"{deletingCategory.name}"</span>?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: deletingCategory.color }}
                >
                  <CategoryIcon name={deletingCategory.icon} size={15} />
                </div>
                <span className="text-xs font-bold text-slate-700">{deletingCategory.name}</span>
              </div>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">
                Catatan: Transaksi lama di kategori ini tidak akan hilang, melainkan dialihkan ke "Tanpa Kategori".
              </p>
            </div>
          ) : undefined
        }
      />
    </Modal>
  );
};

/* ── Internal Category Row Sub-component ──────────────────────── */
interface CategoryRowProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100/80 shadow-xs hover:border-rose-100 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Colored Icon Badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: category.color }}
        >
          <CategoryIcon name={category.icon} size={15} />
        </div>
        {/* Name */}
        <span className="text-xs font-bold text-slate-700 truncate">{category.name}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
          title="Edit Kategori"
        >
          <Edit3 size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Hapus Kategori"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
