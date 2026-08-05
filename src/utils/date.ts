/**
 * date.ts — Helper utilities untuk format & manipulasi tanggal
 * Digunakan di seluruh komponen MyPocket
 */
import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format tanggal ISO menjadi string yang mudah dibaca dalam Bahasa Indonesia.
 * Contoh: "2026-07-31" → "Hari Ini" / "Kemarin" / "Kamis, 25 Juli 2026"
 */
export function formatDateReadable(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hari Ini';
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'EEEE, d MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
}

/**
 * Format tanggal ISO ke bentuk singkat.
 * Contoh: "2026-07-31" → "31 Jul"
 */
export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: id });
  } catch {
    return dateStr;
  }
}

/**
 * Format month-year string menjadi nama bulan + tahun yang mudah dibaca.
 * Contoh: "2026-07" → "Juli 2026"
 */
export function formatMonthReadable(monthYearStr: string): string {
  try {
    const [year, month] = monthYearStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy', { locale: id });
  } catch {
    return monthYearStr;
  }
}

/**
 * Mendapatkan string bulan-tahun saat ini dalam format YYYY-MM.
 * Contoh: "2026-07"
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Mendapatkan tanggal hari ini dalam format ISO YYYY-MM-DD.
 * Contoh: "2026-07-31"
 */
export function getCurrentDateISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Mendapatkan array tanggal ISO untuk 7 hari terakhir (inklusif hari ini).
 * Contoh: ["2026-07-25", ..., "2026-07-31"]
 */
export function getLast7DaysISO(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    subDays(new Date(), 6 - i).toISOString().slice(0, 10)
  );
}

/**
 * Mendapatkan array semua tanggal dalam bulan tertentu.
 * Contoh: "2026-07" → ["2026-07-01", ..., "2026-07-31"]
 */
export function getDaysInMonth(monthYear: string): string[] {
  try {
    const [year, month] = monthYear.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end }).map((d) => d.toISOString().slice(0, 10));
  } catch {
    return [];
  }
}

/**
 * Bandingkan apakah sebuah tanggal ISO ada di bulan yang sama (YYYY-MM).
 * Contoh: "2026-07-15" di "2026-07" → true
 */
export function isInMonth(dateISO: string, monthYear: string): boolean {
  return dateISO.startsWith(monthYear);
}

/**
 * Format durasi hari yang lalu secara relatif & singkat.
 * Contoh: "2026-07-30" → "1 hari lalu"
 */
export function formatRelativeDay(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hari ini';
    if (isYesterday(date)) return 'Kemarin';
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} hari lalu`;
  } catch {
    return dateStr;
  }
}
