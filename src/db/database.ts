import Dexie, { Table } from 'dexie';
import { Transaction, Category, Budget, SavingGoal, SavingEntry } from '../types';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export class MyPocketDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;
  savingGoals!: Table<SavingGoal>;
  savingEntries!: Table<SavingEntry>;

  constructor() {
    super('MyPocketDB');

    // v1 — original schema
    this.version(1).stores({
      transactions: '++id, date, type, categoryId, [date+type]',
      categories: 'id, type, name',
      budgets: '++id, categoryId, monthYear, [categoryId+monthYear]',
    });

    // v2 — adds saving goals & entries
    this.version(2).stores({
      transactions: '++id, date, type, categoryId, [date+type]',
      categories: 'id, type, name',
      budgets: '++id, categoryId, monthYear, [categoryId+monthYear]',
      savingGoals: '++id, createdAt',
      savingEntries: '++id, goalId, date',
    });

    // Populate initial categories if empty
    this.on('populate', async () => {
      await this.categories.bulkAdd(DEFAULT_CATEGORIES);

      // Add sample initial budgets for the current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await this.budgets.bulkAdd([
        { categoryId: 'makan', amountLimit: 1200000, monthYear: currentMonth },
        { categoryId: 'transport', amountLimit: 300000, monthYear: currentMonth },
        { categoryId: 'jajan', amountLimit: 400000, monthYear: currentMonth },
        { categoryId: 'kos', amountLimit: 800000, monthYear: currentMonth },
      ]);

      // Seed initial sample transactions for demonstration simulation
      const today = new Date();
      const formatIsoDate = (d: Date) => d.toISOString().slice(0, 10);

      const d1 = new Date(today);
      const d2 = new Date(today); d2.setDate(today.getDate() - 1);
      const d3 = new Date(today); d3.setDate(today.getDate() - 2);
      const d4 = new Date(today); d4.setDate(today.getDate() - 4);

      await this.transactions.bulkAdd([
        { amount: 2500000, type: 'income', categoryId: 'uang_saku', date: formatIsoDate(d4), note: 'Transfer bulanan ortu', createdAt: new Date().toISOString() },
        { amount: 800000, type: 'expense', categoryId: 'kos', date: formatIsoDate(d4), note: 'Bayar kos bulanan', createdAt: new Date().toISOString() },
        { amount: 35000, type: 'expense', categoryId: 'makan', date: formatIsoDate(d3), note: 'Nasi goreng & es teh', createdAt: new Date().toISOString() },
        { amount: 20000, type: 'expense', categoryId: 'transport', date: formatIsoDate(d2), note: 'Bensin motor', createdAt: new Date().toISOString() },
        { amount: 45000, type: 'expense', categoryId: 'jajan', date: formatIsoDate(d1), note: 'Kopi & camilan nugas', createdAt: new Date().toISOString() },
        { amount: 25000, type: 'expense', categoryId: 'makan', date: formatIsoDate(d1), note: 'Makan siang kantin', createdAt: new Date().toISOString() },
      ]);
    });
  }
}

export const db = new MyPocketDatabase();

// Helper to ensure database has default categories and initial seed data
export async function ensureSeedData() {
  try {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    }
  } catch (err) {
    console.error('Failed to seed default categories:', err);
  }
}
