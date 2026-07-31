import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  /** Current value (0–100+). Values > 100 will overflow to red state. */
  value: number;
  /** Category / budget label shown above-left */
  label?: string;
  /** Secondary label shown above-right (e.g. "Rp 200.000 / Rp 500.000") */
  subLabel?: string;
  /** Show percentage badge next to subLabel */
  showPercent?: boolean;
  /** Bar height Tailwind class. Defaults to `h-2.5` */
  height?: string;
  /** Animate the bar fill on mount */
  animated?: boolean;
  /** Override automatic color detection */
  colorOverride?: string;
}

/** Derive fill color from percentage (PRD § F4 spec): Green → Yellow → Red */
function getBarColor(pct: number): string {
  if (pct >= 100) return 'bg-rose-500';   // Over budget — solid rose
  if (pct >= 80)  return 'bg-amber-500';  // Warning — amber
  if (pct >= 60)  return 'bg-yellow-400'; // Caution  — yellow
  return 'bg-emerald-500';                // Safe     — green
}

/** Derive text color matching bar color */
function getTextColor(pct: number): string {
  if (pct >= 100) return 'text-rose-600';
  if (pct >= 80)  return 'text-amber-600';
  if (pct >= 60)  return 'text-yellow-600';
  return 'text-emerald-600';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subLabel,
  showPercent = true,
  height = 'h-2.5',
  animated = true,
  colorOverride,
}) => {
  // Clamp display width at 100%; allow >100 for visual overflow indicator
  const pct = Math.max(0, value);
  const displayWidth = Math.min(pct, 100);
  const barColor = colorOverride ?? getBarColor(pct);
  const textColor = getTextColor(pct);
  const isOverBudget = pct >= 100;

  const hasHeader = !!(label || subLabel || showPercent);

  return (
    <div className="w-full space-y-1.5">
      {/* Header row */}
      {hasHeader && (
        <div className="flex items-center justify-between gap-2 text-xs font-medium">
          {/* Label (left) */}
          <span className="text-slate-700 truncate">{label}</span>

          {/* Right side: subLabel + percent */}
          <div className="flex items-center gap-1.5 shrink-0">
            {subLabel && (
              <span className="text-slate-400 text-[11px]">{subLabel}</span>
            )}
            {showPercent && (
              <span className={cn('font-bold text-[11px] tabular-nums', textColor)}>
                {Math.round(pct)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          'w-full bg-slate-100 rounded-full overflow-hidden',
          height
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* Fill */}
        <div
          className={cn(
            'h-full rounded-full',
            barColor,
            animated && 'transition-all duration-700 ease-out',
            isOverBudget && 'animate-pulse-soft',
          )}
          style={{ width: `${displayWidth}%` }}
        />
      </div>

      {/* Over-budget warning text */}
      {isOverBudget && (
        <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
          <span>⚠</span>
          <span>Budget terlampaui {Math.round(pct - 100)}%</span>
        </p>
      )}
    </div>
  );
};
