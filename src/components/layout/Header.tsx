import React from 'react';
import { Wallet, WifiOff } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'MyPocket' }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold shadow-xs">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">{title}</h1>
            <p className="text-[11px] font-medium text-rose-700">Offline Personal Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
          <WifiOff size={12} className="text-rose-500" />
          <span>Lokal DB</span>
        </div>
      </div>
    </header>
  );
};
