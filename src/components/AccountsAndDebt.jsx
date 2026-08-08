import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { InfoTooltip, SectionEmptyState } from './Onboarding';

// ─── Shared input style ───────────────────────────────────────────
const inputCls = 'w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 dark:text-white dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors';
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide';

// ─── Inline Edit Panel (used for both assets & liabilities) ───────
function InlineEditPanel({ onSave, onCancel, children, accent = 'indigo' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    // Scroll the panel into view smoothly when it mounts
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const accentMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-700',
      save: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
      label: 'text-indigo-700 dark:text-indigo-300',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-700',
      save: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600',
      label: 'text-rose-700 dark:text-rose-300',
    }
  };
  const a = accentMap[accent];

  return (
    <div
      ref={panelRef}
      className={`rounded-xl border-2 ${a.border} ${a.bg} p-4 shadow-md animate-fade-in`}
      style={{ animation: 'slideDown 0.18s ease-out' }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${a.label}`}>
        <Edit2 size={12} />
        Editing — changes will save immediately
      </div>

      {children}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={14} /> Cancel
        </button>
        <button
          onClick={onSave}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${a.save}`}
        >
          <Check size={14} /> Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Shared field component ───────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

export default function AccountsAndDebt() {
  const { state, updateField, addItem, removeItem, updateItem } = useAppState();
  const assetTypes = state.settings?.assetTypes || ['Mutual Fund', 'Equity', 'Gold', 'Real Estate', 'Debt', 'Cash'];

  // ── Asset Add form state ─────────────────────────────────────
  const [addAsset, setAddAsset] = useState({ name: '', invested: '', current: '', sip: '', roi: '', type: assetTypes[0] });
  const [showAddAsset, setShowAddAsset] = useState(false);

  // ── Asset inline edit state (per-item) ──────────────────────
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editAsset, setEditAsset] = useState({});

  // ── Liability Add form state ─────────────────────────────────
  const [addLiab, setAddLiab] = useState({ name: '', value: '', emi: '', rate: '' });
  const [showAddLiab, setShowAddLiab] = useState(false);

  // ── Liability inline edit state (per-item) ──────────────────
  const [editingLiabId, setEditingLiabId] = useState(null);
  const [editLiab, setEditLiab] = useState({});

  // ── Handle Add Asset ────────────────────────────────────────
  const handleAddAsset = () => {
    if (!addAsset.name || !addAsset.current) return;
    addItem('assets', {
      name: addAsset.name,
      type: addAsset.type,
      invested: parseFloat(addAsset.invested) || 0,
      currentValue: parseFloat(addAsset.current) || 0,
      sip: parseFloat(addAsset.sip) || 0,
      roi: parseFloat(addAsset.roi) || 0,
    });
    setAddAsset({ name: '', invested: '', current: '', sip: '', roi: '', type: assetTypes[0] });
    setShowAddAsset(false);
  };

  // ── Open inline edit for an asset ───────────────────────────
  const openEditAsset = (a) => {
    setEditingAssetId(a.id);
    setEditAsset({
      name: a.name,
      type: a.type,
      invested: a.invested ?? '',
      current: a.currentValue ?? a.value ?? '',
      sip: a.sip ?? '',
      roi: a.roi ?? '',
    });
    setEditingLiabId(null); // close any open liability editor
  };

  const saveEditAsset = () => {
    if (!editAsset.name || !editAsset.current) return;
    updateItem('assets', editingAssetId, {
      name: editAsset.name,
      type: editAsset.type,
      invested: parseFloat(editAsset.invested) || 0,
      currentValue: parseFloat(editAsset.current) || 0,
      sip: parseFloat(editAsset.sip) || 0,
      roi: parseFloat(editAsset.roi) || 0,
    });
    setEditingAssetId(null);
  };

  // ── Handle Add Liability ─────────────────────────────────────
  const handleAddLiab = () => {
    if (!addLiab.name || !addLiab.value) return;
    addItem('liabilities', {
      name: addLiab.name,
      value: parseFloat(addLiab.value),
      emi: parseFloat(addLiab.emi) || 0,
      interest: parseFloat(addLiab.rate) || 0,
    });
    setAddLiab({ name: '', value: '', emi: '', rate: '' });
    setShowAddLiab(false);
  };

  // ── Open inline edit for a liability ────────────────────────
  const openEditLiab = (l) => {
    setEditingLiabId(l.id);
    setEditLiab({ name: l.name, value: l.value, emi: l.emi ?? '', rate: l.interest ?? '' });
    setEditingAssetId(null); // close any open asset editor
  };

  const saveEditLiab = () => {
    if (!editLiab.name || !editLiab.value) return;
    updateItem('liabilities', editingLiabId, {
      name: editLiab.name,
      value: parseFloat(editLiab.value),
      emi: parseFloat(editLiab.emi) || 0,
      interest: parseFloat(editLiab.rate) || 0,
    });
    setEditingLiabId(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Accounts &amp; Debt</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Manage your cash flow, assets, and liabilities.</p>
      </div>

      <div className="space-y-4 md:space-y-6">

        {/* ── Cash Flow ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cash Flow
            <InfoTooltip title="Cash Flow" text="Enter your total monthly take-home income, regular living expenses, and any standalone EMIs not covered by the loan entries below. Your monthly surplus is calculated automatically." />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className={labelCls}>Monthly Income (₹)</label>
              <input type="number" className={inputCls} value={state.income || ''} onChange={e => updateField('income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Monthly Expenses (₹)</label>
              <input type="number" className={inputCls} value={state.expenses || ''} onChange={e => updateField('expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Other EMIs (₹)</label>
              <input type="number" className={inputCls} value={state.emi || ''} onChange={e => updateField('emi', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* ── Liability & Debt Manager ───────────────────────── */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liability &amp; Debt Manager
              <InfoTooltip title="Debt Manager" text="Add all your outstanding loans here — home loan, car loan, personal loan, credit card dues, etc. Enter the outstanding principal, monthly EMI, and interest rate. FinGoal will rank them by interest rate to show you what to pay off first." />
            </h2>
            <button
              onClick={() => { setShowAddLiab(v => !v); setEditingLiabId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                showAddLiab
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {showAddLiab ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Loan</>}
            </button>
          </div>

          {/* Add Liability Form */}
          {showAddLiab && (
            <div className="mb-5 rounded-xl border-2 border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 p-4 shadow-md"
              style={{ animation: 'slideDown 0.18s ease-out' }}>
              <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
              <div className="text-xs font-bold uppercase tracking-widest mb-3 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <Plus size={12} /> New Loan / Liability
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-2">
                  <Field label="Loan Name">
                    <input type="text" placeholder="e.g. Home Loan" className={inputCls} value={addLiab.name} onChange={e => setAddLiab(p => ({ ...p, name: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Outstanding (₹)">
                  <input type="number" placeholder="0" className={inputCls} value={addLiab.value} onChange={e => setAddLiab(p => ({ ...p, value: e.target.value }))} />
                </Field>
                <Field label="EMI (₹)">
                  <input type="number" placeholder="0" className={inputCls} value={addLiab.emi} onChange={e => setAddLiab(p => ({ ...p, emi: e.target.value }))} />
                </Field>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Interest Rate (%)">
                    <input type="number" placeholder="0.00" className={inputCls} value={addLiab.rate} onChange={e => setAddLiab(p => ({ ...p, rate: e.target.value }))} />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={handleAddLiab} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors">
                  <Plus size={14} /> Add Loan
                </button>
              </div>
            </div>
          )}

          {/* Liabilities List */}
          <div className="space-y-2">
            {state.liabilities.length === 0 && (
              <SectionEmptyState
                icon="🏦"
                title="No Loans Added Yet"
                description="Track all your debts in one place. FinGoal will automatically calculate your Debt-to-Income ratio, rank loans by interest rate, and tell you which to pay off first."
                example="Home Loan — ₹45,00,000 at 8.5% · EMI ₹45,000"
                ctaLabel="+ Add Your First Loan"
                onCta={() => setShowAddLiab(true)}
                accentColor="rose"
              />
            )}
            {state.liabilities.map(l => (
              <div key={l.id} className="space-y-0">
                {/* Row */}
                <div className={`flex justify-between items-center px-3 sm:px-4 py-3 rounded-xl border transition-colors ${
                  editingLiabId === l.id
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-600 rounded-b-none border-b-0'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{l.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-2">
                      <span>Rate: <strong>{l.interest}%</strong></span>
                      <span>EMI: <strong>₹{Number(l.emi).toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-sm sm:text-base">
                      ₹{Number(l.value).toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editingLiabId === l.id ? setEditingLiabId(null) : openEditLiab(l)}
                        title={editingLiabId === l.id ? 'Close editor' : 'Edit'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          editingLiabId === l.id
                            ? 'bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-300'
                            : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {editingLiabId === l.id ? <ChevronUp size={15} /> : <Edit2 size={15} />}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${l.name}"?`)) removeItem('liabilities', l.id); }}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Panel — directly below the row */}
                {editingLiabId === l.id && (
                  <div className="border-2 border-rose-300 dark:border-rose-600 border-t-0 rounded-b-xl bg-rose-50 dark:bg-rose-950/40 px-4 pb-4 pt-3"
                    style={{ animation: 'slideDown 0.18s ease-out' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="col-span-2">
                        <Field label="Loan Name">
                          <input autoFocus type="text" className={inputCls} value={editLiab.name} onChange={e => setEditLiab(p => ({ ...p, name: e.target.value }))} />
                        </Field>
                      </div>
                      <Field label="Outstanding (₹)">
                        <input type="number" className={inputCls} value={editLiab.value} onChange={e => setEditLiab(p => ({ ...p, value: e.target.value }))} />
                      </Field>
                      <Field label="EMI (₹)">
                        <input type="number" className={inputCls} value={editLiab.emi} onChange={e => setEditLiab(p => ({ ...p, emi: e.target.value }))} />
                      </Field>
                      <div className="col-span-2 sm:col-span-1">
                        <Field label="Interest Rate (%)">
                          <input type="number" className={inputCls} value={editLiab.rate} onChange={e => setEditLiab(p => ({ ...p, rate: e.target.value }))} />
                        </Field>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingLiabId(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">
                        <X size={13} /> Cancel
                      </button>
                      <button onClick={saveEditLiab} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors">
                        <Check size={13} /> Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Assets Manager ────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assets Manager
              <InfoTooltip title="Assets Manager" text="Add everything you own that has financial value — mutual funds, stocks, gold, real estate, FDs, PPF, etc. Enter both the amount you originally invested and the current market value so FinGoal can track your real returns." />
            </h2>
            <button
              onClick={() => { setShowAddAsset(v => !v); setEditingAssetId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                showAddAsset
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showAddAsset ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Asset</>}
            </button>
          </div>

          {/* Add Asset Form */}
          {showAddAsset && (
            <div className="mb-5 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 p-4 shadow-md"
              style={{ animation: 'slideDown 0.18s ease-out' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Plus size={12} /> New Asset
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-2">
                  <Field label="Asset Name">
                    <input type="text" placeholder="e.g. Axis Bluechip" className={inputCls} value={addAsset.name} onChange={e => setAddAsset(p => ({ ...p, name: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Asset Type">
                    <select className={inputCls} value={addAsset.type} onChange={e => setAddAsset(p => ({ ...p, type: e.target.value }))}>
                      {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Invested (₹)">
                  <input type="number" placeholder="0" className={inputCls} value={addAsset.invested} onChange={e => setAddAsset(p => ({ ...p, invested: e.target.value }))} />
                </Field>
                <Field label="Current Value (₹)">
                  <input type="number" placeholder="0" className={inputCls} value={addAsset.current} onChange={e => setAddAsset(p => ({ ...p, current: e.target.value }))} />
                </Field>
                <Field label="Monthly SIP (₹)">
                  <input type="number" placeholder="0" className={inputCls} value={addAsset.sip} onChange={e => setAddAsset(p => ({ ...p, sip: e.target.value }))} />
                </Field>
                <Field label="Exp. ROI (%)">
                  <input type="number" placeholder="12" className={inputCls} value={addAsset.roi} onChange={e => setAddAsset(p => ({ ...p, roi: e.target.value }))} />
                </Field>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={handleAddAsset} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  <Plus size={14} /> Add Asset
                </button>
              </div>
            </div>
          )}

          {/* Assets List */}
          <div className="space-y-2">
            {state.assets.length === 0 && (
              <SectionEmptyState
                icon="💼"
                title="No Assets Added Yet"
                description="Add your investments and assets to see your total Net Worth, portfolio diversification, and real returns vs what you invested."
                example="Axis Bluechip MF — Invested ₹2,00,000 · Current ₹2,64,000"
                ctaLabel="+ Add Your First Asset"
                onCta={() => setShowAddAsset(true)}
                accentColor="indigo"
              />
            )}
            {state.assets.map((a, i) => {
              const val      = parseFloat(a.currentValue ?? a.value ?? 0);
              const invested = parseFloat(a.invested ?? 0);
              const gainLoss = val - invested;
              const gainPct  = invested > 0 ? ((gainLoss / invested) * 100).toFixed(1) : null;
              const isEditing = editingAssetId === a.id;

              return (
                <div key={a.id} className="space-y-0">
                  {/* Row */}
                  <div className={`flex justify-between items-center px-3 sm:px-4 py-3 rounded-xl border transition-colors ${
                    isEditing
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-600 rounded-b-none border-b-0'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{a.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-2">
                        <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-medium">{a.type}</span>
                        {a.sip > 0 && <span>SIP: ₹{Number(a.sip).toLocaleString('en-IN')}</span>}
                        {a.roi > 0 && <span>ROI: {a.roi}%</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                          ₹{val.toLocaleString('en-IN')}
                        </div>
                        {gainPct !== null && (
                          <div className={`text-[10px] font-semibold ${gainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {gainLoss >= 0 ? '+' : ''}{gainPct}%
                          </div>
                        )}
                        {invested > 0 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            Inv: ₹{invested.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => isEditing ? setEditingAssetId(null) : openEditAsset(a)}
                          title={isEditing ? 'Close editor' : 'Edit'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isEditing
                              ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {isEditing ? <ChevronUp size={15} /> : <Edit2 size={15} />}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete "${a.name}"?`)) removeItem('assets', a.id); }}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Edit Panel — directly below the row, no scroll needed */}
                  {isEditing && (
                    <div
                      className="border-2 border-indigo-300 dark:border-indigo-600 border-t-0 rounded-b-xl bg-indigo-50 dark:bg-indigo-950/40 px-4 pb-4 pt-3"
                      style={{ animation: 'slideDown 0.18s ease-out' }}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                        <div className="col-span-2">
                          <Field label="Asset Name">
                            <input autoFocus type="text" className={inputCls} value={editAsset.name} onChange={e => setEditAsset(p => ({ ...p, name: e.target.value }))} />
                          </Field>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Field label="Asset Type">
                            <select className={inputCls} value={editAsset.type} onChange={e => setEditAsset(p => ({ ...p, type: e.target.value }))}>
                              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </Field>
                        </div>
                        <Field label="Invested (₹)">
                          <input type="number" className={inputCls} value={editAsset.invested} onChange={e => setEditAsset(p => ({ ...p, invested: e.target.value }))} />
                        </Field>
                        <Field label="Current Value (₹)">
                          <input type="number" className={inputCls} value={editAsset.current} onChange={e => setEditAsset(p => ({ ...p, current: e.target.value }))} />
                        </Field>
                        <Field label="Monthly SIP (₹)">
                          <input type="number" className={inputCls} value={editAsset.sip} onChange={e => setEditAsset(p => ({ ...p, sip: e.target.value }))} />
                        </Field>
                        <Field label="Exp. ROI (%)">
                          <input type="number" className={inputCls} value={editAsset.roi} onChange={e => setEditAsset(p => ({ ...p, roi: e.target.value }))} />
                        </Field>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingAssetId(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">
                          <X size={13} /> Cancel
                        </button>
                        <button onClick={saveEditAsset} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                          <Check size={13} /> Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
