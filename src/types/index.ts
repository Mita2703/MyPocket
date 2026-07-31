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
