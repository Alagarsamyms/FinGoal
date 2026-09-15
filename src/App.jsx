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
  // Tracks whether we are on the sentinel (dashboard-level) history entry.
  // When true, back = exit prompt. When false, back = go to dashboard sentinel.
  const onSentinelRef = useRef(false);
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  const setCurrentView = (view) => {
    if (view !== currentViewRef.current) {
      // replaceState keeps the stack size constant. The stack is always:
      // [#trap] → [#sentinel] where sentinel is the current view.
      window.history.replaceState({ view, sentinel: true }, '', `#${view}`);
      _setCurrentView(view);
      currentViewRef.current = view;
      // When user explicitly navigates to dashboard via menu, they are on the sentinel.
      // When they navigate to any other view, they are NOT on the sentinel — 
      // pressing back should bring them to dashboard first.
      onSentinelRef.current = (view === 'dashboard');
      window.scrollTo(0, 0);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [isWizardActive, setIsWizardActive] = useState(true);

  useEffect(() => {
    initializeGoogleDriveSync();

    // ── History Trap Setup ──────────────────────────────────────────────────
    // Stack layout we want:   [#trap]  →  [current-view (sentinel)]
    //
    // #trap is a silent sentinel at the very bottom. We NEVER navigate to it
    // intentionally. Detecting it in popstate means the user pressed back past
    // the sentinel and we should show the exit confirmation.
    //
    // We always inject this fresh on mount so that reloads don't break the stack.
    window.history.replaceState({ trap: true }, '', '#trap');
    window.history.pushState({ view: currentViewRef.current, sentinel: true }, '', `#${currentViewRef.current}`);

    // On initial load, if the user is on the dashboard, they're on the sentinel.
    onSentinelRef.current = (currentViewRef.current === 'dashboard');

    const handlePopState = async (e) => {
      console.log('[FinGoal Navigation] handlePopState triggered:', {
        url: window.location.href,
        hash: window.location.hash,
        state: e.state,
        currentView: currentViewRef.current,
        onSentinel: onSentinelRef.current,
        hasModals: modalRegistry.hasModals(),
      });

      // A. Modals open → close the top modal, stay on current page.
      if (modalRegistry.hasModals()) {
        console.log('[FinGoal Navigation] Closing modal from registry');
        modalRegistry.pop();
        window.history.pushState({ view: currentViewRef.current, sentinel: true }, '', `#${currentViewRef.current}`);
        return;
      }

      // B. Hit the trap (bottom of stack) or hash is #trap or empty.
      const isTrap = e.state?.trap || window.location.hash === '#trap' || !window.location.hash;
      console.log('[FinGoal Navigation] isTrap:', isTrap);

      if (isTrap) {
        if (!onSentinelRef.current || currentViewRef.current !== 'dashboard') {
          console.log('[FinGoal Navigation] Not on dashboard sentinel, redirecting to dashboard');
          _setCurrentView('dashboard');
          currentViewRef.current = 'dashboard';
          onSentinelRef.current = true;
          window.history.replaceState({ trap: true }, '', '#trap');
          window.history.pushState({ view: 'dashboard', sentinel: true }, '', '#dashboard');
        } else {
          console.log('[FinGoal Navigation] On Dashboard! Triggering exit confirmation modal...');
          window.history.pushState({ view: 'dashboard', sentinel: true }, '', '#dashboard');

          try {
            const shouldExit = await confirmRef.current(
              'Are you sure you want to exit the application?',
              { title: 'Exit App', type: 'danger', confirmText: 'Yes, Exit' }
            );
            console.log('[FinGoal Navigation] User response to exit confirmation:', shouldExit);

            if (shouldExit) {
              window.removeEventListener('popstate', handlePopState);
              try { window.close(); } catch (_) {}
              window.history.go(-window.history.length);
            }
          } catch (err) {
            console.error('[FinGoal Navigation] Error during exit confirmation:', err);
          }
        }
        return;
      }

      // C. Normal sentinel pop
      if (e.state?.sentinel) {
        const view = e.state.view;
        console.log('[FinGoal Navigation] Sentinel pop to view:', view);
        if (view) {
          _setCurrentView(view);
          currentViewRef.current = view;
          onSentinelRef.current = (view === 'dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
