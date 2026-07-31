import React from 'react';
import { LayoutDashboard, Receipt, PieChart, Settings, Plus, PiggyBank } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ActiveTab = 'dashboard' | 'transactions' | 'budget' | 'settings' | 'savings';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

interface BottomNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

/** Left 2 tabs: Beranda, Transaksi */
const LEFT_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Beranda',   icon: LayoutDashboard },
  { id: 'transactions', label: 'Transaksi', icon: Receipt },
];

/** Right 3 tabs: Tabungan, Anggaran, Pengaturan */
const RIGHT_ITEMS: NavItem[] = [
  { id: 'savings',  label: 'Tabungan',   icon: PiggyBank },
  { id: 'budget',   label: 'Anggaran',   icon: PieChart },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'glass border-t border-slate-100/80',
        'px-1 pt-1.5 pb-safe',
        'shadow-[0_-1px_16px_rgba(0,0,0,0.06)]',
      )}
      aria-label="Navigasi utama"
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* ── Left 2 tab items ─────────────────────────────────── */}
        {LEFT_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}

        {/* ── Center FAB ───────────────────────────────────────── */}
        <div className="relative -top-5 shrink-0" aria-hidden="false">
          <button
            id="fab-add-transaction"
            onClick={onOpenAddModal}
            aria-label="Tambah transaksi baru"
            className={cn(
              'w-14 h-14 rounded-full',
              'bg-rose-gradient text-white',
              'flex items-center justify-center',
              'shadow-fab',
              'border-4 border-slate-50',
              'active:scale-90 hover:scale-105',
              'transition-transform duration-150',
              'ring-2 ring-rose-200 ring-offset-2 ring-offset-slate-50',
            )}
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Right 3 tab items ────────────────────────────────── */}
        {RIGHT_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </div>
    </nav>
  );
};

/* ── Internal NavButton sub-component ──────────────────────────── */
interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      id={`nav-${item.id}`}
      onClick={onClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-xl',
        'transition-all duration-200 select-none',
        'tap-feedback',
        isActive
          ? 'text-rose-600'
          : 'text-slate-400 hover:text-slate-600',
      )}
    >
      {/* Icon container — active state gets rose bg pill */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-7 rounded-lg transition-all duration-200',
          isActive && 'bg-rose-100',
        )}
      >
        <Icon
          size={18}
          strokeWidth={isActive ? 2.2 : 1.8}
          className={cn(isActive && 'text-rose-600')}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-[9px] font-medium leading-none transition-all',
          isActive && 'font-bold text-rose-600',
        )}
      >
        {item.label}
      </span>
    </button>
  );
};
