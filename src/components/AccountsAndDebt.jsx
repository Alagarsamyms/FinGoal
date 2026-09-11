import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { InfoTooltip, SectionEmptyState } from './Onboarding';
import { calculateEmi } from '../utils/calculations';

// ─── Shared input style ───────────────────────────────────────────
const inputCls = 'w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/60 dark:text-white dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors';
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide';
const getErrCls = (attempted, val) => attempted && !val ? '!border-rose-500 !ring-1 !ring-rose-500 !bg-rose-50 dark:!bg-rose-900/20' : '';

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
const Field = ({ label, children, tooltip }) => (
  <div>
    <label className={`${labelCls} flex items-center gap-0.5`}>{label}{tooltip}</label>
    {children}
  </div>
);

const autoCalcEmi = (principal, rate, years) => {
  const p = parseFloat(principal);
  const r = parseFloat(rate);
  const n = parseFloat(years) * 12;
  if (!p || !r || !n || n <= 0) return '';
  const emi = calculateEmi(p, r, n);
  return Math.round(emi).toString();
};

const calcOutstanding = (principal, rate, emi, startDate) => {
  const p = parseFloat(principal);
  const r = (parseFloat(rate) / 100) / 12;
  const e = parseFloat(emi);
  if (!p || !r || !e || !startDate) return p || 0;
  
  const d = new Date(startDate + '-01');
  const now = new Date();
  let monthsPassed = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (monthsPassed < 0) monthsPassed = 0;
  
  const factor = Math.pow(1 + r, monthsPassed);
  let balance = p * factor - (e / r) * (factor - 1);
  if (balance < 0) balance = 0;
  return Math.round(balance).toString();
};

