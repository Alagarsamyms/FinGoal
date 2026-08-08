import React, { useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  'Mutual Fund': '#6366f1', // indigo-500
  'Equity': '#8b5cf6',     // violet-500
  'Gold': '#f59e0b',       // amber-500
  'Real Estate': '#10b981', // emerald-500
  'Debt': '#0ea5e9',       // sky-500
  'Cash': '#14b8a6'        // teal-500
};

const FALLBACK_COLORS = [
  '#ec4899', '#f43f5e', '#d946ef', '#f97316',
  '#84cc16', '#06b6d4', '#3b82f6', '#64748b'
];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const { name, value, invested } = entry.payload;
    const gain = value - (invested || 0);
    const gainPct = invested > 0 ? ((gain / invested) * 100).toFixed(1) : null;
    return (
      <div
        className="rounded-xl px-4 py-3 shadow-lg text-sm"
        style={{
          background: theme === 'dark' ? '#1e293b' : '#ffffff',
          border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          minWidth: 170
        }}
      >
        <div className="font-semibold mb-1">{name}</div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Current Value</span>
          <span className="font-bold">{formatCurrency(value)}</span>
        </div>
        {invested > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">Invested</span>
            <span>{formatCurrency(invested)}</span>
          </div>
        )}
        {invested > 0 && gainPct !== null && (
          <div className={`flex justify-between gap-4 mt-1 font-semibold ${gain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span>Gain / Loss</span>
            <span>{gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gain >= 0 ? '+' : ''}{gainPct}%)</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function PortfolioDiversification() {
  const { state } = useAppState();
  const theme = state.settings?.theme || 'light';

  const { data, totalCurrent, totalInvested } = useMemo(() => {
    const grouped = {};
    let totalCurrent = 0;
    let totalInvested = 0;

    state.assets.forEach(a => {
      // Always use currentValue; fall back to value only for legacy data
      const current = parseFloat(a.currentValue ?? a.value ?? 0);
      const invested = parseFloat(a.invested ?? 0);

      if (current > 0) {
        if (!grouped[a.type]) grouped[a.type] = { current: 0, invested: 0 };
        grouped[a.type].current += current;
        grouped[a.type].invested += invested;
        totalCurrent += current;
        totalInvested += invested;
      }
    });

    const data = Object.keys(grouped).map((key, index) => ({
      name: key,
      value: grouped[key].current,
      invested: grouped[key].invested,
      color: COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      percentage: totalCurrent > 0 ? ((grouped[key].current / totalCurrent) * 100).toFixed(1) : 0
    })).sort((a, b) => b.value - a.value);

    return { data, totalCurrent, totalInvested };
  }, [state.assets]);

  const overallGain = totalCurrent - totalInvested;
  const overallGainPct = totalInvested > 0 ? ((overallGain / totalInvested) * 100).toFixed(1) : null;

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center transition-colors">
        <PieChartIcon size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">No assets to analyze.</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Add assets in Accounts &amp; Debt to see your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm flex flex-col transition-colors">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChartIcon className="text-indigo-600 dark:text-indigo-400" size={20} />
          Portfolio Diversification
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Current market value &amp; asset allocation.</p>
      </div>

      {/* Total + Overall gain/loss */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-600">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Portfolio</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalCurrent)}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Current Market Value</div>
        </div>
        {totalInvested > 0 && overallGainPct !== null && (
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${overallGain >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
            {overallGain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{overallGain >= 0 ? '+' : ''}{overallGainPct}%</span>
            <span className="font-normal text-xs opacity-80">overall</span>
          </div>
        )}
      </div>

      {/* Chart + Legend */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="w-full md:w-2/5 h-[200px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={84}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip theme={theme} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full md:w-3/5 flex flex-col justify-center space-y-2.5">
          {data.map((entry, idx) => {
            const gain = entry.value - (entry.invested || 0);
            const gainPct = entry.invested > 0 ? ((gain / entry.invested) * 100).toFixed(1) : null;
            return (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{entry.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.percentage}%</span>
                    {gainPct !== null && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${gain >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {gain >= 0 ? '+' : ''}{gainPct}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatCurrency(entry.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
