export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: number;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name string
  color: string; // Hex or Tailwind color class
  type: TransactionType;
  isDefault: boolean;
}

export interface Budget {
  id?: number;
  categoryId: string;
  amountLimit: number;
  monthYear: string; // YYYY-MM
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/** A savings target (e.g. "Beli Laptop", "Liburan Bali") */
export interface SavingGoal {
  id?: number;
  name: string;          // e.g. "Laptop Gaming"
  targetAmount: number;  // Nominal yang ingin dicapai
  targetDate?: string;   // YYYY-MM-DD, opsional
  emoji?: string;        // Emoji ikon (e.g. "💻"), optional
  photo?: string;        // Base64 string of photo, optional
  createdAt: string;
}

/** A single top-up entry for a saving goal */
export interface SavingEntry {
  id?: number;
  goalId: number;        // FK → SavingGoal.id
  amount: number;        // Nominal yang ditabung
  note?: string;
  date: string;          // YYYY-MM-DD
  createdAt: string;
}
