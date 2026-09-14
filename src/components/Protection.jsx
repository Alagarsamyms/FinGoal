import React, { useState, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import { InfoTooltip } from './Onboarding';

export default function Protection({ setCurrentView }) {
  const { state, updateProtection } = useAppState();

  const [showSaved, setShowSaved] = useState(false);
  const saveTimeout = useRef(null);

  const triggerSaveIndicator = () => {
    setShowSaved(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setShowSaved(false), 2000);
  };

  const handleUpdate = (field, value) => {
    updateProtection(field, value);
    triggerSaveIndicator();
  };

  const termCover = parseFloat(state.protection.termInsurance) || 0;
  const healthCover = parseFloat(state.protection.healthInsurance) || 0;
  const emergencyCurrent = parseFloat(state.protection.emergencyCurrent) || 0;
  
  const monthlyIncome = parseFloat(state.income) || 0;
  const annualIncome = monthlyIncome * 12;
  const hasIncome = monthlyIncome > 0;

  // Recommendations
  const recommendedTerm = annualIncome * 15;
  const recommendedHealth = 1500000;
  const recommendedEmergency = monthlyIncome * 6;

  // Gaps
  const termGap = Math.max(0, recommendedTerm - termCover);
  const healthGap = Math.max(0, recommendedHealth - healthCover);
  const emergencyGap = Math.max(0, recommendedEmergency - emergencyCurrent);

  // Statuses
  const getStatus = (current, recommended, type) => {
    if (!hasIncome && type !== 'Health') return { text: 'Unknown', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (current >= recommended) return { text: 'Adequate', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' };
    
    if (type === 'Term') return { text: 'Underinsured', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' };
    if (type === 'Health') return { text: 'Upgrade Needed', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' };
    return { text: 'Improve', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' };
  };

  const inputCls = "w-full border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none transition-colors";

  const data = [
    {
      id: 'term',
      title: 'Term Life',
      subtitle: '15× Annual Income',
      recommended: hasIncome ? recommendedTerm : null,
      valueKey: 'termInsurance',
      gap: termGap,
      gapColor: 'text-rose-600 dark:text-rose-400',
      status: getStatus(termCover, recommendedTerm, 'Term')
    },
    {
      id: 'health',
      title: 'Health Insurance',
      subtitle: 'Family Floater Base',
      recommended: recommendedHealth,
      valueKey: 'healthInsurance',
      gap: healthGap,
      gapColor: 'text-amber-600 dark:text-amber-400',
      status: getStatus(healthCover, recommendedHealth, 'Health')
    },
    {
      id: 'emergency',
      title: 'Emergency Fund',
      subtitle: '6× Monthly Income',
      recommended: hasIncome ? recommendedEmergency : null,
      valueKey: 'emergencyCurrent',
      gap: emergencyGap,
      gapColor: 'text-amber-600 dark:text-amber-400',
      status: getStatus(emergencyCurrent, recommendedEmergency, 'Emergency')
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Protection
            <InfoTooltip title="Protection" text="A strong financial plan needs a safety net. Track your term life insurance, health insurance, and emergency fund in one unified view. Recommendations are dynamically calculated based on your monthly income." />
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Safeguard your wealth against the unexpected.</p>
        </div>
        {showSaved && (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in shadow-sm">
            <Check size={16} /> Saved
          </span>
        )}
      </div>

      {!hasIncome && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="text-rose-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">Missing Salary Data</h3>
            <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">Your Term Insurance and Emergency Fund recommendations are calculated using your monthly income, which is currently missing.</p>
            <button 
              onClick={() => { if (setCurrentView) setCurrentView('accounts'); }}
              className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:text-rose-800 dark:hover:text-rose-300 transition-colors cursor-pointer"
            >
              Update Income Now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Coverage Type</th>
              <th className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Recommended (₹)</th>
              <th className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Covered (₹)</th>
              <th className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Required (₹)</th>
              <th className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</div>
                </td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.recommended !== null ? item.recommended.toLocaleString('en-IN') : '-'}
                </td>
                <td className="p-4">
                  <input 
                    type="number" 
                    className={`${inputCls} min-w-[120px] max-w-[200px]`} 
                    value={state.protection[item.valueKey] || ''} 
                    onChange={e => handleUpdate(item.valueKey, parseFloat(e.target.value) || 0)} 
                    placeholder="e.g. 100000"
                  />
                </td>
                <td className={`p-4 text-sm font-medium ${item.gapColor}`}>
                  {item.recommended !== null && item.gap > 0 ? item.gap.toLocaleString('en-IN') : (item.recommended !== null ? '0' : '-')}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold whitespace-nowrap ${item.status.bg} ${item.status.color}`}>{item.status.text}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div key={`mob-${item.id}`} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${item.status.bg} ${item.status.color}`}>
                {item.status.text}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Recommended</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {item.recommended !== null ? `₹${item.recommended.toLocaleString('en-IN')}` : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Required (Gap)</div>
                <div className={`text-sm font-medium ${item.gapColor}`}>
                  {item.recommended !== null && item.gap > 0 ? `₹${item.gap.toLocaleString('en-IN')}` : (item.recommended !== null ? '₹0' : '-')}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Current Coverage (₹)</label>
              <input 
                type="number" 
                className={inputCls} 
                value={state.protection[item.valueKey] || ''} 
                onChange={e => handleUpdate(item.valueKey, parseFloat(e.target.value) || 0)} 
                placeholder="Enter amount..."
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
