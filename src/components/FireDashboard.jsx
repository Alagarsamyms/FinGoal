import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Flame, Target, Rocket, AlertTriangle } from 'lucide-react';
import { InfoTooltip } from './Onboarding';
import { calculateFireProjection } from '../utils/calculations';

export default function FireDashboard() {
  const { state } = useAppState();
  const theme = state.settings?.theme || 'light';

  const [age, setAge] = useState(30);
  const [swr, setSwr] = useState(4.0);
  const [roi, setRoi] = useState(12.0);
  const [inflation, setInflation] = useState(6.0);
  const [useNetworth, setUseNetworth] = useState(false);
  const [investmentStopAge, setInvestmentStopAge] = useState(50);

  // Scenario B State
  const [enableScenarioB, setEnableScenarioB] = useState(false);
  const [swrB, setSwrB] = useState(3.0);
  const [roiB, setRoiB] = useState(10.0);

  // Auto-calculate age from DOB if available
  useEffect(() => {
    if (state.settings?.dob) {
      const birthDate = new Date(state.settings.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge > 18 && calculatedAge < 100) {
        setAge(calculatedAge);
      }
    }
  }, [state.settings?.dob]);

  const expenses = parseFloat(state.expenses) || 0;
  const income = parseFloat(state.income) || 0;
  
  let emi = parseFloat(state.emi) || 0;
  state.liabilities?.forEach(l => { if (l.emi) emi += parseFloat(l.emi); });

  let totalAssets = 0;
  state.assets?.forEach(a => { totalAssets += parseFloat(a.currentValue || a.value || 0); });

  let totalDebt = 0;
  state.liabilities?.forEach(l => { totalDebt += parseFloat(l.value || 0); });

  const currentCorpus = totalAssets - totalDebt;
  const surplus = income - expenses - emi;

  const { startCorpus, startSurplus } = useMemo(() => {
    let corpus = 0;
    let surp = 0;

    if (!useNetworth) {
      const assetAllocations = {};
      state.goals?.forEach(g => {
        if (g.linkedAssets) {
          g.linkedAssets.forEach(link => {
            if (!assetAllocations[link.assetId]) assetAllocations[link.assetId] = 0;
            assetAllocations[link.assetId] += (parseFloat(link.allocation) || 0);
          });
        }
      });

      state.assets?.forEach(a => {
        const allocated = assetAllocations[a.id] || 0;
        const unallocatedPercent = Math.max(0, 100 - allocated);
        const val = parseFloat(a.currentValue || a.value || 0);
        const sip = parseFloat(a.sip || 0);

        corpus += (val * (unallocatedPercent / 100));
        surp += (sip * (unallocatedPercent / 100));
      });
    } else {
      corpus = currentCorpus > 0 ? currentCorpus : 0;
      surp = surplus > 0 ? surplus : 0;
    }
    return { startCorpus: corpus, startSurplus: surp };
  }, [currentCorpus, surplus, useNetworth, state.assets, state.goals]);

  const projection = useMemo(() => {
    if (expenses <= 0) return { data: [], fireAge: null, fireCorpus: 0 };
    return calculateFireProjection(age, startCorpus, startSurplus, expenses, inflation, roi, swr, investmentStopAge);
  }, [age, swr, roi, inflation, startCorpus, startSurplus, expenses, investmentStopAge]);

  const projectionB = useMemo(() => {
    if (expenses <= 0 || !enableScenarioB) return null;
    return calculateFireProjection(age, startCorpus, startSurplus, expenses, inflation, roiB, swrB, investmentStopAge);
  }, [enableScenarioB, age, swrB, roiB, inflation, startCorpus, startSurplus, expenses, investmentStopAge]);

  const mergedChartData = useMemo(() => {
    if (!projection.data) return [];
    if (!enableScenarioB || !projectionB) return projection.data;

    return projection.data.map((point, index) => {
      const pointB = projectionB.data[index] || {};
      return {
        ...point,
        corpusB: pointB.corpus,
        targetB: pointB.target,
      };
    });
  }, [projection.data, projectionB, enableScenarioB]);

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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/50 p-6 md:p-8 text-center flex flex-col items-center transition-colors shadow-sm">
          <AlertTriangle className="text-amber-500 dark:text-amber-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Expenses Defined</h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-6 max-w-md">
            The FIRE algorithm uses your actual Monthly Expenses to calculate your retirement target. 
            You need to add your data to unlock this engine.
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('accounts')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all transform hover:-translate-y-0.5"
          >
            Update Accounts & Debt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">The FIRE Engine
          <InfoTooltip title="FIRE Engine" text="FIRE = Financial Independence, Retire Early. This calculator shows how long it will take you to accumulate enough wealth to never need to work again. It uses the 4% safe withdrawal rule — you need 25× your annual expenses as a corpus." />
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Calculate your exact Financial Independence and Retirement trajectory.</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Projection Strategy
              <InfoTooltip title="Projection Strategy" text="Safe Withdrawal Rate (SWR): At 4%, you can withdraw 4% of your corpus each year indefinitely. ROI is your expected annual investment return. Adjust these to see different FIRE scenarios." />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose which assets to include in your retirement math.</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
            <button 
              onClick={() => setUseNetworth(false)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!useNetworth ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Unlinked Assets
            </button>
            <button 
              onClick={() => setUseNetworth(true)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${useNetworth ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Full Networth
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Compare Scenario</label>
            <button 
              onClick={() => setEnableScenarioB(p => !p)}
              className={`w-10 h-5.5 flex items-center rounded-full p-1 transition-colors ${enableScenarioB ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${enableScenarioB ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Current Age</label>
            <div className="flex items-center gap-3">
              <input type="range" min="18" max="70" value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="flex-1 accent-indigo-600 dark:accent-indigo-500" />
              <span className="font-semibold w-8 text-slate-700 dark:text-slate-300">{age}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Stop Investing At</label>
            <div className="flex items-center gap-3">
              <input type="range" min={age} max="80" value={investmentStopAge} onChange={(e) => setInvestmentStopAge(parseInt(e.target.value))} className="flex-1 accent-emerald-600 dark:accent-emerald-500" />
              <span className="font-semibold w-8 text-slate-700 dark:text-slate-300">{investmentStopAge}</span>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Safe Withdrawal (SWR)
              <InfoTooltip title="Safe Withdrawal Rate (SWR)" text="The percentage of your retirement corpus you can withdraw annually without running out of money. 4% is a globally recognized standard for a 30+ year retirement." />
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min="2" max="8" step="0.5" value={swr} onChange={(e) => setSwr(parseFloat(e.target.value))} className="flex-1 accent-indigo-600 dark:accent-indigo-500" />
              <span className="font-semibold w-10 text-slate-700 dark:text-slate-300">{swr}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ROI</label>
              <input type="number" step="0.5" value={roi} onChange={(e) => setRoi(parseFloat(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Inflation</label>
              <input type="number" step="0.5" value={inflation} onChange={(e) => setInflation(parseFloat(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </div>

        {enableScenarioB && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in relative">
            <div className="absolute top-0 left-0 -mt-2.5 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">Scenario B</div>
            <div className="col-span-1 md:col-span-2" /> {/* Spacer */}
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Scenario B: SWR</label>
              <div className="flex items-center gap-3">
                <input type="range" min="2" max="8" step="0.5" value={swrB} onChange={(e) => setSwrB(parseFloat(e.target.value))} className="flex-1 accent-indigo-400 dark:accent-indigo-300" />
                <span className="font-semibold w-10 text-slate-700 dark:text-slate-300">{swrB}%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Scenario B: ROI</label>
              <input type="number" step="0.5" value={roiB} onChange={(e) => setRoiB(parseFloat(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative transition-colors">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600 dark:text-indigo-400"><Target size={48} /></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Today's FI Number
              <InfoTooltip title="FI Number" text="Financial Independence Number. The total target corpus you need to accumulate to safely retire based on your current expenses and SWR." />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(projection.initialTarget)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Based on ₹{expenses.toLocaleString('en-IN')}/mo at {swr}% SWR</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-600 dark:to-violet-700 p-4 sm:p-6 rounded-xl border border-indigo-400 dark:border-indigo-500 shadow-lg relative text-white transition-colors">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-white"><Flame size={48} /></div>
          </div>
          <div className="relative z-10">
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
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative transition-colors">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 dark:text-emerald-400"><Rocket size={48} /></div>
          </div>
          <div className="relative z-10">
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
      </div>

      {/* Projection Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[400px] sm:h-[500px] transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Wealth vs Target Trajectory</h2>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme === 'dark' ? '#34d399' : '#10b981'} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={theme === 'dark' ? '#34d399' : '#10b981'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCorpusB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="age" tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} tickFormatter={(val) => `Age ${val}`} dy={10} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} tickFormatter={formatYAxis} dx={-10} width={80} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'corpus') return [formatCurrency(value), 'Accumulated Corpus (A)'];
                  if (name === 'target') return [formatCurrency(value), 'Target FI Number (A)'];
                  if (name === 'corpusB') return [formatCurrency(value), 'Accumulated Corpus (B)'];
                  if (name === 'targetB') return [formatCurrency(value), 'Target FI Number (B)'];
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => `Age ${label}`}
                contentStyle={{ borderRadius: '8px', border: theme === 'dark' ? '1px solid #334155' : 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="corpus" name="corpus" stroke={theme === 'dark' ? '#34d399' : '#10b981'} strokeWidth={3} fillOpacity={1} fill="url(#colorCorpus)" />
              <Line type="monotone" dataKey="target" name="target" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              {projection.fireAge && (
                <ReferenceDot x={projection.fireAge} y={projection.fireCorpus} r={6} fill="#f43f5e" stroke="#fff" strokeWidth={2} />
              )}
              {enableScenarioB && (
                <>
                  <Area type="monotone" dataKey="corpusB" name="corpusB" stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorCorpusB)" />
                  <Line type="monotone" dataKey="targetB" name="targetB" stroke="#f472b6" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                  {projectionB?.fireAge && (
                    <ReferenceDot x={projectionB.fireAge} y={projectionB.fireCorpus} r={6} fill="#f472b6" stroke="#fff" strokeWidth={2} />
                  )}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
