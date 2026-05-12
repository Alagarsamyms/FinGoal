import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Flame, Target, Rocket, AlertTriangle } from 'lucide-react';

export default function FireDashboard() {
  const { state } = useAppState();
  const theme = state.settings?.theme || 'light';

  const [age, setAge] = useState(30);
  const [swr, setSwr] = useState(4.0);
  const [roi, setRoi] = useState(12.0);
  const [inflation, setInflation] = useState(6.0);

  const expenses = parseFloat(state.expenses) || 0;
  const income = parseFloat(state.income) || 0;
  
  let emi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => { if (l.emi) emi += parseFloat(l.emi); });

  let totalAssets = 0;
  state.assets.forEach(a => { totalAssets += parseFloat(a.currentValue || a.value || 0); });

  let totalDebt = 0;
  state.liabilities.forEach(l => { totalDebt += parseFloat(l.value || 0); });

  const currentCorpus = totalAssets - totalDebt;
  const surplus = income - expenses - emi;

  const projection = useMemo(() => {
    if (expenses <= 0) return { data: [], fireAge: null, fireCorpus: 0 };

    const initialTarget = (expenses * 12) / (swr / 100);
    const data = [];
    
    let corpus = currentCorpus > 0 ? currentCorpus : 0;
    let target = initialTarget;
    let fireAge = null;
    let fireCorpus = 0;

    const annualRoi = roi / 100;
    const annualInf = inflation / 100;

    data.push({
      age,
      corpus: Math.round(corpus),
      target: Math.round(target)
    });

    for (let i = 1; i <= 50; i++) {
      const currentAge = age + i;
      
      // Target grows with inflation
      target = target * (1 + annualInf);

      // Corpus grows with ROI + Annual Surplus Compounding
      // Simple approximation: Surplus contributed monthly, growing over the year
      if (surplus > 0) {
        corpus = (corpus * (1 + annualRoi)) + (surplus * 12 * (1 + annualRoi / 2));
      } else {
        corpus = corpus * (1 + annualRoi);
      }

      data.push({
        age: currentAge,
        corpus: Math.round(corpus),
        target: Math.round(target)
      });

      if (corpus >= target && fireAge === null) {
        fireAge = currentAge;
        fireCorpus = Math.round(corpus);
      }
    }

    return { data, fireAge, fireCorpus, initialTarget };
  }, [age, swr, roi, inflation, currentCorpus, surplus, expenses]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatYAxis = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    return `₹${val}`;
  };

  if (expenses <= 0) {
    return (
      <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">The FIRE Engine</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Financial Independence, Retire Early.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/50 p-6 md:p-8 text-center flex flex-col items-center transition-colors">
          <AlertTriangle className="text-amber-500 dark:text-amber-400 mb-3" size={40} />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Expenses Defined</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            The FIRE algorithm uses your actual Monthly Expenses to calculate your retirement target. 
            Please add your Monthly Expenses in the <strong className="dark:text-slate-300">Accounts & Debt</strong> tab to unlock this engine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">The FIRE Engine</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Calculate your exact Financial Independence and Retirement trajectory.</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 transition-colors">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Current Age</label>
          <div className="flex items-center gap-3">
            <input type="range" min="18" max="70" value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="flex-1 accent-indigo-600 dark:accent-indigo-500" />
            <span className="font-semibold w-8 text-slate-700 dark:text-slate-300">{age}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Safe Withdrawal (SWR)</label>
          <div className="flex items-center gap-3">
            <input type="range" min="2" max="8" step="0.5" value={swr} onChange={(e) => setSwr(parseFloat(e.target.value))} className="flex-1 accent-indigo-600 dark:accent-indigo-500" />
            <span className="font-semibold w-10 text-slate-700 dark:text-slate-300">{swr}%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Expected ROI</label>
          <div className="flex items-center gap-3">
            <input type="range" min="5" max="20" step="0.5" value={roi} onChange={(e) => setRoi(parseFloat(e.target.value))} className="flex-1 accent-indigo-600 dark:accent-indigo-500" />
            <span className="font-semibold w-10 text-slate-700 dark:text-slate-300">{roi}%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Inflation Rate</label>
          <div className="flex items-center gap-3">
            <input type="range" min="2" max="12" step="0.5" value={inflation} onChange={(e) => setInflation(parseFloat(e.target.value))} className="flex-1 accent-indigo-600 dark:accent-indigo-500" />
            <span className="font-semibold w-10 text-slate-700 dark:text-slate-300">{inflation}%</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600 dark:text-indigo-400"><Target size={48} /></div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Today's FI Number</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(projection.initialTarget)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Based on ₹{expenses.toLocaleString('en-IN')}/mo at {swr}% SWR</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-600 dark:to-violet-700 p-4 sm:p-6 rounded-xl border border-indigo-400 dark:border-indigo-500 shadow-lg relative overflow-hidden text-white transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-white"><Flame size={48} /></div>
          <div className="text-sm font-semibold text-indigo-100 uppercase tracking-wider mb-1">Retirement Age</div>
          {projection.fireAge ? (
            <>
              <div className="text-3xl sm:text-4xl font-bold">{projection.fireAge}</div>
              <div className="text-sm text-indigo-100 mt-2 font-medium">{projection.fireAge - age} years from now</div>
            </>
          ) : (
            <div className="text-xl sm:text-2xl font-bold mt-2">Unachievable</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 dark:text-emerald-400"><Rocket size={48} /></div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Future FI Corpus</div>
          {projection.fireAge ? (
            <>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(projection.fireCorpus)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Adjusted for {inflation}% inflation</div>
            </>
          ) : (
            <div className="text-slate-400 dark:text-slate-500 mt-2">Increase savings to project.</div>
          )}
        </div>
      </div>

      {/* Projection Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[400px] sm:h-[500px] transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Wealth vs Target Trajectory</h2>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projection.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme === 'dark' ? '#34d399' : '#10b981'} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={theme === 'dark' ? '#34d399' : '#10b981'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="age" tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} tickFormatter={(val) => `Age ${val}`} dy={10} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} tickFormatter={formatYAxis} dx={-10} width={80} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value), name === 'corpus' ? 'Accumulated Corpus' : 'Target FI Number']}
                labelFormatter={(label) => `Age ${label}`}
                contentStyle={{ borderRadius: '8px', border: theme === 'dark' ? '1px solid #334155' : 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="corpus" name="Accumulated Corpus" stroke={theme === 'dark' ? '#34d399' : '#10b981'} strokeWidth={3} fillOpacity={1} fill="url(#colorCorpus)" />
              <Line type="monotone" dataKey="target" name="Target FI Number" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              {projection.fireAge && (
                <ReferenceDot x={projection.fireAge} y={projection.fireCorpus} r={6} fill="#f43f5e" stroke="#fff" strokeWidth={2} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
