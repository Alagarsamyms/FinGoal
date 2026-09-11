import React from 'react';
import { Activity, Wallet, Sparkles, Flame, MoreHorizontal } from 'lucide-react';

export default function BottomNav({ currentView, setCurrentView, setIsMobileOpen }) {
  const navItem = (id, label, IconComponent, onClick) => {
    const isActive = currentView === id;
    
    return (
      <button 
        key={id}
        onClick={onClick || (() => setCurrentView(id))} 
        className="flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 transition-colors relative"
      >
        <div className={`p-1 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] mt-0.5 font-semibold tracking-wide transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 w-full h-[68px] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)] flex justify-around items-center px-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {navItem('dashboard', 'Command', Activity)}
      {navItem('accounts', 'Accounts', Wallet)}
      {navItem('simulation', 'Advisor', Sparkles)}
      {navItem('fire', 'FIRE', Flame)}
      {navItem(null, 'More', MoreHorizontal, () => setIsMobileOpen(true))}
    </div>
  );
}
