import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WealthProjection() {
  const { state } = useAppState();

  const totalIncome = parseFloat(state.income) || 0;
  const totalExpenses = parseFloat(state.expenses) || 0;
  let totalEmi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => { if (l.emi) totalEmi += parseFloat(l.emi); });
  
  const surplus = totalIncome - totalExpenses - totalEmi;
  const totalAssets = state.assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
  const totalDebt = state.liabilities.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
  
  const currentNetWorth = totalAssets - totalDebt;

  // Simple projection logic:
  // Assume surplus is invested at a blended 10% ROI annually.
  // We project for the next 15 years.
  const blendedRoi = 0.10;
  let data = [];
  let currentYear = new Date().getFullYear();
  let accumulatedNW = currentNetWorth;
  let annualSurplus = Math.max(0, surplus * 12);

  for (let i = 0; i <= 15; i++) {
    data.push({
      year: currentYear + i,
      netWorth: Math.round(accumulatedNW)
    });
    // Add annual growth
    accumulatedNW = (accumulatedNW * (1 + blendedRoi)) + annualSurplus;
  }

  const formatCurrencyAxis = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full h-[400px] flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">15-Year Wealth Projection</h2>
        <p className="text-sm text-slate-500">Assuming ₹{surplus.toLocaleString('en-IN')} monthly investment at 10% ROI.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNW" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis tickFormatter={formatCurrencyAxis} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
            <Tooltip 
              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Projected Net Worth']}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area type="monotone" dataKey="netWorth" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorNW)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
