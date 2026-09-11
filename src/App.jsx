import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import InstallPrompt from './components/InstallPrompt';
import { AppStateProvider } from './context/AppStateContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AuthManager from './components/AuthManager';
import AccountsAndDebt from './components/AccountsAndDebt';
import GoalTracker from './components/GoalTracker';
import Protection from './components/Protection';
import Simulation from './components/Simulation';
import FireDashboard from './components/FireDashboard';
import Settings from './components/Settings';
import LegalPage from './components/LegalPage';
import AdminDashboard from './components/AdminDashboard';
import { initializeGoogleDriveSync } from './utils/gdrive';
import { WelcomeBanner } from './components/Onboarding';
import FireEducationModal from './components/FireEducationModal';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    return window.location.hash === '#legal' ? 'legal' : 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(() => !!localStorage.getItem('fingoal_welcome_dismissed_v1'));
  const [showEduModal, setShowEduModal] = useState(false);

  useEffect(() => {
    initializeGoogleDriveSync();

    const handleHashChange = () => {
      if (window.location.hash === '#legal') setCurrentView('legal');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Trigger Education Modal 30 seconds after welcome & auth popups are cleared
    if (!localStorage.getItem('hasSeenFireEdu') && welcomeDone && !showAuth) {
      const timer = setTimeout(() => setShowEduModal(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [welcomeDone, showAuth]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
      case 'accounts': return <AccountsAndDebt />;
      case 'goals': return <GoalTracker />;
      case 'fire': return <FireDashboard />;
      case 'protection': return <Protection />;
      case 'simulation': return <Simulation />;
      case 'settings': return <Settings setCurrentView={setCurrentView} />;
      case 'legal': return <LegalPage />;
      case 'admin': return <AdminDashboard setCurrentView={setCurrentView} />;
      default: return <Dashboard />;
    }
  };

  return (
    <AuthProvider>
      <AppStateProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
          <AuthManager showAuth={showAuth} setShowAuth={setShowAuth} welcomeDone={welcomeDone} />

          {/* Layer 1: First-visit Welcome Banner */}
          <WelcomeBanner onNavigate={(view) => setCurrentView(view)} onComplete={() => setWelcomeDone(true)} />

          {/* Layer 2: PWA Install Prompt */}
          <InstallPrompt />

          {/* Mobile Header */}
          <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 px-4 py-3 flex items-center justify-start gap-3 shadow-sm">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Wealth For FIRE</span>
            </div>
          </div>

          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            isMobileOpen={isMobileMenuOpen}
            setIsMobileOpen={setIsMobileMenuOpen}
            showAuth={showAuth}
            setShowAuth={setShowAuth}
          />

          <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64 mt-14 md:mt-0 pb-24 md:pb-8 max-w-[100vw] overflow-x-hidden">
            {renderView()}
          </main>

          <BottomNav currentView={currentView} setCurrentView={setCurrentView} setIsMobileOpen={setIsMobileMenuOpen} />
          
          {/* Layer 3: Educational Modal */}
          <FireEducationModal isOpen={showEduModal} onClose={() => { setShowEduModal(false); localStorage.setItem('hasSeenFireEdu', 'true'); }} />
        </div>
      </AppStateProvider>
    </AuthProvider>
  );
}

export default App;
