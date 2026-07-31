# Product Blueprint & Architecture (PRB) — MyPocket

**Nama Aplikasi:** MyPocket  
**Versi Docs:** 1.0  
**Target Platform:** Progressive Web App (PWA) — Mobile First  
**Arsitektur:** Client-side Only (Offline-First)

---

## 1. Overview & Arsitektur Utama

MyPocket dirancang sebagai aplikasi pencatat keuangan pribadi berbasis web yang dapat diinstal di smartphone (PWA) dan beroperasi 100% tanpa internet. Seluruh data disimpan pada database **IndexedDB** di browser pengguna menggunakan library **Dexie.js**.

```
┌──────────────────────────────────────────────────────────┐
│                   MyPocket PWA App                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ View Layer (React + TypeScript + Tailwind CSS)     │  │
│  └─────────────────────────┬──────────────────────────┘  │
│                            │ (Hooks & Context)           │
│  ┌─────────────────────────▼──────────────────────────┐  │
│  │ State / Live Query Layer (Dexie.js liveQuery)      │  │
│  └─────────────────────────┬──────────────────────────┘  │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐  │
│  │ Local Storage (IndexedDB Browser Storage)           │  │
│  └────────────────────────────────────────────────────┘  │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐  │
│  │ Service Worker (vite-plugin-pwa Asset Caching)     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack & Dependencies

| Kategori | Teknologi | Deskripsi / Fungsi |
|---|---|---|
| Framework | **React 18+ (TypeScript)** | Framework UI utama |
| Build Tool | **Vite** | Development server & bundler super cepat |
| Styling | **Tailwind CSS** | Utility-first CSS untuk responsive mobile design |
| Icon Set | **Lucide React** | Icon SVG minimalis & modern |
| Database | **Dexie.js** | Wrapper IndexedDB untuk kueri database lokal terstruktur |
| Visualisasi | **Recharts** | Library chart React untuk Pie Chart & Trend Graph |
| PWA Engine | **vite-plugin-pwa** | Service worker, manifest PWA, & caching offline |
| Form / Utility | **clsx**, **tailwind-merge**, **date-fns** | Helper utility CSS & penanganan format tanggal |

---

## 3. Desain Sistem & Design Tokens

### 3.1 Palet Warna (Dusty Rose Theme)

Warna dikonfigurasi dalam `tailwind.config.js` untuk konsistensi visual:

```javascript
theme: {
  extend: {
    colors: {
      rose: {
        50: '#FDF8F8',   // Background kartu tipis
        100: '#EEBAB7',  // Rose muda (Aksen icon / bg avatar)
        300: '#E68A8D',  // Rose medium (Progress bar active)
        500: '#C96068',  // Rose utama (Primary CTA button & main card)
        700: '#AB4543',  // Rose tua (Teks angka & icon kategori)
        900: '#9B4443',  // Rose paling gelap (Heading & Title)
      }
    }
  }
}
```

### 3.2 Typography & Spacing
- **Font Family:** Inter / Plus Jakarta Sans (Google Fonts)
- **Border Radius:** `rounded-2xl` (16px) untuk card & modal, `rounded-xl` (12px) untuk input/button.
- **Card Style:** Clean white background (`bg-white`), border tipis (`border border-slate-100`), tanpa shadow berat.

---

## 4. Skema Database Lokal (Dexie.js)

### 4.1 Tabel & Indeks

```typescript
// db/database.ts
import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string; // ISO String format YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isDefault: boolean;
}

export interface Budget {
  id?: number;
  categoryId: string;
  amountLimit: number;
  monthYear: string; // YYYY-MM
}

export class MyPocketDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;

  constructor() {
    super('MyPocketDB');
    this.version(1).stores({
      transactions: '++id, date, type, categoryId, [date+type]',
      categories: 'id, type, name',
      budgets: '++id, categoryId, monthYear, [categoryId+monthYear]',
    });
  }
}

export const db = new MyPocketDatabase();
```

---

## 5. Struktur Direktori Proyek

```
MyPocket/
├── public/
│   ├── favicon.ico
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/            # Reusable UI (Button, Card, Input, Modal, ProgressBar)
│   │   ├── dashboard/         # BalanceCard, QuickAddCTA, CategoryPieChart, RecentList
│   │   ├── transactions/      # TransactionFormModal, TransactionItem, TransactionFilter
│   │   ├── budget/            # BudgetCategoryCard, BudgetFormModal
│   │   └── layout/            # Header, BottomNavigation, PageContainer
│   ├── context/
│   │   └── PocketContext.tsx   # Global Context untuk state & aksi CRUD
│   ├── db/
│   │   ├── database.ts        # Inisialisasi Dexie.js & interface schema
│   │   └── defaultCategories.ts # Initial seed data untuk kategori
│   ├── hooks/
│   │   ├── useTransactions.ts # Custom hook live query transaksi
│   │   ├── useBudgets.ts      # Custom hook live query budget & kalkulasi
│   │   └── usePWA.ts          # Custom hook status installability PWA
│   ├── pages/
│   │   ├── DashboardPage.tsx  # Ringkasan utama
│   │   ├── TransactionsPage.tsx # List & Filter riwayat
│   │   ├── BudgetPage.tsx     # Pengelolaan budget per kategori
│   │   └── SettingsPage.tsx   # Reset data / Export CSV / Info App
│   ├── types/
│   │   └── index.ts           # Type definitions
│   ├── utils/
│   │   ├── currency.ts        # Helper format Rupiah (IDR)
│   │   └── date.ts            # Helper format tanggal (date-fns)
│   ├── App.tsx                # Main App Router / Tab Switcher
│   ├── index.css              # Tailwind imports & base styles
│   └── main.tsx               # App entry point
├── index.html
├── PRD_MyPocket.md            # Document PRD
├── PRB.md                     # Architecture & Execution Blueprint
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 6. Rancangan Komponen Frontend & Halaman

