import React, { useState, useEffect } from 'react';
import { Wallet, WifiOff, Wifi, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatMonthReadable, getCurrentMonthYear } from '../../utils/date';

interface HeaderProps {
  /** App title override */
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'MyPocket' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status for indicator
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentMonthLabel = formatMonthReadable(getCurrentMonthYear());

  return (
    <header
      className={cn(
        'sticky top-0 z-40 glass border-b border-slate-100/80',
        'px-4 pt-3 pb-2.5',
      )}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left — Logo + App Name */}
        <div className="flex items-center gap-2.5">
          {/* App icon */}
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              'bg-rose-gradient text-white shadow-rose/40 shadow-md shrink-0',
            )}
          >
            <Wallet size={18} strokeWidth={2.2} />
          </div>

          {/* Title & subtitle */}
          <div className="leading-tight">
            <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">
              {title}
            </h1>
            <p className="text-[11px] font-medium text-rose-600">
              {currentMonthLabel}
            </p>
          </div>
        </div>

        {/* Right — status badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
            isOnline
              ? 'bg-rose-50 text-rose-700'
              : 'bg-slate-100 text-slate-500',
          )}
          title={isOnline ? 'Tersambung' : 'Mode Offline — data tetap aman di perangkat'}
        >
          {isOnline
            ? <Wifi size={12} className="text-rose-500" />
            : <WifiOff size={12} className="text-rose-500" />
          }
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};
