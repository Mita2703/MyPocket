import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';

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

export function formatMonthReadable(monthYearStr: string): string {
  try {
    const [year, month] = monthYearStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy', { locale: id });
  } catch {
    return monthYearStr;
  }
}

export function getCurrentMonthYear(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export function getCurrentDateISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
