/**
 * cn.ts — Class name utility (pengganti clsx + tailwind-merge)
 * Menggabungkan class names secara kondisional dan bersih.
 */

type ClassValue = string | number | boolean | null | undefined | ClassValue[];

/**
 * Gabungkan class names secara kondisional.
 * Menghapus nilai falsy, flatten arrays.
 * Contoh: cn('btn', isActive && 'btn-active', 'px-4') → 'btn btn-active px-4'
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat(Infinity as 0)
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ');
}