export default function AccountsAndDebt() {
  const { state, updateField, addItem, removeItem, updateItem } = useAppState();
  const assetTypes = state.settings?.assetTypes || ['Mutual Fund', 'Stocks (India)', 'Fixed Deposit', 'Gold', 'Real Estate', 'EPF', 'PPF', 'Recurring Deposit', 'Cash', 'NPS', 'Debt', 'Small Savings Scheme', 'Sovereign Gold Bond', 'ETF', 'Bonds', 'Sukanya Samriddhi', 'Silver', 'US Stocks', 'Stocks (Foreign)', 'REITs', 'ULIP', 'Crypto'];

  // ── Cash Flow save indicator ──────────────────────────────────
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeout = useRef(null);
  const handleCashflowChange = (field, value) => {
    updateField(field, parseFloat(value) || 0);
    setShowSaved(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setShowSaved(false), 2000);
  };

  // ── Asset Add form state ─────────────────────────────────────
  const owners = ['Self', 'Spouse', 'Child', 'Parent', 'Joint'];
  const [addAsset, setAddAsset] = useState({ name: '', invested: '', current: '', sip: '', roi: '', type: assetTypes[0], owner: owners[0], autoGrow: true });
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetFormAttempted, setAssetFormAttempted] = useState(false);

  // ── Asset inline edit state (per-item) ──────────────────────
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editAsset, setEditAsset] = useState({});
  const [editAssetAttempted, setEditAssetAttempted] = useState(false);

  // ── Liability Add form state ─────────────────────────────────
  const [addLiab, setAddLiab] = useState({ name: '', value: '', originalAmount: '', firstEmiDate: '', emi: '', rate: '', tenure: '', owner: owners[0] });
  const [showAddLiab, setShowAddLiab] = useState(false);
  const [liabFormAttempted, setLiabFormAttempted] = useState(false);

  // ── Liability inline edit state (per-item) ──────────────────
  const [editingLiabId, setEditingLiabId] = useState(null);
  const [editLiab, setEditLiab] = useState({});
  const [editLiabAttempted, setEditLiabAttempted] = useState(false);

  // ── Quick Update All Values drawer ───────────────────────────
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [quickValues, setQuickValues] = useState({});

  const openQuickUpdate = () => {
    const vals = {};
    state.assets.forEach(a => { vals[a.id] = String(a.currentValue ?? a.value ?? ''); });
    setQuickValues(vals);
    setShowQuickUpdate(true);
  };

  const saveQuickUpdate = () => {
    Object.entries(quickValues).forEach(([id, val]) => {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) updateItem('assets', id, { currentValue: parsed });
    });
    setShowQuickUpdate(false);
  };

  // ── Handle Add Asset ────────────────────────────────────────
  const handleAddAsset = () => {
    setAssetFormAttempted(true);
    if (!addAsset.name || !addAsset.current || (addAsset.autoGrow && !addAsset.sip)) return;
    setAssetFormAttempted(false);
    addItem('assets', {
      name: addAsset.name,
      type: addAsset.type,
      invested: parseFloat(addAsset.invested) || 0,
      currentValue: parseFloat(addAsset.current) || 0,
      sip: parseFloat(addAsset.sip) || 0,
      roi: parseFloat(addAsset.roi) || 0,
      owner: addAsset.owner,
      auto_grow: addAsset.autoGrow,
    });
    setAddAsset({ name: '', invested: '', current: '', sip: '', roi: '', type: assetTypes[0], owner: owners[0], autoGrow: true });
    setShowAddAsset(false);
  };

  // ── Open inline edit for an asset ───────────────────────────
  const openEditAsset = (a) => {
    setEditingAssetId(a.id);
    setEditAssetAttempted(false);
    setEditAsset({
      name: a.name,
      type: a.type,
      invested: a.invested ?? '',
      current: a.currentValue ?? a.value ?? '',
      sip: a.sip ?? '',
      roi: a.roi ?? '',
      owner: a.owner || owners[0],
      autoGrow: a.auto_grow ?? true,
    });
    setEditingLiabId(null); // close any open liability editor
  };

  const saveEditAsset = () => {
    setEditAssetAttempted(true);
    if (!editAsset.name || !editAsset.current || (editAsset.autoGrow && !editAsset.sip)) return;
    setEditAssetAttempted(false);
    updateItem('assets', editingAssetId, {
      name: editAsset.name,
      type: editAsset.type,
      invested: parseFloat(editAsset.invested) || 0,
      currentValue: parseFloat(editAsset.current) || 0,
      sip: parseFloat(editAsset.sip) || 0,
      roi: parseFloat(editAsset.roi) || 0,
      owner: editAsset.owner,
      auto_grow: editAsset.autoGrow,
    });
    setEditingAssetId(null);
  };

  // ── Handle Add Liability ─────────────────────────────────────
  const handleAddLiab = () => {
    setLiabFormAttempted(true);
    if (!addLiab.name) return;
    setLiabFormAttempted(false);
    addItem('liabilities', {
      name: addLiab.name,
      value: parseFloat(calcOutstanding(addLiab.originalAmount, addLiab.rate, addLiab.emi, addLiab.firstEmiDate)) || parseFloat(addLiab.originalAmount) || 0,
      original_amount: parseFloat(addLiab.originalAmount) || 0,
      first_emi_date: addLiab.firstEmiDate || null,
      emi: parseFloat(addLiab.emi) || 0,
      interest: parseFloat(addLiab.rate) || 0,
      owner: addLiab.owner,
    });
    setAddLiab({ name: '', value: '', originalAmount: '', firstEmiDate: '', emi: '', rate: '', owner: owners[0] });
    setShowAddLiab(false);
  };

  // ── Open inline edit for a liability ────────────────────────
  const openEditLiab = (l) => {
    setEditingLiabId(l.id);
    setEditLiabAttempted(false);
    setEditLiab({ 
      name: l.name, 
      value: l.value, 
      originalAmount: l.original_amount ?? '',
      firstEmiDate: l.first_emi_date ?? '',
      emi: l.emi ?? '', 
      rate: l.interest ?? '', 
      owner: l.owner || owners[0] 
    });
    setEditingAssetId(null); // close any open asset editor
  };

  const saveEditLiab = () => {
    setEditLiabAttempted(true);
    if (!editLiab.name) return;
    setEditLiabAttempted(false);
    updateItem('liabilities', editingLiabId, {
      name: editLiab.name,
      value: parseFloat(calcOutstanding(editLiab.originalAmount, editLiab.rate, editLiab.emi, editLiab.firstEmiDate)) || parseFloat(editLiab.originalAmount) || 0,
      original_amount: parseFloat(editLiab.originalAmount) || 0,
      first_emi_date: editLiab.firstEmiDate || null,
      emi: parseFloat(editLiab.emi) || 0,
      interest: parseFloat(editLiab.rate) || 0,
      owner: editLiab.owner,
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
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              Cash Flow
              <InfoTooltip title="Cash Flow" text="Enter your total monthly take-home income, regular living expenses, and any standalone EMIs not covered by the loan entries below. Your monthly surplus is calculated automatically." />
            </h2>
            {showSaved && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded flex items-center gap-1 animate-fade-in"><Check size={14} /> Saved</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className={labelCls}>Monthly Income (₹)</label>
              <input type="number" className={inputCls} value={state.income || ''} onChange={e => handleCashflowChange('income', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Monthly Expenses (₹)</label>
              <input type="number" className={inputCls} value={state.expenses || ''} onChange={e => handleCashflowChange('expenses', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Other EMIs (₹)</label>
              <input type="number" className={inputCls} value={state.emi || ''} onChange={e => handleCashflowChange('emi', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Liability & Debt Manager ───────────────────────── */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liability &amp; Debt Manager
              <InfoTooltip title="Debt Manager" text="Add all your outstanding loans here — home loan, car loan, personal loan, credit card dues, etc. Enter the outstanding principal, monthly EMI, and interest rate. Wealth For FIRE will rank them by interest rate to show you what to pay off first." />
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
                    <input type="text" placeholder="e.g. Home Loan" className={`${inputCls} ${getErrCls(liabFormAttempted, addLiab.name)}`} value={addLiab.name} onChange={e => setAddLiab(p => ({ ...p, name: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Original Loan (₹)">
                    <input type="number" placeholder="Original Amount" className={`${inputCls} ${getErrCls(liabFormAttempted, addLiab.originalAmount)}`} value={addLiab.originalAmount} onChange={e => setAddLiab(p => ({ ...p, originalAmount: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="First EMI Month">
                    <input type="month" className={`${inputCls} ${getErrCls(liabFormAttempted, addLiab.firstEmiDate)}`} value={addLiab.firstEmiDate} onChange={e => setAddLiab(p => ({ ...p, firstEmiDate: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Outstanding (₹) - Auto">
                    <input type="number" readOnly className={`${inputCls} bg-slate-50 dark:bg-slate-900 cursor-not-allowed`} value={calcOutstanding(addLiab.originalAmount, addLiab.rate, addLiab.emi, addLiab.firstEmiDate) || addLiab.originalAmount || ''} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Interest Rate (%)">
                    <input type="number" placeholder="0.00" className={`${inputCls} ${getErrCls(liabFormAttempted, addLiab.rate)}`} value={addLiab.rate} onChange={e => setAddLiab(p => ({ ...p, rate: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Tenure (Yrs)">
                    <input type="number" placeholder="20" className={`${inputCls} ${getErrCls(liabFormAttempted, addLiab.tenure)}`} value={addLiab.tenure || ''} onChange={e => setAddLiab(p => ({ ...p, tenure: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Owner">
                    <select className={inputCls} value={addLiab.owner} onChange={e => setAddLiab(p => ({ ...p, owner: e.target.value }))}>
                      {owners.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="EMI (₹)">
                    <div className="relative">
                      <input type="number" placeholder="0" className={`${inputCls} ${getErrCls(liabFormAttempted, addLiab.emi)} pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} value={addLiab.emi} onChange={e => setAddLiab(p => ({ ...p, emi: e.target.value }))} />
                      <button 
                        onClick={() => setAddLiab(p => ({ ...p, emi: autoCalcEmi(p.originalAmount || p.value, p.rate, p.tenure) || p.emi }))}
                        title="Auto-calculate EMI"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        <Calculator size={15} />
                      </button>
                    </div>
                  </Field>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div />
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
                description="Track all your debts in one place. Wealth For FIRE will automatically calculate your Debt-to-Income ratio, rank loans by interest rate, and tell you which to pay off first."
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
                      <div className="col-span-2 sm:col-span-2">
                        <Field label="Loan Name">
                          <input autoFocus type="text" className={`${inputCls} ${getErrCls(editLiabAttempted, editLiab.name)}`} value={editLiab.name} onChange={e => setEditLiab(p => ({ ...p, name: e.target.value }))} />
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="Original Loan (₹)">
                          <input type="number" className={`${inputCls} ${getErrCls(editLiabAttempted, editLiab.originalAmount)}`} value={editLiab.originalAmount} onChange={e => setEditLiab(p => ({ ...p, originalAmount: e.target.value }))} />
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="First EMI Month">
                          <input type="month" className={`${inputCls} ${getErrCls(editLiabAttempted, editLiab.firstEmiDate)}`} value={editLiab.firstEmiDate} onChange={e => setEditLiab(p => ({ ...p, firstEmiDate: e.target.value }))} />
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="Outstanding (₹) - Auto">
                          <input type="number" readOnly className={`${inputCls} bg-slate-50 dark:bg-slate-900 cursor-not-allowed`} value={calcOutstanding(editLiab.originalAmount, editLiab.rate, editLiab.emi, editLiab.firstEmiDate) || editLiab.originalAmount || ''} />
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="Interest Rate (%)">
                          <input type="number" className={`${inputCls} ${getErrCls(editLiabAttempted, editLiab.rate)}`} value={editLiab.rate} onChange={e => setEditLiab(p => ({ ...p, rate: e.target.value }))} />
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="Tenure (Yrs)">
                          <input type="number" className={`${inputCls} ${getErrCls(editLiabAttempted, editLiab.tenure)}`} value={editLiab.tenure || ''} onChange={e => setEditLiab(p => ({ ...p, tenure: e.target.value }))} />
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="Owner">
                          <select className={inputCls} value={editLiab.owner} onChange={e => setEditLiab(p => ({ ...p, owner: e.target.value }))}>
                            {owners.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <Field label="EMI (₹)">
                          <div className="relative">
                            <input type="number" className={`${inputCls} ${getErrCls(editLiabAttempted, editLiab.emi)} pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} value={editLiab.emi} onChange={e => setEditLiab(p => ({ ...p, emi: e.target.value }))} />
                            <button 
                              onClick={() => setEditLiab(p => ({ ...p, emi: autoCalcEmi(p.originalAmount || p.value, p.rate, p.tenure) || p.emi }))}
                              title="Auto-calculate EMI"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            >
                              <Calculator size={15} />
                            </button>
                          </div>
                        </Field>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingLiabId(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">
                          <X size={13} /> Cancel
                        </button>
                        <button onClick={saveEditLiab} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors">
                          <Check size={13} /> Save Changes
                        </button>
                      </div>
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
              <InfoTooltip title="Assets Manager" text="Add everything you own that has financial value — mutual funds, stocks, gold, real estate, FDs, PPF, etc. Enter both the amount you originally invested and the current market value so Wealth For FIRE can track your real returns." />
            </h2>
            <div className="flex items-center gap-2">
              {state.assets.length > 0 && (
                <button
                  onClick={openQuickUpdate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  title="Quickly update all asset values in one place"
                >
                  ⚡ Quick Update
                </button>
              )}
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
                    <input type="text" placeholder="e.g. Axis Bluechip" className={`${inputCls} ${getErrCls(assetFormAttempted, addAsset.name)}`} value={addAsset.name} onChange={e => setAddAsset(p => ({ ...p, name: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Asset Type">
                    <select className={inputCls} value={addAsset.type} onChange={e => setAddAsset(p => ({ ...p, type: e.target.value }))}>
                      {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Owner">
                    <select className={inputCls} value={addAsset.owner} onChange={e => setAddAsset(p => ({ ...p, owner: e.target.value }))}>
                      {owners.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Invested (₹)">
                    <input type="number" placeholder="0" className={`${inputCls} ${getErrCls(assetFormAttempted, addAsset.invested)}`} value={addAsset.invested} onChange={e => setAddAsset(p => ({ ...p, invested: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Current Value (₹)">
                    <input type="number" placeholder="0" className={`${inputCls} ${getErrCls(assetFormAttempted, addAsset.current)}`} value={addAsset.current} onChange={e => setAddAsset(p => ({ ...p, current: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Field label="Exp. ROI (%)" tooltip={<InfoTooltip title="Expected ROI" text="Enter your expected annual return as a percentage. For Mutual Funds use the fund's historical CAGR (typically 10–15%). For FDs use the interest rate. For Gold use ~8%." />}>
                    <input type="number" placeholder="12" className={`${inputCls} ${getErrCls(assetFormAttempted, addAsset.roi)}`} value={addAsset.roi} onChange={e => setAddAsset(p => ({ ...p, roi: e.target.value }))} />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">Monthly SIP (₹)
                      <InfoTooltip title="Monthly SIP" text="Enter the fixed amount invested every month (SIP = Systematic Investment Plan). E.g. ₹5,000/month. When 'Active' is checked, this amount is auto-added to your asset value each month." />
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600 dark:bg-slate-700 dark:border-slate-600"
                        checked={addAsset.autoGrow} 
                        onChange={e => setAddAsset(p => ({ ...p, autoGrow: e.target.checked }))} 
                      />
                      Active
                    </label>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className={`${inputCls} ${addAsset.autoGrow && !addAsset.sip && assetFormAttempted ? '!border-rose-500 !ring-rose-500' : ''} ${!addAsset.autoGrow ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                    disabled={!addAsset.autoGrow}
                    value={addAsset.sip} 
                    onChange={e => setAddAsset(p => ({ ...p, sip: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div />
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
                            <input autoFocus type="text" className={`${inputCls} ${getErrCls(editAssetAttempted, editAsset.name)}`} value={editAsset.name} onChange={e => setEditAsset(p => ({ ...p, name: e.target.value }))} />
                          </Field>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                          <Field label="Asset Type">
                            <select className={inputCls} value={editAsset.type} onChange={e => setEditAsset(p => ({ ...p, type: e.target.value }))}>
                              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </Field>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                          <Field label="Owner">
                            <select className={inputCls} value={editAsset.owner} onChange={e => setEditAsset(p => ({ ...p, owner: e.target.value }))}>
                              {owners.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </Field>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                          <Field label="Invested (₹)">
                            <input type="number" className={`${inputCls} ${getErrCls(editAssetAttempted, editAsset.invested)}`} value={editAsset.invested} onChange={e => setEditAsset(p => ({ ...p, invested: e.target.value }))} />
                          </Field>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                          <Field label="Current Value (₹)">
                            <input type="number" className={`${inputCls} ${getErrCls(editAssetAttempted, editAsset.current)}`} value={editAsset.current} onChange={e => setEditAsset(p => ({ ...p, current: e.target.value }))} />
                          </Field>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                          <Field label="Exp. ROI (%)" tooltip={<InfoTooltip title="Expected ROI" text="Enter your expected annual return as a percentage. For Mutual Funds use the fund's historical CAGR (typically 10–15%). For FDs use the interest rate. For Gold use ~8%." />}>
                            <input type="number" className={`${inputCls} ${getErrCls(editAssetAttempted, editAsset.roi)}`} value={editAsset.roi} onChange={e => setEditAsset(p => ({ ...p, roi: e.target.value }))} />
                          </Field>
                        </div>
                        <div className="col-span-1 sm:col-span-1 flex flex-col">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">Monthly SIP (₹)
                              <InfoTooltip title="Monthly SIP" text="Enter the fixed amount invested every month. When 'Active' is checked, this amount is auto-added to your asset value each month." />
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600 dark:bg-slate-700 dark:border-slate-600"
                                checked={editAsset.autoGrow} 
                                onChange={e => setEditAsset(p => ({ ...p, autoGrow: e.target.checked }))} 
                              />
                              Active
                            </label>
                          </div>
                          <input 
                            type="number" 
                            className={`${inputCls} ${editAsset.autoGrow && !editAsset.sip && editAssetAttempted ? '!border-rose-500 !ring-rose-500' : ''} ${!editAsset.autoGrow ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                            disabled={!editAsset.autoGrow}
                            value={editAsset.sip} 
                            onChange={e => setEditAsset(p => ({ ...p, sip: e.target.value }))} 
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingAssetId(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">
                            <X size={13} /> Cancel
                          </button>
                          <button onClick={saveEditAsset} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                            <Check size={13} /> Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Quick Update All Values Drawer ────────────────── */}
      {showQuickUpdate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQuickUpdate(false)}>
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            style={{ animation: 'slideDown 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">⚡ Quick Update Values</h3>
                <p className="text-emerald-100 text-xs mt-0.5">Update all current market values in one shot</p>
              </div>
              <button onClick={() => setShowQuickUpdate(false)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Asset List */}
            <div className="px-4 py-3 max-h-[60vh] overflow-y-auto space-y-2">
              {state.assets.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">{a.name}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{a.type}</div>
                  </div>
                  <input
                    type="number"
                    value={quickValues[a.id] ?? ''}
                    onChange={e => setQuickValues(prev => ({ ...prev, [a.id]: e.target.value }))}
                    className="w-36 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg px-2.5 py-1.5 text-sm font-semibold text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Current value"
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs text-slate-500 dark:text-slate-400">{state.assets.length} assets</span>
              <div className="flex gap-2">
                <button onClick={() => setShowQuickUpdate(false)} className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={saveQuickUpdate} className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                  <Check size={14} /> Save All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
