import React from 'react';
import { useAppState } from '../context/AppStateContext';

export default function Protection() {
  const { state, updateProtection } = useAppState();

  const termCover = parseFloat(state.protection.termInsurance) || 0;
  const healthCover = parseFloat(state.protection.healthInsurance) || 0;
  const emergencyTarget = parseFloat(state.protection.emergencyTarget) || 0;
  const emergencyCurrent = parseFloat(state.protection.emergencyCurrent) || 0;
  const totalIncome = parseFloat(state.income) || 0;
  const annualIncome = totalIncome * 12;

  // Logic: Term should be 15x annual income
  const recommendedTerm = annualIncome * 15;
  const termStatus = termCover >= recommendedTerm ? { text: 'Adequate', color: 'text-emerald-600', bg: 'bg-emerald-50' } : { text: 'Underinsured', color: 'text-rose-600', bg: 'bg-rose-50' };

  // Logic: Health should be minimum 10L, recommended 15L for family
  const recommendedHealth = 1500000;
  const healthStatus = healthCover >= recommendedHealth ? { text: 'Adequate', color: 'text-emerald-600', bg: 'bg-emerald-50' } : { text: 'Upgrade Needed', color: 'text-amber-600', bg: 'bg-amber-50' };

  // Emergency Fund
  const emPercent = emergencyTarget > 0 ? Math.min((emergencyCurrent / emergencyTarget) * 100, 100).toFixed(1) : 0;
  const emStatus = emergencyCurrent >= emergencyTarget && emergencyTarget > 0 ? { text: 'Adequate', color: 'text-emerald-600', bg: 'bg-emerald-50' } : { text: 'Improve', color: 'text-amber-600', bg: 'bg-amber-50' };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Protection</h1>
        <p className="text-slate-500 mt-1">Safeguard your wealth against the unexpected.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold">Current Coverage</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Term Insurance Cover (₹)</label>
            <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.protection.termInsurance || ''} onChange={e => updateProtection('termInsurance', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Health Insurance Cover (₹)</label>
            <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.protection.healthInsurance || ''} onChange={e => updateProtection('healthInsurance', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Target (₹)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.protection.emergencyTarget || ''} onChange={e => updateProtection('emergencyTarget', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Saved (₹)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.protection.emergencyCurrent || ''} onChange={e => updateProtection('emergencyCurrent', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Adequacy Check</h2>
          <div className="space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-slate-900">Term Insurance</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${termStatus.bg} ${termStatus.color}`}>{termStatus.text}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Existing: ₹{termCover.toLocaleString('en-IN')}</span>
                <span className="text-slate-700 font-medium">Recommended: ₹{recommendedTerm.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-slate-900">Health Insurance</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${healthStatus.bg} ${healthStatus.color}`}>{healthStatus.text}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Existing: ₹{healthCover.toLocaleString('en-IN')}</span>
                <span className="text-slate-700 font-medium">Recommended: ₹{recommendedHealth.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-slate-900">Emergency Fund</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${emStatus.bg} ${emStatus.color}`}>{emStatus.text}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">₹{emergencyCurrent.toLocaleString('en-IN')} / ₹{emergencyTarget.toLocaleString('en-IN')}</span>
                <span className="text-indigo-600 font-medium">{emPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${emergencyCurrent >= emergencyTarget ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${emPercent}%`}}></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
