import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '../../utils/cn';

interface CategoryIconProps {
  /** Lucide icon name string (e.g. "Utensils", "Car", "Home") */
  name: string;
  /** Icon size in px */
  size?: number;
  /** Additional className for the icon element */
  className?: string;
  /**
   * If true, wraps the icon in a colored circle badge.
   * Requires `badgeColor` to be set.
   */
  withBadge?: boolean;
  /** Background color for the badge (hex or CSS color string) */
  badgeColor?: string;
  /** Badge size in Tailwind classes. Defaults to "w-10 h-10" */
  badgeSize?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 20,
  className,
  withBadge = false,
  badgeColor,
  badgeSize = 'w-10 h-10',
}) => {
  // Dynamically resolve the Lucide icon by name; fall back to Circle
  const IconComponent = (
    Icons as unknown as Record<string, React.ElementType>
  )[name] ?? Icons.Circle;

  const icon = (
    <IconComponent
      size={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    />
  );

  if (!withBadge) return icon;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl text-white shadow-sm shrink-0',
        badgeSize
      )}
      style={{ backgroundColor: badgeColor ?? '#C96068' }}
    >
      <IconComponent size={size} aria-hidden="true" />
    </div>
  );
};
