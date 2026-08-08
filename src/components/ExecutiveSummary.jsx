import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Wallet, Receipt, CreditCard, TrendingUp, Landmark, FileWarning, Percent, ShieldAlert, PiggyBank } from 'lucide-react';
import { InfoTooltip } from './Onboarding';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

export default function ExecutiveSummary() {
  const { state } = useAppState();

  const totalIncome = parseFloat(state.income) || 0;
  const totalExpenses = parseFloat(state.expenses) || 0;
  
  // Calculate total EMI from explicit emi input + liability emis
  let totalEmi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => {
    if (l.emi) totalEmi += parseFloat(l.emi);
  });

  const surplus = totalIncome - totalExpenses - totalEmi;

  const totalAssets = state.assets.reduce((sum, a) => sum + (parseFloat(a.currentValue || a.value) || 0), 0);
  const totalDebt = state.liabilities.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
  const netWorth = totalAssets - totalDebt;

  // Debt-to-Income Ratio (Total EMI / Total Income)
  const dti = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : 0;

  // Financial Health Score Algorithm (0-100)
  const emergencyTarget = parseFloat(state.protection.emergencyTarget) || 0;
  const emergencyCurrent = parseFloat(state.protection.emergencyCurrent) || 0;
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;

  // Detect if any financial data has been entered at all
  const hasData = totalIncome > 0 || state.assets.length > 0 || state.liabilities.length > 0;

  let healthScore = 0;
  if (hasData) {
    healthScore = 100;
    // Penalty for high DTI (only meaningful when income > 0)
    if (totalIncome > 0) {
      if (dti > 40) healthScore -= 30;
      else if (dti > 30) healthScore -= 15;
      else if (dti > 20) healthScore -= 5;
    }
    // Penalty for low savings rate (only when income > 0)
    if (totalIncome > 0) {
      if (savingsRate < 10) healthScore -= 30;
      else if (savingsRate < 20) healthScore -= 15;
    } else {
      // No income entered but has assets/liabilities – mild penalty
      healthScore -= 15;
    }
    // Penalty for no / low emergency fund
    if (emergencyTarget > 0 && emergencyCurrent < emergencyTarget * 0.5) healthScore -= 20;
    else if (emergencyTarget > 0 && emergencyCurrent < emergencyTarget) healthScore -= 10;
    else if (emergencyTarget === 0) healthScore -= 10; // smaller penalty – may be intentional
  }

  healthScore = Math.max(0, Math.min(100, healthScore)); // clamp

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
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm px-4 md:px-6 py-3 md:py-4 rounded-xl flex flex-col items-center justify-center min-w-[120px] transition-colors">
            <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Health Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl md:text-3xl font-bold ${healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : healthScore >= 40 ? 'text-orange-500' : 'text-rose-500'}`}>{healthScore}</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium text-sm md:text-base">/100</span>
            </div>
            <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-0.5 ${
              !hasData ? 'text-slate-400 dark:text-slate-500' :
              healthScore >= 80 ? 'text-emerald-500' :
              healthScore >= 60 ? 'text-amber-500' :
              healthScore >= 40 ? 'text-orange-500' : 'text-rose-500'
            }`}>{healthLabel}</span>
          </div>
          <div className="gradient-card px-6 md:px-8 py-3 md:py-4 rounded-xl flex flex-col justify-center min-w-[160px]">
            <span className="text-xs md:text-sm font-medium text-indigo-100 uppercase tracking-wider mb-1">Net Worth</span>
            <span className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(netWorth)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Monthly Income" value={formatCurrency(totalIncome)} icon={<Wallet size={20} />} color="text-emerald-600" />
        <MetricCard label="Monthly Expenses" value={formatCurrency(totalExpenses)} icon={<Receipt size={20} />} color="text-rose-500" />
        <MetricCard label="Total EMI" value={formatCurrency(totalEmi)} icon={<CreditCard size={20} />} color="text-amber-600" />
        
        <MetricCard label="Total Assets" value={formatCurrency(totalAssets)} icon={<Landmark size={18} />} color="text-slate-900 dark:text-white" />
        <MetricCard label="Total Debt" value={formatCurrency(totalDebt)} icon={<FileWarning size={18} />} color="text-rose-600 dark:text-rose-500" />
        <MetricCard label="Debt-to-Income" value={`${dti.toFixed(1)}%`} icon={<Percent size={18} />} color={dti > 40 ? 'text-rose-600 dark:text-rose-500' : 'text-slate-900 dark:text-white'} />
        <MetricCard label="Emergency Fund" value={formatCurrency(emergencyCurrent)} icon={<ShieldAlert size={18} />} subtitle={`Target: ${formatCurrency(emergencyTarget)}`} color="text-slate-900 dark:text-white" />
        <MetricCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon={<PiggyBank size={18} />} subtitle={`Surplus: ${formatCurrency(surplus)}`} color={savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-500' : savingsRate < 10 ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-500'} />
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
