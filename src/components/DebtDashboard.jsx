import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { FileWarning, Calendar, AlertCircle } from 'lucide-react';

export default function DebtDashboard() {
  const { state } = useAppState();
  const theme = state.settings?.theme || 'light';
  const liabilities = state.liabilities || [];

  if (liabilities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center transition-colors">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 dark:text-emerald-400">
          <FileWarning size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">100% Debt Free!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
          You currently have no active loans or liabilities.
        </p>
      </div>
    );
  }

  const calculatePayoffDate = (principal, emi, annualRate) => {
    if (principal <= 0) return { months: 0, text: 'Paid off' };
    if (emi <= 0) return { months: -1, text: 'No EMI defined' };
    
    const r = (annualRate / 100) / 12;
    if (r === 0) {
      const m = Math.ceil(principal / emi);
      return { months: m, text: getDateString(m) };
    }

    const numerator = 1 - (r * principal) / emi;
    if (numerator <= 0) {
      return { months: -1, text: 'EMI too low (Interest exceeds EMI)' };
    }

    const months = Math.ceil(-Math.log(numerator) / Math.log(1 + r));
    return { months, text: getDateString(months) };
  };

  const getDateString = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const sortedDebts = [...liabilities].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm min-h-[300px] flex flex-col transition-colors">
      <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileWarning className="text-rose-600 dark:text-rose-500" size={20} />
            Debt Payoff Tracker
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Projected timeline to become debt-free.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {sortedDebts.map(l => {
          const payoff = calculatePayoffDate(l.value, l.emi, l.interest);
          const isWarning = payoff.months === -1;
          
          return (
            <div key={l.id} className="relative bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{l.name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex gap-3 mt-1">
                    <span>EMI: ₹{l.emi.toLocaleString('en-IN')}</span>
                    <span>Rate: {l.interest}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-rose-600 block">
                    ₹{l.value.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              
              <div className={`mt-3 pt-3 border-t dark:border-slate-600 flex items-center justify-between text-sm font-medium ${isWarning ? 'text-rose-600 dark:text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                <div className="flex items-center gap-2">
                  {isWarning ? <AlertCircle size={16} /> : <Calendar size={16} className="text-indigo-500 dark:text-indigo-400" />}
                  <span>Projected Payoff:</span>
                </div>
                <span className={isWarning ? '' : 'text-indigo-600 dark:text-indigo-400'}>{payoff.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
