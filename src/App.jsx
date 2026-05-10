import React, { useEffect, useState } from 'react';
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
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 p-8 ml-64">
          {renderView()}
        </main>
      </div>
    </AppStateProvider>
  );
}

export default App;
