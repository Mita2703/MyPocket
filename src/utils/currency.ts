/**
 * Format a numeric amount to Indonesian Rupiah currency string (IDR)
 * Example: 50000 -> "Rp 50.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number cleanly without currency symbol for input display
 * Example: 50000 -> "50.000"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Parse string with dots/commas to clean integer number
 */
export function parseRawAmount(input: string): number {
  const cleanStr = input.replace(/[^0-9]/g, '');
  return parseInt(cleanStr, 10) || 0;
}
