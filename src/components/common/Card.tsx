import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'rose' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const variants = {
    default: 'bg-white border border-slate-100/80 shadow-sm p-4 text-slate-800',
    rose: 'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white shadow-lg shadow-rose-200/50 p-5',
    flat: 'bg-slate-50 border border-slate-200/60 p-4 text-slate-800',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};
