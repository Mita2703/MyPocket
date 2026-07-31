import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style preset:
   * - `default` — white card with subtle border & shadow
   * - `rose`    — rose gradient hero card (Saldo)
   * - `flat`    — borderless slate background
   * - `outline` — transparent with border only
   */
  variant?: 'default' | 'rose' | 'flat' | 'outline';
  /** Animate in using fade-up on mount */
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  animate = false,
  className,
  ...props
}) => {
  const base = 'rounded-2xl transition-all duration-200';

  const variants = {
    default: 'bg-white border border-slate-100/80 shadow-card p-4 text-slate-800',
    rose: [
      'bg-gradient-to-br from-rose-500 via-[#C05060] to-rose-700',
      'text-white shadow-rose p-5',
    ].join(' '),
    flat:    'bg-slate-50 border border-slate-200/60 p-4 text-slate-800',
    outline: 'bg-transparent border border-slate-200 p-4 text-slate-800',
  };

  return (
    <div
      className={cn(
        base,
        variants[variant],
        animate && 'animate-fade-up',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
