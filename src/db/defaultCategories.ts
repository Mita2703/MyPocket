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

  // Pemasukan (Income) - No green, cohesive Rose/Slate/Brown palette
  { id: 'uang_saku', name: 'Uang Saku', icon: 'Wallet', color: '#D48C94', type: 'income', isDefault: true },
  { id: 'gaji', name: 'Gaji / Beasiswa', icon: 'Briefcase', color: '#9C6167', type: 'income', isDefault: true },
  { id: 'freelance', name: 'Freelance / Usaha', icon: 'Laptop', color: '#6E4D50', type: 'income', isDefault: true },
  { id: 'lain_pemasukan', name: 'Pemasukan Lain', icon: 'PlusCircle', color: '#B0A0A2', type: 'income', isDefault: true },
];
