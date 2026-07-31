import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size preset */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Stretch to full container width */
  fullWidth?: boolean;
  /** Show loading spinner in place of content */
  isLoading?: boolean;
  /** Icon placed before children */
  leftIcon?: React.ReactNode;
  /** Icon placed after children */
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const base = [
    'inline-flex items-center justify-center font-semibold rounded-xl',
    'transition-all duration-150 select-none',
    'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
  ];

  const variants = {
    primary:   'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-200/60 hover:shadow-rose-300/60',
    secondary: 'bg-rose-100 text-rose-900 hover:bg-rose-200',
    outline:   'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200/60',
  };

  const sizes = {
    xs: 'h-7  px-2.5 text-[11px] gap-1',
    sm: 'h-8  px-3   text-xs     gap-1.5',
    md: 'h-10 px-4   text-sm     gap-2',
    lg: 'h-12 px-6   text-base   gap-2.5',
  };

  return (
    <button
      className={cn(
        ...base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          {/* Spinner */}
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Menyimpan...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
