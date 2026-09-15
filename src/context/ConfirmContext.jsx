import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { modalRegistry } from '../utils/modalRegistry';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    title: 'Confirm Action',
    type: 'danger', // 'danger' | 'info'
    confirmText: 'Confirm',
    resolve: null,
  });

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        title: options.title || 'Confirm Action',
        type: options.type || 'danger',
        confirmText: options.confirmText || (options.type === 'danger' ? 'Yes, Delete' : 'Confirm'),
        resolve,
      });
      // Push to global registry so back button closes it
      modalRegistry.push('confirm_modal', () => {
        resolve(false);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      });
    });
  }, []);

  const handleClose = (result) => {
    modalRegistry.remove('confirm_modal');
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <ConfirmModal state={confirmState} onClose={handleClose} />
      )}
    </ConfirmContext.Provider>
  );
};

const ConfirmModal = ({ state, onClose }) => {
  const isDanger = state.type === 'danger';
  const Icon = isDanger ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all"
        style={{ animation: 'modalIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isDanger ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
              <Icon size={24} />
            </div>
            <div className="flex-1 mt-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {state.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {state.message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => onClose(false)}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(true)}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors w-full sm:w-auto ${isDanger ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
