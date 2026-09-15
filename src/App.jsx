import React, { useEffect, useState, useRef } from 'react';
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
    const validViews = ['dashboard', 'accounts', 'goals', 'fire', 'protection', 'simulation', 'settings', 'legal', 'admin'];
    if (validViews.includes(hash)) return hash;
    
    // Deep linking support for sub-routes
    if (hash === 'add-asset' || hash === 'add-liab' || hash === 'add-cashflow' || hash.startsWith('edit-liab-')) return 'accounts';
    if (hash.startsWith('edit-goal-')) return 'goals';
    
    return 'dashboard';
  });
  const currentView = _currentView;
  const currentViewRef = useRef(_currentView);

  const setCurrentView = (view) => {
    if (view !== _currentView) {
      // Use replaceState instead of pushState for native-app style navigation.
      // This prevents building a massive back-stack of every tab clicked.
      window.history.replaceState({ view, appInitialized: true }, '', `#${view}`);
      _setCurrentView(view);
      currentViewRef.current = view;
      window.scrollTo(0, 0);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [isWizardActive, setIsWizardActive] = useState(true);

  useEffect(() => {
    initializeGoogleDriveSync();

    // ── 1. Create a History Trap at the Root ─────────────────────────────
    // To prevent the back button from abruptly exiting the app (and to show a confirmation),
    // we must guarantee a minimum of 2 history entries exist.
    // We unconditionally inject this on mount so that even after a page reload, 
    // the history immediately behind the current view is always the trap.
    const currentHash = window.location.hash.replace('#', '') || 'dashboard';
    window.history.replaceState({ trap: true, appInitialized: true }, '', '#trap');
    
    const isSubAction = ['add-asset', 'add-liab', 'add-cashflow'].includes(currentHash) || currentHash.startsWith('edit-');
    window.history.pushState({ view: currentViewRef.current, appInitialized: true }, '', isSubAction ? `#${currentHash}` : `#${currentViewRef.current}`);

    const handlePopState = async (e) => {
      // 1. If any modals are open, close the top one and push the current state back
      if (modalRegistry.hasModals()) {
        modalRegistry.pop();
        window.history.pushState({ view: currentViewRef.current, appInitialized: true }, '', `#${currentViewRef.current}`);
        return;
      }

      // 2. Handle hitting the Root Trap
      if (e.state?.trap) {
        if (currentViewRef.current !== 'dashboard') {
          // Navigated back from a deep link entry. Route to dashboard instead of exiting.
          _setCurrentView('dashboard');
          currentViewRef.current = 'dashboard';
          window.history.pushState({ view: 'dashboard', appInitialized: true }, '', '#dashboard');
        } else {
          // On Dashboard, confirm exit
          window.history.pushState({ view: 'dashboard', appInitialized: true }, '', '#dashboard');
          if (await confirm('Are you sure you want to exit the application?', { title: 'Exit App', type: 'danger', confirmText: 'Yes, Exit' })) {
            // Unmount the listener so we don't infinitely re-trap them on the way out
            window.removeEventListener('popstate', handlePopState);
            
            // Attempt to close the PWA natively
            try {
              window.close();
            } catch (e) {}
            // Fallback: forcefully rewind history to exit the web app
            window.history.go(-(window.history.length));
          }
        }
        return;
      }

      // 3. Navigate normally
      const stateView = e.state?.view;
      if (stateView) {
        _setCurrentView(stateView);
        currentViewRef.current = stateView;
      } else {
        // 4. e.state is null (e.g., manual location.hash assignment)
        const hashVal = window.location.hash.replace('#', '');
        const validViews = ['dashboard', 'accounts', 'goals', 'fire', 'protection', 'simulation', 'settings', 'legal', 'admin'];
        
        if (validViews.includes(hashVal)) {
          _setCurrentView(hashVal);
          currentViewRef.current = hashVal;
          window.history.replaceState({ view: hashVal, appInitialized: true }, '', `#${hashVal}`);
        } else if (['add-asset', 'add-liab', 'add-cashflow'].includes(hashVal) || hashVal.startsWith('edit-')) {
          window.history.replaceState({ view: currentViewRef.current, appInitialized: true }, '', `#${hashVal}`);
        } else {
          _setCurrentView('dashboard');
          currentViewRef.current = 'dashboard';
          window.history.replaceState({ view: 'dashboard', appInitialized: true }, '', '#dashboard');
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
