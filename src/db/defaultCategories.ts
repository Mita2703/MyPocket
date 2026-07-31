import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran (Expenses)
  { id: 'makan', name: 'Makan & Minum', icon: 'Utensils', color: '#E68A8D', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Transportasi', icon: 'Car', color: '#AB4543', type: 'expense', isDefault: true },
  { id: 'jajan', name: 'Jajan & Hiburan', icon: 'Gamepad2', color: '#C96068', type: 'expense', isDefault: true },
  { id: 'kos', name: 'Kos & Sewa', icon: 'Home', color: '#9B4443', type: 'expense', isDefault: true },
  { id: 'pendidikan', name: 'Pendidikan', icon: 'GraduationCap', color: '#8B3A3A', type: 'expense', isDefault: true },
  { id: 'kesehatan', name: 'Kesehatan', icon: 'HeartPulse', color: '#EEBAB7', type: 'expense', isDefault: true },
  { id: 'belanja', name: 'Belanja Harian', icon: 'ShoppingBag', color: '#D9777F', type: 'expense', isDefault: true },
  { id: 'lain_pengeluaran', name: 'Pengeluaran Lain', icon: 'MoreHorizontal', color: '#9CA3AF', type: 'expense', isDefault: true },

  // Pemasukan (Income)
  { id: 'uang_saku', name: 'Uang Saku', icon: 'Wallet', color: '#10B981', type: 'income', isDefault: true },
  { id: 'gaji', name: 'Gaji / Beasiswa', icon: 'Briefcase', color: '#059669', type: 'income', isDefault: true },
  { id: 'freelance', name: 'Freelance / Usaha', icon: 'Laptop', color: '#047857', type: 'income', isDefault: true },
  { id: 'lain_pemasukan', name: 'Pemasukan Lain', icon: 'PlusCircle', color: '#6EE7B7', type: 'income', isDefault: true },
];
