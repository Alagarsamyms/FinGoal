import { PieChart, Activity, Wallet, Target, Settings, ShieldCheck, Sparkles, X } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }) {
  const navItem = (id, label, icon) => {
    const isActive = currentView === id;
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors w-full text-left";
    const activeClass = isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
    
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
      
      <aside className={`w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col p-6 z-40 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between mb-10 text-indigo-600">
          <div className="flex items-center gap-3">
            <PieChart size={28} />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">FinGoal OS</h2>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
      
      <nav className="flex-1 space-y-2">
        {navItem('dashboard', 'Command Center', <Activity size={20} />)}
        {navItem('accounts', 'Accounts & Debt', <Wallet size={20} />)}
        {navItem('goals', 'Goals Matrix', <Target size={20} />)}
        {navItem('protection', 'Protection', <ShieldCheck size={20} />)}
        {navItem('simulation', 'AI Simulator', <Sparkles size={20} />)}
        {navItem('settings', 'Settings', <Settings size={20} />)}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200">
        <div id="sync-status-react" className="flex items-center gap-2 text-sm text-amber-600 mb-4 font-medium">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          Local Storage
        </div>
        <button id="auth-btn-react" className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sync Drive
        </button>
      </div>
    </aside>
    </>
  );
}
