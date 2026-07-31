import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  /** Visibility state */
  isOpen: boolean;
  /** Called when user dismisses the modal */
  onClose: () => void;
  /** Title shown in the modal header */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /**
   * Size of the modal panel:
   * - `sm`   — up to 24rem (384px)
   * - `md`   — up to 32rem (512px) [default]
   * - `lg`   — up to 42rem (672px)
   * - `full` — fills available height
   */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Hide the header bar entirely */
  hideHeader?: boolean;
}

const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  full: 'max-w-lg max-h-[95vh]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideHeader = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll & restore on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      {/* Dimmed overlay */}
      <div className="absolute inset-0 bg-slate-900/50 glass-dark animate-fade-in" />

      {/* Panel */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-10 w-full bg-white shadow-2xl overflow-y-auto',
          // Mobile: bottom sheet; Desktop: centered dialog
          'rounded-t-3xl sm:rounded-3xl',
          'max-h-[92vh]',
          sizes[size],
          // Enter animation
          'animate-slide-up sm:animate-scale-in',
        )}
      >
        {/* Header */}
        {!hideHeader && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 bg-white rounded-t-3xl">
            {/* Drag handle (mobile) */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full sm:hidden" />

            <h2 className="text-base font-bold text-slate-800 mt-1 sm:mt-0">{title}</h2>

            <button
              onClick={onClose}
              className="p-2 -mr-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
};
