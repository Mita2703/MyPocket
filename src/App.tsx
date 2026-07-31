import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { BottomNavigation, ActiveTab } from './components/layout/BottomNavigation';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SettingsPage } from './pages/SettingsPage';
import { SavingsPage } from './pages/SavingsPage';
import { ensureSeedData } from './db/database';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    ensureSeedData();
  }, []);


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-xl">
      {/* Top Header */}
      <Header />

      {/* Main Page Body */}
      <main className="flex-1 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToBudget={() => setActiveTab('budget')}
          />
        )}
        {activeTab === 'transactions' && <TransactionsPage />}
        {activeTab === 'budget'       && <BudgetPage />}
        {activeTab === 'savings'      && <SavingsPage />}
        {activeTab === 'settings'     && <SettingsPage />}
      </main>

      {/* Quick Add Transaction Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Bottom Navigation & FAB */}
      <BottomNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />
    </div>
  );
}

export default App;
