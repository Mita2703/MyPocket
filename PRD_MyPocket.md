# Product Requirements Document (PRD)
## Pocketly — Personal Expense Tracker

**Versi:** 1.0
**Tanggal:** 31 Juli 2026
**Pemilik Produk:** Personal Project (single user)

---

## 1. Overview

**Pocketly** adalah aplikasi pencatat keuangan pribadi berbasis Progressive Web App (PWA) yang dirancang untuk digunakan sepenuhnya secara offline. Aplikasi ini ditujukan untuk penggunaan personal (single user), tanpa backend/server, dengan seluruh data tersimpan langsung di perangkat pengguna.

### 1.1 Latar Belakang
Sebagai pelajar, dibutuhkan cara cepat dan praktis untuk mencatat serta memantau pengeluaran sehari-hari tanpa ketergantungan koneksi internet, tanpa proses registrasi/login yang rumit, dan tanpa risiko data finansial pribadi tersebar ke server pihak ketiga.

### 1.2 Tujuan Produk
- Menyediakan cara cepat untuk mencatat transaksi keuangan harian
- Memberikan visualisasi pengeluaran yang mudah dipahami 
- Membantu pengguna mengontrol pengeluaran melalui sistem budget per kategori
- Dapat digunakan sepenuhnya tanpa koneksi internet (offline-first)
- Dapat diinstal di HP layaknya aplikasi native

---

## 2. Target Pengguna

| Atribut | Detail |
|---|---|
| Jumlah pengguna | 1 (single user, personal use) |
| Profil | Mahasiswa |
| Device utama | Smartphone (Android/iOS) |
| Kebutuhan koneksi | Tidak wajib online setelah instalasi |

---

## 3. Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | React + TypeScript | Dibangun dengan Vite |
| Build tool | Vite | Build cepat, ringan |
| Styling | Tailwind CSS | Mobile-first styling |
| PWA | `vite-plugin-pwa` | Service worker, manifest, installable |
| Database | Dexie.js (IndexedDB) | Database lokal di perangkat, tanpa server |
| Visualisasi | Recharts | Pie chart & bar/line chart |
| State management | React Context + useReducer | Cukup untuk skala aplikasi personal |
| Backend | **Tidak ada** | 100% client-side |
| Hosting/Deploy | Vercel / Netlify | Gratis, hanya untuk serve static file |

---

## 4. Desain Visual — Palet Warna

Tema warna yang digunakan adalah **dusty rose/rose gold** dengan latar putih — memberikan kesan hangat, elegan, dan lembut tanpa terkesan kekanakan.

| Warna | Hex | Fungsi |
|---|---|---|
| Putih | `#FFFFFF` | Background utama aplikasi |
| Dusty rose muda | `#EEBAB7` | Aksen icon, avatar, background icon kategori |
| Rose medium | `#E68A8D` | Progress bar aktif (budget) |
| Rose utama | `#C96068` | Kartu saldo, tombol utama (CTA) |
| Rose tua | `#AB4543` | Icon kategori, teks angka penting |
| Rose paling gelap | `#9B4443` | Teks judul/heading |

**Prinsip penggunaan:**
- Background dominan putih agar tampilan tetap bersih dan ringan
- Warna rose dipakai sebagai aksen pada elemen kunci: kartu saldo, tombol, progress bar, dan icon kategori
- Kartu/list menggunakan border tipis (bukan shadow berat) agar tetap terasa modern dan tidak "kaku"
- Kontras teks tetap dijaga agar keterbacaan angka nominal (elemen paling penting di app finansial) tetap jelas

---

## 5. Ruang Lingkup Fitur

### 4.1 Fitur MVP (Wajib — Fase 1)

#### F1. Input Transaksi
- Input nominal, jenis (pemasukan/pengeluaran), kategori, tanggal, catatan opsional
- Kategori default: Makan, Transport, Jajan/Hiburan, Kos/Sewa, Pendidikan, Kesehatan, Lain-lain
- Form dioptimalkan untuk input cepat (minim tap/ketik)

**Acceptance Criteria:**
- Pengguna dapat menambah transaksi dalam waktu < 10 detik
- Data tersimpan langsung ke IndexedDB tanpa perlu koneksi internet
- Validasi nominal harus berupa angka positif

#### F2. Riwayat Transaksi
- Daftar transaksi dikelompokkan berdasarkan tanggal
- Fitur edit dan hapus transaksi
- Filter berdasarkan kategori dan rentang tanggal

