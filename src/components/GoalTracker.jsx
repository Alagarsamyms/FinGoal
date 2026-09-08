import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, XCircle, Link as LinkIcon, Info, Target } from 'lucide-react';
import { InfoTooltip, SectionEmptyState } from './Onboarding';

const inputCls = 'w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 dark:text-white dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors';
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide';
const getErrCls = (attempted, val) => attempted && !val ? '!border-rose-500 !ring-1 !ring-rose-500 !bg-rose-50 dark:!bg-rose-900/20' : '';

export default function GoalTracker() {
  const { state, addItem, removeItem, updateItem } = useAppState();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [linkedAssets, setLinkedAssets] = useState([]);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [formAttempted, setFormAttempted] = useState(false);
  const [allocationError, setAllocationError] = useState('');
  const [showLinkTip, setShowLinkTip] = useState(false);

  // ── Allocation helpers ───────────────────────────────────────────
  // Get how much % of a given asset is already used by OTHER goals
  const getUsedAllocation = (assetId, excludeGoalId) => {
    let used = 0;
    state.goals.forEach(g => {
      if (g.id === excludeGoalId) return;
      if (Array.isArray(g.linkedAssets)) {
        const link = g.linkedAssets.find(la => la.assetId === assetId);
        if (link) used += parseFloat(link.allocation) || 0;
      }
    });
    return used;
  };

  const getAvailableAllocation = (assetId) => {
    const used = getUsedAllocation(assetId, editingGoalId);
    // Also subtract what THIS form's current links are using (excluding the asset in question)
    const thisFormUsed = linkedAssets
      .filter(la => la.assetId === assetId)
      .reduce((s, la) => s + (parseFloat(la.allocation) || 0), 0);
    // Available = 100 - used by other goals
    return Math.max(0, 100 - used);
  };

  // ── Toggle asset link ────────────────────────────────────────────
  const handleToggleAsset = (assetId) => {
    const exists = linkedAssets.find(la => la.assetId === assetId);
    if (exists) {
      setLinkedAssets(linkedAssets.filter(la => la.assetId !== assetId));
    } else {
      const available = getAvailableAllocation(assetId);
      setLinkedAssets([...linkedAssets, { assetId, allocation: Math.min(available, 100) }]);
    }
    setAllocationError('');
  };

  const handleAllocationChange = (assetId, rawVal) => {
    let val = parseFloat(rawVal) || 0;
    const used = getUsedAllocation(assetId, editingGoalId);
    const max = 100 - used;
    if (val > max) {
      setAllocationError(`Cannot allocate more than ${max.toFixed(0)}% to "${state.assets.find(a => a.id === assetId)?.name}" — remaining after other goals.`);
      val = max;
    } else {
      setAllocationError('');
    }
    setLinkedAssets(linkedAssets.map(la => la.assetId === assetId ? { ...la, allocation: val } : la));
  };

  // ── Save / Update goal ───────────────────────────────────────────
  const handleSaveGoal = () => {
    setFormAttempted(true);
    if (!name || !target) return;

    // Validate total allocation per asset doesn't exceed 100%
    for (const la of linkedAssets) {
      const used = getUsedAllocation(la.assetId, editingGoalId);
      if ((used + (parseFloat(la.allocation) || 0)) > 100.01) {
        setAllocationError(`Total allocation for "${state.assets.find(a => a.id === la.assetId)?.name}" exceeds 100%. Please reduce it.`);
        return;
      }
    }

    const goalData = {
      name,
      target: parseFloat(target),
      saved: 0,
      contribution: 0,
      roi: 0,
      date: targetDate,
      linkedAssets,
    };

    if (editingGoalId) {
      updateItem('goals', editingGoalId, goalData);
    } else {
      addItem('goals', goalData);
    }
    resetForm();
  };

  const handleEditGoal = (g) => {
    setName(g.name);
    setTarget(g.target);
    setTargetDate(g.date || '');
    setLinkedAssets(Array.isArray(g.linkedAssets) ? g.linkedAssets : []);
    setEditingGoalId(g.id);
    setFormAttempted(false);
    setAllocationError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');
    setTarget('');
    setTargetDate('');
    setLinkedAssets([]);
    setEditingGoalId(null);
    setFormAttempted(false);
    setAllocationError('');
  };

  // ── Goal stats derived from linked assets ────────────────────────
  const calculateGoalStats = (goal) => {
    const links = Array.isArray(goal.linkedAssets) ? goal.linkedAssets : [];
    if (links.length === 0) {
      return { saved: 0, contribution: 0, roi: 0, isAssetLinked: false };
    }

    let totalCurrent = 0;
    let totalSip = 0;
    let weightedRoiSum = 0;

    links.forEach(link => {
      const a = state.assets.find(ast => ast.id === link.assetId);
      if (a) {
        const val = parseFloat(a.currentValue ?? a.value ?? 0);
        const alloc = (parseFloat(link.allocation) || 0) / 100;
        const allocVal = val * alloc;
        const allocSip = (parseFloat(a.sip) || 0) * alloc;
        totalCurrent += allocVal;
        totalSip += allocSip;
        weightedRoiSum += (parseFloat(a.roi) || 0) * allocVal;
      }
    });

    const roi = totalCurrent > 0 ? weightedRoiSum / totalCurrent : 0;
    return { saved: totalCurrent, contribution: totalSip, roi, isAssetLinked: true };
  };

  const calculateMonthsToGoal = (current, targetAmt, monthly, roiAnnual) => {
    if (current >= targetAmt) return 0;
    if (monthly <= 0 && roiAnnual <= 0) return -1;
    const monthlyRate = (roiAnnual / 100) / 12;
    let balance = current;
    let months = 0;
    while (balance < targetAmt && months <= 1200) {
      balance += balance * monthlyRate + monthly;
      months++;
    }
    return months > 1200 ? 1201 : months;
  };

  const hasAssets = state.assets.length > 0;

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Goals Matrix
          <InfoTooltip title="Goals Matrix" text="Define specific financial goals — a house, car, education, or retirement. Set a target amount and date, then link your existing assets to automatically track real progress." />
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
          Plan, project, and achieve your financial milestones using your active assets.
        </p>
      </div>

      {/* ── Add / Edit Form ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target size={18} className="text-indigo-500" />
            {editingGoalId ? 'Edit Goal' : 'Add New Goal'}
          </h2>
          {editingGoalId && (
            <button onClick={resetForm} className="text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
              ✕ Cancel Edit
            </button>
          )}
        </div>

        {/* Core fields: Name + Target + Date only */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-1">
            <label className={labelCls}>Goal Name *</label>
            <input
              type="text"
              placeholder="e.g. Home Down Payment"
              className={`${inputCls} ${getErrCls(formAttempted, name)}`}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Target Amount (₹) *</label>
            <input
              type="number"
              placeholder="0"
              className={`${inputCls} ${getErrCls(formAttempted, target)}`}
              value={target}
              onChange={e => setTarget(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Target Date</label>
            <input
              type="month"
              className={inputCls}
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        {/* ── Asset Linking Section ─────────────────────────────────── */}
        <div className="rounded-xl border-2 border-indigo-100 dark:border-indigo-800/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LinkIcon size={15} className="text-indigo-500 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Link Assets to this Goal</h3>
            </div>
            <button
              onClick={() => setShowLinkTip(v => !v)}
              className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              title="Why link assets?"
            >
              <Info size={15} />
            </button>
          </div>

          {/* Info tip banner */}
          {showLinkTip && (
            <div className="mb-3 bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700/60 rounded-lg p-3 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
              <strong>Why link assets?</strong> Linking assets allows Wealth For FIRE to automatically calculate your real saved amount, monthly SIP contributions, and expected returns — all from your live asset data. Without linking, your goal progress cannot be tracked accurately. You can still save a goal without linking, but the progress will show as 0 until assets are linked.
            </div>
          )}

          {!hasAssets ? (
            /* No assets exist at all */
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-3xl">💼</div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Assets Found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                You haven't added any assets yet. Go to <strong>Accounts &amp; Debt → Assets Manager</strong> and add your mutual funds, stocks, gold, or any investment. Once added, you can link them here to automatically track goal progress.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {state.assets.map(a => {
                const usedByOthers = getUsedAllocation(a.id, editingGoalId);
                const available = Math.max(0, 100 - usedByOthers);
                const isLinked = linkedAssets.find(la => la.assetId === a.id);
                const isDisabled = !isLinked && available <= 0;
                const val = parseFloat(a.currentValue ?? a.value ?? 0);

                return (
                  <div
                    key={a.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-600 transition-all ${isDisabled ? 'opacity-40 grayscale pointer-events-none' : ''} ${isLinked ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer flex-shrink-0"
                      checked={!!isLinked}
                      disabled={isDisabled}
                      onChange={() => handleToggleAsset(a.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">{a.type}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${available > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'}`}>
                            {available.toFixed(0)}% free
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        ₹{val.toLocaleString('en-IN')} · SIP: ₹{(parseFloat(a.sip) || 0).toLocaleString('en-IN')} · ROI: {a.roi || 0}%
                      </div>
                    </div>
                    {isLinked && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alloc %</label>
                        <input
                          type="number"
                          min="0"
                          max={100 - usedByOthers}
                          className="w-16 border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-700 dark:text-white px-2 py-1 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                          value={isLinked.allocation}
                          onChange={e => handleAllocationChange(a.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No asset linked warning (but assets exist) */}
          {hasAssets && linkedAssets.length === 0 && (
            <div className="flex items-start gap-2 mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong>No assets linked.</strong> Your goal will be saved, but progress will show as 0% until you link at least one asset. Linking assets lets Wealth For FIRE track your real savings automatically.
              </span>
            </div>
          )}

          {/* Allocation error */}
          {allocationError && (
            <div className="flex items-start gap-2 mt-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 rounded-lg p-2.5 text-xs text-rose-700 dark:text-rose-400">
              <XCircle size={13} className="flex-shrink-0 mt-0.5" />
              <span>{allocationError}</span>
            </div>
          )}
        </div>

        {/* Form actions */}
        <div className="flex justify-between items-center">
          {formAttempted && (!name || !target) ? (
            <span className="text-xs text-rose-500 font-medium">Please fill in Goal Name and Target Amount.</span>
          ) : <div />}
          <div className="flex gap-2">
            {editingGoalId && (
              <button onClick={resetForm} className="px-5 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            )}
            <button
              onClick={handleSaveGoal}
              className={`px-6 py-2 rounded-lg text-sm text-white font-semibold transition-colors shadow-sm ${editingGoalId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {editingGoalId ? '✓ Update Goal' : '+ Save Goal'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Goals List ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {state.goals.length === 0 ? (
          <SectionEmptyState
            icon="🎯"
            title="No Goals Yet"
            description="Start planning your future. Add a goal with a target amount and date, then link your investments to track progress automatically."
            example="Home Down Payment — ₹20,00,000 by Dec 2027"
            ctaLabel="+ Add Your First Goal"
            onCta={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            accentColor="indigo"
          />
        ) : (
          state.goals.map(g => {
            const stats = calculateGoalStats(g);
            const monthsReq = stats.isAssetLinked
              ? calculateMonthsToGoal(stats.saved, g.target, stats.contribution, stats.roi)
              : -2; // special "not linked" state

            let predictedDate = new Date();
            if (monthsReq >= 0) predictedDate.setMonth(predictedDate.getMonth() + monthsReq);

            let targetD = g.date ? new Date(g.date) : null;

            let statusIcon, statusColor, statusBg, statusText;

            if (!stats.isAssetLinked) {
              statusIcon = <LinkIcon size={14} />;
              statusColor = 'text-slate-600 dark:text-slate-400';
              statusBg = 'bg-slate-100 dark:bg-slate-700';
              statusText = 'Link Assets';
            } else if (stats.saved >= g.target) {
              statusIcon = <CheckCircle2 size={14} />;
              statusColor = 'text-emerald-700 dark:text-emerald-400';
              statusBg = 'bg-emerald-100 dark:bg-emerald-900/30';
              statusText = 'Achieved 🎉';
            } else if (monthsReq === -1 || monthsReq > 1200) {
              statusIcon = <AlertTriangle size={14} />;
              statusColor = 'text-amber-700 dark:text-amber-400';
              statusBg = 'bg-amber-100 dark:bg-amber-900/30';
              statusText = 'Needs Review';
            } else if (targetD) {
              if (predictedDate <= targetD) {
                statusIcon = <CheckCircle2 size={14} />;
                statusColor = 'text-emerald-700 dark:text-emerald-400';
                statusBg = 'bg-emerald-100 dark:bg-emerald-900/30';
                statusText = 'On Track';
              } else {
                statusIcon = <AlertTriangle size={14} />;
                statusColor = 'text-amber-700 dark:text-amber-400';
                statusBg = 'bg-amber-100 dark:bg-amber-900/30';
                statusText = 'At Risk';
              }
            } else {
              statusIcon = null;
              statusColor = 'text-slate-500 dark:text-slate-400';
              statusBg = 'bg-slate-100 dark:bg-slate-700';
              statusText = monthsReq >= 0
                ? `${predictedDate.toLocaleString('default', { month: 'short' })} ${predictedDate.getFullYear()}`
                : 'No date set';
            }

            const percent = g.target > 0 ? Math.min((stats.saved / g.target) * 100, 100) : 0;

            return (
              <div key={g.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm relative group transition-colors">
                {/* Edit/Delete buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditGoal(g)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete "${g.name}"?`)) removeItem('goals', g.id); }}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 pr-16 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {g.name}
                      {stats.isAssetLinked && (
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <LinkIcon size={9} /> Asset Linked
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-3">
                      <span>Target: <strong className="text-slate-700 dark:text-slate-300">₹{Number(g.target).toLocaleString('en-IN')}</strong></span>
                      {g.date && <span>By: <strong className="text-slate-700 dark:text-slate-300">{new Date(g.date).toLocaleString('default', { month: 'short', year: 'numeric' })}</strong></span>}
                      {stats.isAssetLinked && (
                        <>
                          <span>SIP: <strong className="text-slate-700 dark:text-slate-300">₹{stats.contribution.toLocaleString('en-IN')}</strong></span>
                          <span>ROI: <strong className="text-slate-700 dark:text-slate-300">{stats.roi.toFixed(1)}%</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusBg} ${statusColor}`}>
                    {statusIcon} {statusText}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600 dark:text-slate-300">
                      {stats.isAssetLinked
                        ? `₹${Math.round(stats.saved).toLocaleString('en-IN')} saved`
                        : 'Link assets to track progress'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${percent >= 100 ? 'bg-emerald-500' : percent > 50 ? 'bg-indigo-500' : 'bg-indigo-400'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {stats.isAssetLinked && monthsReq >= 0 && monthsReq <= 1200 && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
                      Predicted completion: {predictedDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  {stats.isAssetLinked && !g.date && (monthsReq === -1 || monthsReq > 1200) && (
                    <div className="text-xs text-amber-500 dark:text-amber-400 text-right">
                      Increase SIP or ROI to make this goal achievable
                    </div>
                  )}
                </div>

                {/* Linked asset chips */}
                {stats.isAssetLinked && Array.isArray(g.linkedAssets) && g.linkedAssets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {g.linkedAssets.map(la => {
                      const a = state.assets.find(ast => ast.id === la.assetId);
                      if (!a) return null;
                      return (
                        <span key={la.assetId} className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50 rounded-full px-2 py-0.5 font-medium">
                          <LinkIcon size={8} />
                          {a.name} · {la.allocation}%
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
