import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label displayed above the input */
  label?: string;
  /** Error message shown below the input in red */
  error?: string;
  /** Helper text shown below the input in gray */
  hint?: string;
  /** Node placed inside the input on the left (icon or prefix text) */
  leftAddon?: React.ReactNode;
  /** Node placed inside the input on the right (icon or clear button) */
  rightAddon?: React.ReactNode;
  /** Wrapper className */
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  wrapperClassName,
  className,
  id,
  ...props
}) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('w-full space-y-1.5', wrapperClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        {/* Left addon */}
        {leftAddon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftAddon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'w-full bg-slate-50 border rounded-xl py-2.5 text-sm font-medium text-slate-800',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white focus:border-rose-300',
            'transition-all duration-200',
            // Error state
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
              : 'border-slate-200',
            // Padding based on addons
            leftAddon  ? 'pl-10' : 'pl-3.5',
            rightAddon ? 'pr-10' : 'pr-3.5',
            className
          )}
          {...props}
        />

        {/* Right addon */}
        {rightAddon && (
          <div className="absolute right-3.5 flex items-center text-slate-400">
            {rightAddon}
          </div>
        )}
      </div>

      {/* Error / hint message */}
      {error ? (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
};