**Acceptance Criteria:**
- List transaksi ter-update otomatis setelah tambah/edit/hapus
- Filter dapat dikombinasikan (kategori + tanggal)

#### F3. Dashboard Ringkasan
- Total pemasukan, pengeluaran, dan sisa saldo bulan berjalan
- Pie chart breakdown pengeluaran per kategori
- Grafik tren pengeluaran harian/mingguan

**Acceptance Criteria:**
- Data dashboard sesuai dengan data transaksi periode yang dipilih
- Chart responsif di layar mobile

#### F4. Budget per Kategori
- Set limit budget bulanan untuk tiap kategori
- Progress bar visual (hijau → kuning → merah mendekati/melebihi limit)

**Acceptance Criteria:**
- Progress bar ter-update real-time saat ada transaksi baru
- Notifikasi visual saat budget kategori terlampaui

---

### 4.2 Fitur Lanjutan (Fase 2 — Opsional)

| Fitur | Deskripsi |
|---|---|
| Saldo Multi-Sumber | Pemisahan pantauan saldo cash, e-wallet, rekening bank |
| Recurring Transaction | Transaksi rutin bulanan otomatis tercatat (kos, langganan) |
| Goal Saving | Target nabung dengan progress tracker |
| Notifikasi Lokal | Reminder input harian & alert budget mendekati limit |
| Export CSV | Backup manual data transaksi |

### 4.3 Fitur Advanced (Fase 3 — Eksploratif)

| Fitur | Deskripsi |
|---|---|
| Scan Struk (OCR) | Ekstraksi nominal & kategori otomatis dari foto struk (Tesseract.js) |
| Insight Otomatis | Analisis tren pengeluaran & rekomendasi hemat |
| Dark Mode & Kustomisasi | Tema & kategori/icon custom |

---

## 6. Arsitektur Sistem

```
┌─────────────────────────────────────┐
│         Pocketly (PWA)               │
│                                       │
│  ┌─────────────┐   ┌──────────────┐  │
│  │  React UI   │──▶│  Dexie.js    │  │
│  │ (TypeScript)│◀──│ (IndexedDB)  │  │
│  └─────────────┘   └──────────────┘  │
│         │                            │
│  ┌──────▼──────┐                     │
│  │Service Worker│  (offline caching) │
│  └─────────────┘                     │
└─────────────────────────────────────┘
        Tidak ada server/backend
        Semua data tersimpan lokal di device
```

**Catatan penting:** Karena tidak ada backend, tidak ada sinkronisasi data antar perangkat. Jika perangkat hilang/rusak/reset tanpa backup manual (export CSV), data akan hilang secara permanen.

---

## 7. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| Offline capability | Aplikasi harus dapat dibuka & digunakan penuh tanpa internet setelah instalasi awal |
| Installability | Dapat di-"Add to Home Screen" dari browser mobile (Chrome/Safari) |
| Performa | Waktu load awal < 3 detik pada koneksi 4G |
| Ukuran aplikasi | Kode aplikasi ringan (~1-2 MB), tidak bertambah seiring pemakaian |
| Privasi data | Seluruh data finansial tidak pernah dikirim ke server manapun |
| Kompatibilitas | Mendukung browser mobile modern (Chrome, Safari terbaru) |

---

## 8. Out of Scope

- Multi-user / kolaborasi
- Login & autentikasi
- Sinkronisasi cloud / backup otomatis (kecuali export manual)
- Publikasi ke Play Store / App Store
- Integrasi langsung dengan rekening bank/e-wallet

---

## 9. Roadmap Implementasi

| Fase | Fokus | Estimasi |
|---|---|---|
| Fase 1 | Setup project, PWA config, F1-F4 (MVP) | Prioritas utama |
| Fase 2 | Fitur lanjutan sesuai kebutuhan pemakaian nyata | Setelah MVP dipakai rutin |
| Fase 3 | Fitur eksploratif (OCR, insight otomatis) | Opsional, jangka panjang |

---

## 10. Metrik Keberhasilan (Personal)

- Aplikasi digunakan secara konsisten (input transaksi harian) minimal 4 minggu berturut-turut
- Pengguna dapat memantau sisa budget bulanan tanpa perlu aplikasi/spreadsheet lain
- Tidak ada kehilangan data akibat bug penyimpanan lokal
