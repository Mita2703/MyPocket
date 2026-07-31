import React from 'react';
import { LayoutDashboard, Receipt, PieChart, Settings, Plus } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'transactions' | 'budget' | 'settings';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Transaksi', icon: Receipt },
    { id: 'budget' as ActiveTab, label: 'Anggaran', icon: PieChart },
    { id: 'settings' as ActiveTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Left 2 Items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* Center Floating Add Button (FAB) */}
        <div className="relative -top-5">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-300 active:scale-95 transition-all duration-150 border-4 border-slate-50"
            aria-label="Tambah Transaksi Baru"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right 2 Items */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
