/**
 * currency.ts — Format & parsing helpers untuk nilai keuangan Rupiah
 * Digunakan di seluruh komponen MyPocket
 */

/**
 * Format angka ke string Rupiah penuh.
 * Contoh: 50000 → "Rp 50.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka ke string singkat untuk kartu saldo besar.
 * Contoh: 1500000 → "Rp 1,5 jt" | 250000 → "Rp 250 rb"
 */
export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    const str = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `Rp ${str} jt`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    const str = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `Rp ${str} rb`;
  }
  return formatRupiah(amount);
}

/**
 * Format angka tanpa simbol mata uang, untuk display input.
 * Contoh: 50000 → "50.000"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Parse string dengan titik/koma menjadi integer bersih.
 * Contoh: "50.000" → 50000
 */
export function parseRawAmount(input: string): number {
  const cleanStr = input.replace(/[^0-9]/g, '');
  return parseInt(cleanStr, 10) || 0;
}

/**
 * Hitung warna progress bar berdasarkan persentase pengeluaran vs budget.
 * Sesuai spesifikasi PRD: Hijau → Kuning → Merah
 */
export function getProgressColor(pct: number): string {
  if (pct >= 100) return '#BE123C'; // rose-700
  if (pct >= 85)  return '#F43F5E'; // rose-500
  if (pct >= 60)  return '#FB7185'; // rose-400
  return '#FDA4AF';                  // rose-300
}

/**
 * Format persentase ke string.
 * Contoh: 72.567 → "72%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
