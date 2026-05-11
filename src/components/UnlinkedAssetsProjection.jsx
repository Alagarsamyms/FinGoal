import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Layers, Rocket } from 'lucide-react';

export default function UnlinkedAssetsProjection() {
  const { state } = useAppState();
  const [years, setYears] = useState(15);

  const projectionData = useMemo(() => {
    // Calculate unallocated percentages for each asset
    const assetAllocations = {};
    state.goals.forEach(g => {
      if (g.linkedAssets) {
        g.linkedAssets.forEach(link => {
          if (!assetAllocations[link.assetId]) assetAllocations[link.assetId] = 0;
          assetAllocations[link.assetId] += (parseFloat(link.allocation) || 0);
        });
      }
    });

    const unlinkedAssets = state.assets.map(a => {
      const allocated = assetAllocations[a.id] || 0;
      const unallocatedPercent = Math.max(0, 100 - allocated);
      
      const val = parseFloat(a.currentValue || a.value || 0);
      const sip = parseFloat(a.sip || 0);
      const roi = parseFloat(a.roi || 0);

      return {
        id: a.id,
        name: a.name,
        unallocatedPercent,
        currentValue: val * (unallocatedPercent / 100),
        sip: sip * (unallocatedPercent / 100),
        roi: roi
      };
    }).filter(a => a.unallocatedPercent > 0 && (a.currentValue > 0 || a.sip > 0));

    const currentYear = new Date().getFullYear();
    const data = [];

    let totalCurrentValue = 0;
    unlinkedAssets.forEach(a => totalCurrentValue += a.currentValue);

    for (let i = 0; i <= years; i++) {
      let totalValueForYear = 0;
      let totalInvestedForYear = 0;

      unlinkedAssets.forEach(a => {
        const annualRate = a.roi / 100;
        const monthlyRate = annualRate / 12;
        const months = i * 12;

        const invested = a.currentValue + (a.sip * months);
        totalInvestedForYear += invested;

        if (monthlyRate === 0) {
          totalValueForYear += invested;
        } else {
          const futurePrincipal = a.currentValue * Math.pow(1 + monthlyRate, months);
          const futureSip = a.sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
          totalValueForYear += futurePrincipal + futureSip;
        }
      });

      data.push({
        year: currentYear + i,
        invested: Math.round(totalInvestedForYear),
        amount: Math.round(totalValueForYear)
      });
    }

    return { data, unlinkedAssets, totalCurrentValue };
  }, [state.assets, state.goals, years]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatYAxis = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const currentTotal = projectionData.totalCurrentValue;
  const projectedTotal = projectionData.data.length > 0 ? projectionData.data[projectionData.data.length - 1].amount : 0;
  const wealthGained = projectedTotal - currentTotal;

  if (projectionData.unlinkedAssets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Layers size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Fully Allocated</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          All your assets are 100% tied to your goals. You have no "unlinked" or free-floating wealth to project here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[450px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Unlinked Assets Projection
          </h2>
          <p className="text-sm text-slate-500 mt-1">Growth of assets not tied to any specific goal.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">{years} Years</span>
          <input 
            type="range" 
            min="5" max="30" step="1" 
            value={years} 
            onChange={(e) => setYears(parseInt(e.target.value))}
            className="w-24 md:w-32 accent-indigo-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="text-xs text-slate-500 font-medium mb-1">Current Unlinked Value</div>
          <div className="text-xl font-bold text-slate-800">{formatCurrency(currentTotal)}</div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <div className="text-xs text-indigo-600 font-medium mb-1 flex items-center gap-1"><Rocket size={12}/> Projected Value</div>
          <div className="text-xl font-bold text-indigo-700">{formatCurrency(projectedTotal)}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 col-span-2 md:col-span-1">
          <div className="text-xs text-emerald-600 font-medium mb-1">Wealth Generated</div>
          <div className="text-xl font-bold text-emerald-700">+{formatCurrency(wealthGained)}</div>
        </div>
      </div>

      <div className="mt-8">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={projectionData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={formatYAxis} dx={-10} />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name === 'amount' ? 'Total Value' : 'Total Invested']}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }}/>
            <Area type="monotone" dataKey="invested" name="Total Invested" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" />
            <Line type="monotone" dataKey="amount" name="Projected Value" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
