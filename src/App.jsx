import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useConfirm } from './context/ConfirmContext';
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
import { modalRegistry } from './utils/modalRegistry';
import FireEducationModal from './components/FireEducationModal';
import SetupWizard from './components/SetupWizard';

function App() {
  const { confirm } = useConfirm();
  
  const [_currentView, _setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['dashboard', 'accounts', 'goals', 'fire', 'protection', 'simulation', 'settings', 'legal', 'admin'].includes(hash) ? hash : 'dashboard';
  });
  const currentView = _currentView;

  const setCurrentView = (view) => {
    if (view !== _currentView) {
      window.history.pushState({ view }, '', `#${view}`);
      _setCurrentView(view);
      window.scrollTo(0, 0);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [isWizardActive, setIsWizardActive] = useState(true);

  useEffect(() => {
    initializeGoogleDriveSync();

    // Set initial history state so we have a base state
    window.history.replaceState({ view: _currentView }, '', `#${_currentView}`);

    const handlePopState = async (e) => {
      // 1. If any modals are open, close the top one and push the current state back
      if (modalRegistry.hasModals()) {
        modalRegistry.pop();
        window.history.pushState({ view: _currentView }, '', `#${_currentView}`);
        return;
      }

      // 2. Otherwise navigate normally
      const stateView = e.state?.view;
      if (stateView) {
        _setCurrentView(stateView);
      } else {
        // e.state is null. Check if this was a programmatic hash assignment.
        const hashVal = window.location.hash.replace('#', '');
        const validViews = ['dashboard', 'accounts', 'goals', 'fire', 'protection', 'simulation', 'settings', 'legal', 'admin'];
        
        if (validViews.includes(hashVal)) {
          _setCurrentView(hashVal);
          window.history.replaceState({ view: hashVal }, '', `#${hashVal}`);
          return;
        }

        if (hashVal === 'add-asset' || hashVal === 'add-liab' || hashVal === 'add-cashflow' || hashVal.startsWith('edit-')) {
          // Programmatic sub-action. Attach the current view state so future navigations work smoothly.
          window.history.replaceState({ view: _currentView }, '', `#${hashVal}`);
          return;
        }

        // If there's no state (e.g. user pressed back beyond the initial state), we are at the edge
        // Trap the user and ask for exit confirmation
        // But to trap, we must immediately push state again to prevent browser from leaving
        window.history.pushState({ view: 'dashboard' }, '', '#dashboard');
        _setCurrentView('dashboard');
        
        if (await confirm('Are you sure you want to exit the application?', { title: 'Exit App', type: 'danger', confirmText: 'Yes, Exit' })) {
          // User confirmed exit
          // Since we pushed state, we need to go back twice (once for the push, once for actual exit)
          window.history.go(-2);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [confirm]);

  useEffect(() => {
    // Trigger Education Modal 30 seconds after wizard & auth popups are cleared
    if (!localStorage.getItem('hasSeenFireEdu') && !isWizardActive && !showAuth) {
      const timer = setTimeout(() => setShowEduModal(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [isWizardActive, showAuth]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
      case 'accounts': return <AccountsAndDebt />;
      case 'goals': return <GoalTracker />;
      case 'fire': return <FireDashboard setCurrentView={setCurrentView} />;
      case 'protection': return <Protection setCurrentView={setCurrentView} />;
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
          <AuthManager showAuth={showAuth} setShowAuth={setShowAuth} isWizardActive={isWizardActive} />

          {/* Layer 0: First-visit Guided Setup Wizard (new users only) */}
          <SetupWizard
            onComplete={(view) => { if (view) setCurrentView(view); setIsWizardActive(false); }}
            onSkip={() => { setIsWizardActive(false); }}
            onActive={(active) => setIsWizardActive(active)}
          />

          {/* Layer 1: PWA Install Prompt (Delays showing if Wizard or Auth is active) */}
          <InstallPrompt isWizardActive={isWizardActive} isAuthActive={showAuth} />

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
