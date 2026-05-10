import React, { useEffect, useState } from 'react';
import { Menu, PieChart } from 'lucide-react';
import { AppStateProvider } from './context/AppStateContext';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import AccountsAndDebt from './components/AccountsAndDebt';
import GoalTracker from './components/GoalTracker';
import Protection from './components/Protection';
import Simulation from './components/Simulation';
import Settings from './components/Settings';
import { initializeGoogleDriveSync } from './utils/gdrive';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeGoogleDriveSync();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'accounts': return <AccountsAndDebt />;
      case 'goals': return <GoalTracker />;
      case 'protection': return <Protection />;
      case 'simulation': return <Simulation />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppStateProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600">
             <PieChart size={24} /> 
             <span className="font-bold text-lg tracking-tight">FinGoal OS</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </div>

        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />
        
        <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64 mt-14 md:mt-0 max-w-[100vw] overflow-x-hidden">
          {renderView()}
        </main>
      </div>
    </AppStateProvider>
  );
}

export default App;