### 6.1 Layout Utama & Navigasi Bottom Bar
- **Bottom Navigation (Mobile-first):**
  - **Beranda (Dashboard):** Icon `LayoutDashboard`
  - **Transaksi:** Icon `Receipt`
  - **Anggaran (Budget):** Icon `PieChart` / `Wallet`
  - **Pengaturan:** Icon `Settings`
  - **Floating Action Button (FAB):** Tombol bulat Rose `+` di tengah navigasi bawah untuk cepat buka Form Transaksi Baru.

---

### 6.2 Halaman Dashboard (`DashboardPage.tsx`)
1. **Header:** Sapaan pengguna & Status Offline badge.
2. **Hero Balance Card (Rose Gradient):**
   - Sisa Saldo Bulan Ini (Besar & Kontras)
   - Sub-info: Total Pemasukan vs Total Pengeluaran bulan ini.
3. **Ringkasan Grafik (Tabs: Pie Category / Bar Trend):**
   - **Pie Chart:** Breakdown pengeluaran per kategori.
   - **Bar Chart:** Tren harian pengeluaran minggu ini.
4. **Budget Alert Widget:**
   - Menampilkan kategori yang budget-nya > 80% atau melebihi limit.
5. **Transaksi Terakhir:** 5 transaksi terbaru dengan tombol "Lihat Semua".

---

### 6.3 Halaman Transaksi (`TransactionsPage.tsx`)
1. **Filter & Search Bar:**
   - Search input (catatan)
   - Month Selector (`2026-07`)
   - Filter Type (Semua / Pemasukan / Pengeluaran)
   - Filter Kategori Dropdown
2. **List Transaksi Terkelompok:**
   - Grouped by Date (misal: "Hari ini", "Kemarin", "25 Juli 2026").
   - Swipe or Click for Edit/Delete actions.

---

### 6.4 Halaman Budget (`BudgetPage.tsx`)
1. **Ringkasan Total Budget:**
   - Total Terpakai vs Total Alokasi Budget Bulan Ini.
2. **Card Budget per Kategori:**
   - Nama & Icon Kategori
   - Progress Bar (Hijau < 70%, Kuning 70-90%, Merah > 90%)
   - Nominal Terpakai / Limit Budget
   - Tombol Edit Limit Budget.

---

### 6.5 Modal Input Transaksi (`TransactionFormModal.tsx`)
- Target waktu input **< 10 detik**.
- Toggle: **Pengeluaran / Pemasukan**
- Large Nominal Input dengan auto-format Rupiah.
- Grid Selector Kategori (Icon + Label, Sekali tap).
- Date Picker (Default: Hari ini).
- Input Catatan Opsional.
- Tombol Simpan (Besar, Rose Primary).

---

## 7. Strategi Offline-First & PWA

1. **Service Worker Configuration (`vite-plugin-pwa`):**
   - `registerType: 'autoUpdate'`
   - Pre-cache seluruh bundle JS, CSS, HTML, dan icon static.
   - Web App Manifest lengkap (`name`, `short_name`, `theme_color: '#C96068'`, `background_color: '#FFFFFF'`, `display: 'standalone'`).
2. **Persistence Data Check:**
   - Penanganan IndexedDB fallback jika browser dalam private/incognito mode.

---

## 8. Tahapan Eksekusi Frontend (Implementation Roadmap)

| Langkah | Deskripsi Pekerjaan | Output |
|---|---|---|
| **Langkah 1** | Inisialisasi Vite React TS, Tailwind CSS, Lucide Icons, Dexie, Recharts | Skeleton Project & Dependensi |
| **Langkah 2** | Setup Skema Database Dexie.js & Seed Data Kategori Default | `src/db/database.ts` |
| **Langkah 3** | Buat Helper Utilities (Format Rupiah & Tanggal) & Theme Config | `src/utils/` & `tailwind.config.js` |
| **Langkah 4** | Buat UI Components Reusable (Button, Card, Input, Modal, Progress) | `src/components/common/` |
| **Langkah 5** | Buat Layout Navigation (Header, Bottom Nav, FAB + Modal Form) | `src/components/layout/` |
| **Langkah 6** | Implementasi Dashboard, Transactions Page, & Budget Page | `src/pages/` |
| **Langkah 7** | Integrasi PWA Service Worker & Manifest | `vite.config.ts` & `public/` |
| **Langkah 8** | Verifikasi Build Production & Pengujian Offline | Executable Web App |

