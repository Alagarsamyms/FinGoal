import React, { useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = {
  'Mutual Fund': '#6366f1', // indigo-500
  'Equity': '#8b5cf6', // violet-500
  'Gold': '#f59e0b', // amber-500
  'Real Estate': '#10b981', // emerald-500
  'Debt': '#0ea5e9', // sky-500
  'Cash': '#14b8a6' // teal-500
};

export default function PortfolioDiversification() {
  const { state } = useAppState();
  const theme = state.settings?.theme || 'light';

  const data = useMemo(() => {
    const grouped = {};
    let total = 0;
    
    state.assets.forEach(a => {
      const val = parseFloat(a.currentValue || a.value || 0);
      if (val > 0) {
        if (!grouped[a.type]) grouped[a.type] = 0;
        grouped[a.type] += val;
        total += val;
      }
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key],
      color: COLORS[key] || '#94a3b8',
      percentage: total > 0 ? ((grouped[key] / total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.value - a.value);
  }, [state.assets]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center transition-colors">
        <PieChartIcon size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">No assets to analyze.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm flex flex-col min-h-[300px] transition-colors">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChartIcon className="text-indigo-600 dark:text-indigo-400" size={20} />
          Portfolio Diversification
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asset allocation and exposure risk.</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="w-full md:w-1/2 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Value']}
                contentStyle={{ borderRadius: '8px', border: theme === 'dark' ? '1px solid #334155' : 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3">
          {data.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{entry.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 dark:text-white block">{entry.percentage}%</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatCurrency(entry.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
