import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Target, TrendingUp } from 'lucide-react';

export default function GoalsOverview() {
  const { state } = useAppState();
  const goals = state.goals || [];

  if (goals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center transition-colors">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
          <Target size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Goals Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
          Navigate to the Goals Matrix to set your first financial target.
        </p>
      </div>
    );
  }

  const calculateGoalStats = (goal) => {
    let gSaved = parseFloat(goal.saved) || 0;
    let gContrib = parseFloat(goal.contribution) || 0;
    let gRoi = parseFloat(goal.roi) || 0;

    if (goal.linkedAssets && goal.linkedAssets.length > 0) {
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
    return { saved: gSaved, contribution: gContrib, roi: gRoi };
  };

  // Sort goals by progress (closest to completion first)
  const sortedGoals = [...goals].sort((a, b) => {
    const statsA = calculateGoalStats(a);
    const statsB = calculateGoalStats(b);
    const pA = Math.min((statsA.saved / a.target) * 100, 100);
    const pB = Math.min((statsB.saved / b.target) * 100, 100);
    return pB - pA;
  });

  const calculateMonthsToGoal = (current, targetAmt, monthly, roiAnnual) => {
    if (current >= targetAmt) return 0;
    if (monthly <= 0 && roiAnnual <= 0) return -1;
    let monthlyRate = (roiAnnual / 100) / 12;
    if (monthlyRate === 0) {
      return Math.ceil((targetAmt - current) / monthly);
    }
    let months = 0;
    let accumulated = current;
    while (accumulated < targetAmt && months < 1200) {
      accumulated = accumulated * (1 + monthlyRate) + monthly;
      months++;
    }
    return months === 1200 ? -1 : months;
  };

  const getProjectedDateString = (months) => {
    if (months === 0) return 'Achieved 🎉';
    if (months === -1) return 'Unachievable at current SIP';
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return `Est. ${d.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm min-h-[300px] flex flex-col transition-colors">
      <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="text-indigo-600 dark:text-indigo-400" size={20} />
            Goal Trajectories
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your progress towards major milestones.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 sm:space-y-6">
        {sortedGoals.map(g => {
          const stats = calculateGoalStats(g);
          const percent = Math.min((stats.saved / g.target) * 100, 100);
          const isComplete = percent === 100;
          const months = calculateMonthsToGoal(stats.saved, g.target, stats.contribution, stats.roi);
          const projectedDate = getProjectedDateString(months);
          
          return (
            <div key={g.id} className="relative">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{g.name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex gap-2 items-center mt-1">
                    <TrendingUp size={14} className={isComplete ? "text-emerald-500 dark:text-emerald-400" : "text-indigo-400 dark:text-indigo-500"} />
                    ₹{stats.saved.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold block ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {percent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase mt-0.5 block">
                    {projectedDate}
                  </span>
                </div>
              </div>
              
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
