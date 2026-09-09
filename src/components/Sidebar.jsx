import { useState } from 'react';
import { PieChart, Activity, Wallet, Target, Flame, Settings, ShieldCheck, Sparkles, X, Sun, Moon, LogIn, LogOut, User, FileText, Share2 } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Sidebar({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }) {
  const { state, updateField } = useAppState();
  const { user, isGuest, signOut } = useAuth();
  const theme = state.settings?.theme || 'light';

  const [showAuth, setShowAuth] = useState(false);

  const toggleTheme = () => {
    updateField('settings', { ...state.settings, theme: theme === 'light' ? 'dark' : 'light' });
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Wealth For FIRE',
      text: 'Take control of your financial future! 🔥 Track your net worth, destroy debts, and plan your early retirement with Wealth For FIRE. Join me today!',
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n\n${shareData.url}`);
        alert('Share text copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const navItem = (id, label, icon) => {
    const isActive = currentView === id;
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors w-full text-left";
    const activeClass = isActive
      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";

    return (
      <button onClick={() => {
        setCurrentView(id);
        if (setIsMobileOpen) setIsMobileOpen(false);
      }} className={`${baseClass} ${activeClass}`}>
        {icon}
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full flex flex-col p-5 z-40 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-8 text-indigo-600 dark:text-indigo-400">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Wealth For FIRE</h2>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItem('dashboard', 'Command Center', <Activity size={20} />)}
          {navItem('accounts', 'Accounts & Debt', <Wallet size={20} />)}
          {navItem('goals', 'Goals Matrix', <Target size={20} />)}
          {navItem('fire', 'FIRE Engine', <Flame size={20} />)}
          {navItem('protection', 'Protection', <ShieldCheck size={20} />)}
          {navItem('simulation', 'AI Advisor', <Sparkles size={20} />)}
          {navItem('settings', 'Settings', <Settings size={20} />)}
          {user?.email === 'alagar9894@gmail.com' && navItem('admin', 'Admin Dashboard', <Activity size={20} className="text-rose-500" />)}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800"
          >
            <span>Share App</span>
            <Share2 size={16} />
          </button>

          {/* Storage sync status */}
          {!isGuest ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Cloud Synced
            </div>
          ) : (
            <div id="sync-status-react" className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 font-medium px-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              Local Only
            </div>
          )}

          {/* Auth Status Block */}
          {isGuest ? (
            <button
              onClick={() => setShowAuth(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <LogIn size={16} /> Sign In / Sign Up
            </button>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
