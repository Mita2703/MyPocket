import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CategoryIcon } from '../common/CategoryIcon';
import { Category, TransactionType } from '../../types';
import { cn } from '../../utils/cn';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: Category;
  onSubmit: (data: { name: string; type: TransactionType; icon: string; color: string }) => Promise<void>;
}

// Curated list of financial & lifestyle icons from Lucide
const AVAILABLE_ICONS = [
  'Utensils', 'Car', 'Home', 'Gamepad2', 'GraduationCap', 
  'HeartPulse', 'ShoppingBag', 'Coins', 'Briefcase', 'Laptop', 
  'Wallet', 'Coffee', 'Bus', 'Shirt', 'Music', 'Gift', 
  'Smile', 'MoreHorizontal'
];

// Curated palette of Dusty Rose, Slate, Mauve, and warm Earthy tones
const AVAILABLE_COLORS = [
  '#C96068', // Rose utama
  '#AB4543', // Rose tua
  '#9B4443', // Rose paling gelap
  '#E68A8D', // Rose medium
  '#EEBAB7', // Rose muda / Blush
  '#D48C94', // Dusty rose
  '#9C6167', // Dark mauve
  '#6E4D50', // Warm slate
  '#B0A0A2', // Muted grey-brown
  '#6B7280', // Slate
  '#4B5563', // Slate tua
  '#8B5CF6'  // Purple-rose
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  editCategory,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingBag');
  const [selectedColor, setSelectedColor] = useState('#C96068');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill fields when editing
  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setType(editCategory.type);
      setSelectedIcon(editCategory.icon);
      setSelectedColor(editCategory.color);
    } else {
      setName('');
      setType('expense');
      setSelectedIcon('ShoppingBag');
      setSelectedColor('#C96068');
    }
  }, [editCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        icon: selectedIcon,
        color: selectedColor,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!editCategory;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <Input
          label="Nama Kategori"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Misal: Langganan Film, Kopi"
          required
          autoFocus
        />

        {/* Transaction Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              disabled={isEdit} // Prevent changing type during edit to keep data integrity
              onClick={() => setType('expense')}
              className={cn(
                'py-2 rounded-lg text-xs font-bold transition-all duration-150 text-center tap-feedback',
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-card font-extrabold'
                  : 'text-slate-500 hover:text-slate-700',
                isEdit && type !== 'expense' && 'opacity-50 cursor-not-allowed'
              )}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              disabled={isEdit}
              onClick={() => setType('income')}
              className={cn(
                'py-2 rounded-lg text-xs font-bold transition-all duration-150 text-center tap-feedback',
                type === 'income'
                  ? 'bg-white text-slate-800 shadow-card font-extrabold'
                  : 'text-slate-500 hover:text-slate-700',
                isEdit && type !== 'income' && 'opacity-50 cursor-not-allowed'
              )}
            >
              Pemasukan
            </button>
          </div>
          {isEdit && (
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Tipe transaksi tidak dapat diubah saat mengedit kategori.
            </p>
          )}
        </div>

        {/* Icon Picker Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Icon
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-100 rounded-xl scrollbar-none">
            {AVAILABLE_ICONS.map((iconName) => {
              const active = selectedIcon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded-xl transition-all border-2',
                    active
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                      : 'border-transparent text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <CategoryIcon name={iconName} size={18} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Picker Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Warna
          </label>
          <div className="grid grid-cols-6 gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
            {AVAILABLE_COLORS.map((hexColor) => {
              const active = selectedColor === hexColor;
              return (
                <button
                  key={hexColor}
                  type="button"
                  onClick={() => setSelectedColor(hexColor)}
                  className={cn(
                    'w-full aspect-square rounded-full transition-all flex items-center justify-center',
                    active ? 'ring-2 ring-offset-2 ring-rose-400' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: hexColor }}
                  title={hexColor}
                >
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-slate-600 border-slate-200"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isSubmitting}
            disabled={!name.trim()}
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
