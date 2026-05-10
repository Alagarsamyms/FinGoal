import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Wallet, Receipt, CreditCard, TrendingUp, Landmark, FileWarning, Percent, ShieldAlert } from 'lucide-react';

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

  const totalAssets = state.assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
  const totalDebt = state.liabilities.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
  const netWorth = totalAssets - totalDebt;

  // Debt-to-Income Ratio (Total EMI / Total Income)
  const dti = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : 0;

  // Financial Health Score Algorithm (0-100)
  let healthScore = 100;
  // Penalty for high DTI
  if (dti > 40) healthScore -= 30;
  else if (dti > 30) healthScore -= 15;
  else if (dti > 20) healthScore -= 5;
  // Penalty for low savings rate
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
  if (savingsRate < 10) healthScore -= 30;
  else if (savingsRate < 20) healthScore -= 15;
  // Penalty for no emergency fund
  const emergencyTarget = parseFloat(state.protection.emergencyTarget) || 0;
  const emergencyCurrent = parseFloat(state.protection.emergencyCurrent) || 0;
  if (emergencyTarget > 0 && emergencyCurrent < emergencyTarget * 0.5) healthScore -= 20;
  else if (emergencyTarget > 0 && emergencyCurrent < emergencyTarget) healthScore -= 10;
  else if (emergencyTarget === 0) healthScore -= 20;

  healthScore = Math.max(0, Math.min(100, healthScore)); // clamp

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Summary</h1>
          <p className="text-slate-500 mt-1">Your financial command center at a glance.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Health Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${healthScore >= 80 ? 'text-emerald-500' : healthScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{healthScore}</span>
              <span className="text-slate-400 font-medium">/100</span>
            </div>
          </div>
          <div className="gradient-card px-8 py-4 rounded-xl flex flex-col justify-center">
            <span className="text-sm font-medium text-indigo-100 uppercase tracking-wider mb-1">Net Worth</span>
            <span className="text-3xl font-bold text-white">{formatCurrency(netWorth)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Monthly Income" value={formatCurrency(totalIncome)} icon={<Wallet size={20} />} color="text-emerald-600" />
        <MetricCard label="Monthly Expenses" value={formatCurrency(totalExpenses)} icon={<Receipt size={20} />} color="text-rose-500" />
        <MetricCard label="Total EMI" value={formatCurrency(totalEmi)} icon={<CreditCard size={20} />} color="text-amber-600" />
        <MetricCard label="Investable Surplus" value={formatCurrency(surplus)} icon={<TrendingUp size={20} />} color="text-indigo-600" bg="bg-indigo-50" />
        
        <MetricCard label="Total Assets" value={formatCurrency(totalAssets)} icon={<Landmark size={20} />} />
        <MetricCard label="Total Debt" value={formatCurrency(totalDebt)} icon={<FileWarning size={20} />} color="text-rose-600" />
        <MetricCard label="Debt-to-Income Ratio" value={`${dti.toFixed(1)}%`} icon={<Percent size={20} />} color={dti > 40 ? 'text-rose-600' : 'text-slate-900'} />
        <MetricCard label="Emergency Fund" value={formatCurrency(emergencyCurrent)} icon={<ShieldAlert size={20} />} subtitle={`Target: ${formatCurrency(emergencyTarget)}`} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color = "text-slate-900", bg = "bg-white", subtitle }) {
  return (
    <div className={`${bg} border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        {icon && <div className={`opacity-50 ${color}`}>{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</div>}
    </div>
  );
}
