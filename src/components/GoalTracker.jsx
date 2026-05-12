import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, XCircle, Link as LinkIcon, Info } from 'lucide-react';

export default function GoalTracker() {
  const { state, addItem, removeItem, updateItem } = useAppState();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [contribution, setContribution] = useState('');
  const [roi, setRoi] = useState('12');
  const [targetDate, setTargetDate] = useState('');
  const [linkedAssets, setLinkedAssets] = useState([]);
  const [editingGoalId, setEditingGoalId] = useState(null);

  const handleAddGoal = () => {
    if (name && target) {
      const goalData = {
        name,
        target: parseFloat(target),
        saved: parseFloat(saved) || 0,
        contribution: parseFloat(contribution) || 0,
        roi: parseFloat(roi) || 0,
        date: targetDate,
        linkedAssets: linkedAssets
      };

      if (editingGoalId) {
        updateItem('goals', editingGoalId, goalData);
        setEditingGoalId(null);
      } else {
        addItem('goals', goalData);
      }
      resetForm();
    }
  };

  const handleEditGoal = (g) => {
    setName(g.name);
    setTarget(g.target);
    setSaved(g.saved || '');
    setContribution(g.contribution || '');
    setRoi(g.roi || '');
    setTargetDate(g.date || '');
    setLinkedAssets(g.linkedAssets || []);
    setEditingGoalId(g.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName(''); setTarget(''); setSaved(''); setContribution(''); setRoi('12'); setTargetDate(''); setLinkedAssets([]); setEditingGoalId(null);
  };

  const getAvailableAllocation = (assetId) => {
    let used = 0;
    state.goals.forEach(g => {
      if (g.id !== editingGoalId && g.linkedAssets) {
        const link = g.linkedAssets.find(la => la.assetId === assetId);
        if (link) used += (parseFloat(link.allocation) || 0);
      }
    });
    return Math.max(0, 100 - used);
  };

  const handleToggleAsset = (assetId) => {
    const exists = linkedAssets.find(la => la.assetId === assetId);
    if (exists) {
      setLinkedAssets(linkedAssets.filter(la => la.assetId !== assetId));
    } else {
      const available = getAvailableAllocation(assetId);
      if (available > 0) {
        setLinkedAssets([...linkedAssets, { assetId, allocation: available }]);
      }
    }
  };

  const handleAllocationChange = (assetId, val) => {
    setLinkedAssets(linkedAssets.map(la => la.assetId === assetId ? { ...la, allocation: parseFloat(val) || 0 } : la));
  };

  const calculateGoalStats = (goal) => {
    let gSaved = parseFloat(goal.saved) || 0;
    let gContrib = parseFloat(goal.contribution) || 0;
    let gRoi = parseFloat(goal.roi) || 0;
    let isAssetLinked = false;

    if (goal.linkedAssets && goal.linkedAssets.length > 0) {
      isAssetLinked = true;
      let totalCurrent = 0;
      let totalSip = 0;
      let weightedRoiSum = 0;

      goal.linkedAssets.forEach(link => {
        const a = state.assets.find(ast => ast.id === link.assetId);
        if (a) {
          const val = a.currentValue || a.value || 0;
          const alloc = (parseFloat(link.allocation) || 0) / 100;
          
          const allocVal = val * alloc;
          const allocSip = (a.sip || 0) * alloc;
          
          totalCurrent += allocVal;
          totalSip += allocSip;
          weightedRoiSum += (a.roi || 0) * allocVal;
        }
      });

      gSaved = totalCurrent;
      gContrib = totalSip;
      gRoi = totalCurrent > 0 ? (weightedRoiSum / totalCurrent) : 0;
    }

    return { saved: gSaved, contribution: gContrib, roi: gRoi, isAssetLinked };
  };

  const calculateMonthsToGoal = (current, targetAmt, monthly, roiAnnual) => {
    if (current >= targetAmt) return 0;
    if (monthly <= 0 && roiAnnual <= 0) return -1;
    let monthlyRate = (roiAnnual / 100) / 12;
    let balance = current;
    let months = 0;
    while (balance < targetAmt && months <= 1200) {
      balance += (balance * monthlyRate) + monthly;
      months++;
    }
    return months > 1200 ? 1201 : months;
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Goals Matrix</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Plan, project, and achieve your financial milestones using your active assets.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{editingGoalId ? 'Edit Goal' : 'Add New Goal'}</h2>
          {editingGoalId && <button onClick={resetForm} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Cancel Edit</button>}
        </div>
        
        <div className="flex flex-wrap gap-3 sm:gap-4 items-end mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Goal Name</label>
            <input type="text" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Target (₹)</label>
            <input type="number" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg" value={target} onChange={e => setTarget(e.target.value)} />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Target Date</label>
            <input type="month" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg text-sm" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
        </div>

        {/* Asset Linking Section */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-lg border border-slate-100 dark:border-slate-600 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon size={16} className="text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Link Assets to this Goal</h3>
          </div>
          {state.assets.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No assets available. Add assets in Accounts & Debt.</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {state.assets.map(a => {
                const available = getAvailableAllocation(a.id);
                const isLinked = linkedAssets.find(la => la.assetId === a.id);
                const isDisabled = !isLinked && available <= 0;

                return (
                  <div key={a.id} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 p-2 sm:p-3 rounded border border-slate-200 dark:border-slate-600 transition-opacity ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 rounded bg-transparent dark:bg-slate-700 border-slate-300 dark:border-slate-500" 
                        checked={!!isLinked} 
                        disabled={isDisabled}
                        onChange={() => handleToggleAsset(a.id)} 
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-white block sm:hidden">{a.name}</span>
                    </div>
                    <div className="flex-1 pl-6 sm:pl-0">
                      <div className="text-sm font-medium hidden sm:flex items-center justify-between text-slate-900 dark:text-white">
                        {a.name}
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${available > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                          Avail: {available.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex sm:hidden justify-between items-center mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${available > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                          Avail: {available.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        ₹{(a.currentValue || a.value || 0).toLocaleString('en-IN')} | SIP: ₹{(a.sip || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    {isLinked && (
                      <div className="flex items-center gap-2 pl-6 sm:pl-0 mt-2 sm:mt-0">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Alloc %</label>
                        <input 
                          type="number" 
                          max={available + isLinked.allocation} min="0" 
                          className="w-16 border border-slate-300 dark:border-slate-500 bg-transparent dark:bg-slate-700 dark:text-white p-1 text-sm rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                          value={isLinked.allocation} 
                          onChange={(e) => {
                            let val = parseFloat(e.target.value) || 0;
                            const maxAllowed = available + isLinked.allocation;
                            if (val > maxAllowed) val = maxAllowed;
                            handleAllocationChange(a.id, val);
                          }} 
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {linkedAssets.length === 0 && (
          <>
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 p-2 rounded">
              <Info size={14} className="shrink-0" /> 
              No assets linked. You must manually provide savings and SIP details below.
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 items-end mb-6">
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Manual Current (₹)</label>
                <input type="number" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg" value={saved} onChange={e => setSaved(e.target.value)} />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Manual SIP (₹)</label>
                <input type="number" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg" value={contribution} onChange={e => setContribution(e.target.value)} />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">ROI (%)</label>
                <input type="number" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg" value={roi} onChange={e => setRoi(e.target.value)} />
              </div>
            </div>
          </>
        )}

        <button onClick={handleAddGoal} className={`px-6 py-2 rounded-lg text-white font-medium ${editingGoalId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {editingGoalId ? 'Update Goal' : 'Save Goal'}
        </button>
      </div>

      <div className="space-y-4">
        {state.goals.map(g => {
          const stats = calculateGoalStats(g);
          const monthsReq = calculateMonthsToGoal(stats.saved, g.target, stats.contribution, stats.roi);
          
          let predictedDate = new Date();
          predictedDate.setMonth(predictedDate.getMonth() + monthsReq);
          
          let targetD = g.date ? new Date(g.date) : null;
          let statusIcon = null;
          let statusColor = "text-slate-500 dark:text-slate-400";
          let statusBg = "bg-slate-100 dark:bg-slate-700";
          let statusText = "No date set";

          if (stats.saved >= g.target) {
            statusIcon = <CheckCircle2 size={16} />; statusColor = "text-emerald-700 dark:text-emerald-400"; statusBg = "bg-emerald-100 dark:bg-emerald-900/30"; statusText = "Achieved";
          } else if (monthsReq === -1 || monthsReq > 1200) {
            statusIcon = <XCircle size={16} />; statusColor = "text-rose-700 dark:text-rose-400"; statusBg = "bg-rose-100 dark:bg-rose-900/30"; statusText = "Unachievable";
          } else if (targetD) {
            if (predictedDate <= targetD) {
              statusIcon = <CheckCircle2 size={16} />; statusColor = "text-emerald-700 dark:text-emerald-400"; statusBg = "bg-emerald-100 dark:bg-emerald-900/30"; statusText = "On Track";
            } else {
              statusIcon = <AlertTriangle size={16} />; statusColor = "text-amber-700 dark:text-amber-400"; statusBg = "bg-amber-100 dark:bg-amber-900/30"; statusText = "At Risk";
            }
          } else {
            statusText = `${predictedDate.toLocaleString('default', {month:'short'})} ${predictedDate.getFullYear()}`;
          }

          const percent = Math.min((stats.saved / g.target) * 100, 100).toFixed(1);

          return (
            <div key={g.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm relative group transition-colors">
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditGoal(g)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"><Edit2 size={18} /></button>
                <button onClick={() => removeItem('goals', g.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 p-1"><Trash2 size={18} /></button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 pr-16 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {g.name}
                    {stats.isAssetLinked && <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><LinkIcon size={10} /> Auto-Linked</span>}
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2 sm:gap-4">
                    <span>Target: ₹{g.target.toLocaleString('en-IN')}</span>
                    <span>SIP: ₹{stats.contribution.toLocaleString('en-IN')}</span>
                    <span>ROI: {stats.roi.toFixed(1)}%</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
                  {statusIcon} {statusText}
                </div>
              </div>

              <div className="space-y-2 mt-4 sm:mt-0">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600 dark:text-slate-300">₹{stats.saved.toLocaleString('en-IN')} saved</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{percent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${percent}%`}}></div>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 text-right mt-1">
                  Predicted: {monthsReq <= 1200 && monthsReq !== -1 ? `${predictedDate.toLocaleString('default', {month:'short'})} ${predictedDate.getFullYear()}` : 'Never'}
                </div>
              </div>
            </div>
          );
        })}
        {state.goals.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 transition-colors">
            No goals added. Start planning your future!
          </div>
        )}
      </div>
    </div>
  );
}
