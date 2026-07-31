import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100+
  label?: string;
  subLabel?: string;
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subLabel,
  showPercent = true,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  // Dynamic progress bar color based on PRD specifications (Green -> Yellow -> Red)
  let colorClass = 'bg-emerald-500';
  if (clampedValue >= 90) {
    colorClass = 'bg-rose-600 animate-pulse';
  } else if (clampedValue >= 70) {
    colorClass = 'bg-amber-500';
  }

  return (
    <div className="w-full">
      {(label || subLabel || showPercent) && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-700">{label}</span>
          <div className="flex items-center gap-2">
            {subLabel && <span className="text-slate-400">{subLabel}</span>}
            {showPercent && (
              <span className={`font-semibold ${clampedValue >= 90 ? 'text-rose-600' : 'text-slate-600'}`}>
                {Math.round(value)}%
              </span>
            )}
          </div>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
