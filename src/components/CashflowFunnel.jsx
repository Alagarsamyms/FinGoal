import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Filter, AlertCircle } from 'lucide-react';

export default function CashflowFunnel() {
  const { state } = useAppState();

  const income = parseFloat(state.income) || 0;
  const expenses = parseFloat(state.expenses) || 0;
  
  let emi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => {
    if (l.emi) emi += parseFloat(l.emi);
  });

  let sips = 0;
  state.assets.forEach(a => {
    if (a.sip) sips += parseFloat(a.sip);
  });

  const fixedObligations = expenses + emi;
  const idleCash = income - fixedObligations - sips;

  const getPercent = (val) => income > 0 ? Math.min(100, Math.max(0, (val / income) * 100)) : 0;

  const expensePct = getPercent(expenses);
  const emiPct = getPercent(emi);
  const sipPct = getPercent(sips);
  // Idle cash gets the remainder if positive, otherwise 0 visually
  const idlePct = income > 0 && idleCash > 0 ? getPercent(idleCash) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const investmentRate = income > 0 ? (sips / income) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[350px]">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Filter className="text-emerald-600" size={20} />
          True Cashflow Funnel
        </h2>
        <p className="text-sm text-slate-500 mt-1">Where your monthly paycheck is going.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center mb-6">
        {income === 0 ? (
          <div className="text-center text-sm text-slate-400 py-4">No income defined. Add income in Accounts & Debt.</div>
        ) : (
          <div className="space-y-4">
            
            {/* The Stacked Bar */}
            <div className="relative h-10 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-rose-400 transition-all duration-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden" style={{ width: `${expensePct}%` }}>
                {expensePct >= 10 && 'Exp'}
              </div>
              <div className="h-full bg-amber-400 transition-all duration-500 flex items-center justify-center text-xs font-bold text-white border-l border-white/20 overflow-hidden" style={{ width: `${emiPct}%` }}>
                {emiPct >= 10 && 'EMI'}
              </div>
              <div className="h-full bg-indigo-500 transition-all duration-500 flex items-center justify-center text-xs font-bold text-white border-l border-white/20 overflow-hidden" style={{ width: `${sipPct}%` }}>
                {sipPct >= 10 && 'SIP'}
              </div>
              <div className="h-full bg-emerald-400 transition-all duration-500 flex items-center justify-center text-xs font-bold text-white border-l border-white/20 overflow-hidden" style={{ width: `${idlePct}%` }}>
                {idlePct >= 10 && 'Cash'}
              </div>
            </div>

            {/* The Legend/Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
              <FunnelStat label="Expenses" amount={expenses} percent={expensePct} color="bg-rose-400" />
              <FunnelStat label="EMIs" amount={emi} percent={emiPct} color="bg-amber-400" />
              <FunnelStat label="Investments" amount={sips} percent={sipPct} color="bg-indigo-500" />
              <FunnelStat label="Idle Cash" amount={idleCash} percent={idlePct} color={idleCash < 0 ? 'bg-rose-600' : 'bg-emerald-400'} isWarning={idleCash < 0} />
            </div>

          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-auto">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investment Rate</div>
            <div className={`text-xl font-bold ${investmentRate >= 20 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {investmentRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Target</div>
            <div className="text-sm font-medium text-slate-600">&gt; 20.0%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelStat({ label, amount, percent, color, isWarning }) {
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  return (
    <div className="bg-white border border-slate-100 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className={`text-[11px] font-semibold uppercase ${isWarning ? 'text-rose-600' : 'text-slate-500'}`}>{label}</span>
      </div>
      <div className={`text-sm font-bold ${isWarning ? 'text-rose-600' : 'text-slate-800'}`}>{formatCurrency(amount)}</div>
      {!isWarning && <div className="text-[10px] text-slate-400">{percent.toFixed(1)}% of income</div>}
      {isWarning && <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> DEFICIT</div>}
    </div>
  );
}
