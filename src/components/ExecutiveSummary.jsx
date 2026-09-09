import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Wallet, Receipt, CreditCard, TrendingUp, Landmark, FileWarning, Percent, ShieldAlert, PiggyBank } from 'lucide-react';
import { InfoTooltip } from './Onboarding';
import { calculateNetWorth, calculateFinancialHealth } from '../utils/calculations';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const formatCurrencyShort = (val) => {
  if (val === 0 || !val) return '₹0';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  
  if (absVal >= 10000000) {
    // Drop decimal if it ends in .00, otherwise show up to 2 decimal places
    const formatted = (absVal / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${sign}₹${formatted} Cr`;
  } else if (absVal >= 100000) {
    const formatted = (absVal / 100000).toFixed(2).replace(/\.00$/, '');
    return `${sign}₹${formatted} L`;
  } else if (absVal >= 1000) {
    const formatted = (absVal / 1000).toFixed(2).replace(/\.00$/, '');
    return `${sign}₹${formatted} K`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function ExecutiveSummary() {
  const { state } = useAppState();

  const totalIncome = parseFloat(state.income) || 0;
  const totalExpenses = parseFloat(state.expenses) || 0;
  
  // Calculate total EMI from explicit emi input + liability emis
  let totalEmi = parseFloat(state.emi) || 0;
  state.liabilities?.forEach(l => {
    if (l.emi) totalEmi += parseFloat(l.emi);
  });

  const surplus = totalIncome - totalExpenses - totalEmi;

  const totalAssets = state.assets?.reduce((sum, a) => sum + (parseFloat(a.currentValue || a.value) || 0), 0) || 0;
  const totalDebt = state.liabilities?.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0) || 0;
  const netWorth = calculateNetWorth(state.assets || [], state.liabilities || []);

  const dti = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : 0;
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;

  // Financial Health Score Algorithm (0-100)
  const emergencyTarget = parseFloat(state.protection.emergencyTarget) || 0;
  const emergencyCurrent = parseFloat(state.protection.emergencyCurrent) || 0;

  // Detect if any financial data has been entered at all
  const hasData = totalIncome > 0 || state.assets.length > 0 || state.liabilities.length > 0;

  const healthScore = calculateFinancialHealth(
    state.income,
    state.expenses,
    totalEmi,
    emergencyTarget,
    emergencyCurrent,
    hasData
  );

  const healthLabel =
    !hasData ? 'No Data' :
    healthScore >= 80 ? 'Excellent' :
    healthScore >= 60 ? 'Good' :
    healthScore >= 40 ? 'Needs Work' : 'Critical';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Summary
            <InfoTooltip title="Command Center" text="This is your financial dashboard. It auto-calculates your Net Worth, monthly surplus, Debt-to-Income ratio, Financial Health Score, and FIRE progress — all derived from the data you enter in other sections. No manual entry needed here." />
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Your financial command center at a glance.</p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-3 md:gap-4 w-full md:w-auto">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:px-4 md:px-6 md:py-4 rounded-xl flex flex-col items-center justify-center w-full md:w-auto md:min-w-[120px] transition-colors">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 text-center">Health Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                !hasData ? 'text-slate-400 dark:text-slate-500' :
                healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : healthScore >= 40 ? 'text-orange-500' : 'text-rose-500'
              }`}>{!hasData ? '--' : healthScore}</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm md:text-base">/100</span>
            </div>
            <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-0.5 text-center ${
              !hasData ? 'text-slate-400 dark:text-slate-500' :
              healthScore >= 80 ? 'text-emerald-500' :
              healthScore >= 60 ? 'text-amber-500' :
              healthScore >= 40 ? 'text-orange-500' : 'text-rose-500'
            }`}>{healthLabel}</span>
          </div>
          <div className="gradient-card p-3 sm:px-4 md:px-8 md:py-4 rounded-xl flex flex-col justify-center items-center md:items-start w-full md:w-auto md:min-w-[160px] min-w-0">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-indigo-100 uppercase tracking-wider mb-1 text-center md:text-left w-full">Net Worth</span>
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center md:text-left w-full md:w-auto truncate md:overflow-visible md:whitespace-nowrap" title={formatCurrency(netWorth)}>{formatCurrencyShort(netWorth)}</span>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center">
          <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">Welcome to your Command Center!</h2>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4 max-w-lg mx-auto">
            Your dashboard is currently empty. To see your Health Score, Net Worth, and FIRE projections, you need to add your income, expenses, and assets.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-700">
              Go to 'Accounts & Debt' in the sidebar to get started
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Monthly Income" value={hasData ? formatCurrency(totalIncome) : '--'} icon={<Wallet size={20} />} color="text-emerald-600" />
        <MetricCard label="Monthly Expenses" value={hasData ? formatCurrency(totalExpenses) : '--'} icon={<Receipt size={20} />} color="text-rose-500" />
        <MetricCard label="Total EMI" value={hasData ? formatCurrency(totalEmi) : '--'} icon={<CreditCard size={20} />} color="text-amber-600" />
        
        <MetricCard label="Total Assets" value={hasData ? formatCurrency(totalAssets) : '--'} icon={<Landmark size={18} />} color="text-slate-900 dark:text-white" />
        <MetricCard label="Total Debt" value={hasData ? formatCurrency(totalDebt) : '--'} icon={<FileWarning size={18} />} color="text-rose-600 dark:text-rose-500" />
        <MetricCard label="Debt-to-Income" value={hasData ? `${dti.toFixed(1)}%` : '--'} icon={<Percent size={18} />} color={hasData && dti > 40 ? 'text-rose-600 dark:text-rose-500' : 'text-slate-900 dark:text-white'} />
        <MetricCard label="Emergency Fund" value={hasData ? formatCurrency(emergencyCurrent) : '--'} icon={<ShieldAlert size={18} />} subtitle={hasData ? `Target: ${formatCurrency(emergencyTarget)}` : null} color="text-slate-900 dark:text-white" />
        <MetricCard label="Savings Rate" value={hasData ? `${savingsRate.toFixed(1)}%` : '--'} icon={<PiggyBank size={18} />} subtitle={hasData ? `Surplus: ${formatCurrency(surplus)}` : null} color={hasData && savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-500' : hasData && savingsRate < 10 ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-500'} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color = "text-slate-900 dark:text-white", bg = "bg-white dark:bg-slate-800", subtitle }) {
  return (
    <div className={`${bg} border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-colors`}>
      <div className="flex justify-between items-start mb-1 sm:mb-2">
        <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate pr-2">{label}</h3>
        {icon && <div className={`opacity-50 ${color}`}>{icon}</div>}
      </div>
      <div className={`text-lg sm:text-2xl font-bold ${color}`}>{value}</div>
      {subtitle && <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">{subtitle}</div>}
    </div>
  );
}
