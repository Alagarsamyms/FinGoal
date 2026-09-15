import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
  ChevronRight, ChevronLeft, X, Check, Plus, Trash2,
  Wallet, TrendingUp, CreditCard, Target, Sparkles, IndianRupee, Info, Calculator
} from 'lucide-react';
import { calculateEmi } from '../utils/calculations';

const WIZARD_SKIPPED_AT = 'fingoal_wizard_skipped_at_v1';
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

// Auto-calculate EMI from principal, rate, tenure
const autoCalcEmi = (principal, rate, years) => {
  const p = parseFloat(principal);
  const r = parseFloat(rate);
  const n = parseFloat(years) * 12;
  if (!p || !r || !n || n <= 0) return '';
  return Math.round(calculateEmi(p, r, n)).toString();
};

const ASSET_PRESETS = [
  { name: 'Savings Account', type: 'Cash' },
  { name: 'Gold', type: 'Gold' },
  { name: 'Mutual Fund', type: 'Mutual Fund' },
  { name: 'Fixed Deposit', type: 'Fixed Deposit' },
  { name: 'EPF / PF', type: 'EPF' },
  { name: 'PPF', type: 'PPF' },
];

const GOAL_PRESETS = [
  { name: 'Emergency Fund', icon: '🛡️' },
  { name: 'Child Education', icon: '🎓' },
  { name: 'Home Purchase', icon: '🏠' },
  { name: 'Retirement', icon: '🌴' },
  { name: 'New Car', icon: '🚗' },
  { name: 'World Trip', icon: '✈️' },
];

const STEPS = [
  { id: 'cashflow', label: 'Income', icon: Wallet, color: 'emerald' },
  { id: 'assets', label: 'Assets', icon: TrendingUp, color: 'indigo' },
  { id: 'debts', label: 'Debts', icon: CreditCard, color: 'rose' },
  { id: 'goals', label: 'Goals', icon: Target, color: 'amber' },
];

const colorMap = {
  emerald: { bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700', progress: 'bg-emerald-500' },
  indigo:  { bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-600 dark:text-indigo-400',  btn: 'bg-indigo-600 hover:bg-indigo-700',  progress: 'bg-indigo-500' },
  rose:    { bgLight: 'bg-rose-50 dark:bg-rose-900/20',      text: 'text-rose-600 dark:text-rose-400',      btn: 'bg-rose-600 hover:bg-rose-700',      progress: 'bg-rose-500' },
  amber:   { bgLight: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-600 dark:text-amber-400',    btn: 'bg-amber-500 hover:bg-amber-600',    progress: 'bg-amber-500' },
};

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide';

function Hint({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none">
        <Info size={12} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-[10010] bg-slate-800 text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl leading-relaxed">
          {text}
          <button onClick={() => setOpen(false)} className="ml-1 text-slate-400 hover:text-white font-bold">✕</button>
        </span>
      )}
    </span>
  );
}

// ── Step 1: Cash Flow ───────────────────────────────────────────────────────
function StepCashflow({ data, onChange }) {
  const surplus = (parseFloat(data.income) || 0) - (parseFloat(data.expenses) || 0) - (parseFloat(data.emi) || 0);
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Monthly Take-Home Income (₹) <Hint text="Net income you receive after all deductions — salary, freelance, rent etc." /></label>
        <div className="relative">
          <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="number" className={`${inputCls} pl-7`} placeholder="e.g. 75,000" value={data.income} onChange={e => onChange('income', e.target.value)} autoFocus />
        </div>
      </div>
      <div>
        <label className={labelCls}>Monthly Living Expenses (₹) <Hint text="Everything you spend — groceries, rent, petrol, dining. A rough estimate is fine!" /></label>
        <div className="relative">
          <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="number" className={`${inputCls} pl-7`} placeholder="e.g. 35,000" value={data.expenses} onChange={e => onChange('expenses', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Other EMIs (₹) — Optional <Hint text="EMIs NOT tracked in the Debts step — e.g. a personal loan from a friend." /></label>
        <div className="relative">
          <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="number" className={`${inputCls} pl-7`} placeholder="e.g. 5,000 (or 0)" value={data.emi} onChange={e => onChange('emi', e.target.value)} />
        </div>
      </div>
      {parseFloat(data.income) > 0 && (
        <div className={`rounded-xl p-3 flex items-center gap-3 border ${surplus >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
          <span className="text-lg">{surplus >= 0 ? '✅' : '⚠️'}</span>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Surplus</p>
            <p className={`text-sm font-bold ${surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {surplus >= 0 ? '+' : '-'}₹{Math.abs(surplus).toLocaleString('en-IN')}
              {surplus < 0 && <span className="text-xs font-normal ml-1 opacity-75">(spending more than earning)</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Assets (Compact, like Asset Manager) ──────────────────────────
function StepAssets({ assets, onAdd, onRemove }) {
  const emptyForm = { name: '', type: 'Mutual Fund', invested: '', current: '', sip: '', roi: '' };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(assets.length === 0);
  const [attempted, setAttempted] = useState(false);

  const handleAdd = () => {
    setAttempted(true);
    if (!form.name || !form.current) return;
    onAdd({
      name: form.name,
      type: form.type,
      value: parseFloat(form.current) || 0,
      invested: parseFloat(form.invested) || parseFloat(form.current) || 0,
      currentValue: parseFloat(form.current) || 0,
      sip: parseFloat(form.sip) || 0,
      roi: parseFloat(form.roi) || 0,
      autoGrow: !!(parseFloat(form.roi) > 0),
    });
    setForm(emptyForm);
    setAttempted(false);
    setShowForm(false);
  };

  const total = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const err = (field) => attempted && !form[field] ? '!border-rose-500 !ring-1 !ring-rose-500' : '';

  return (
    <div className="space-y-3">
      {/* Asset list */}
      {assets.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added ({assets.length})</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">₹{total.toLocaleString('en-IN')}</span>
          </div>
          {assets.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white truncate block">{a.name}</span>
                <span className="text-slate-400 text-xs">{a.type}{a.roi > 0 ? ` · ${a.roi}% ROI` : ''}{a.sip > 0 ? ` · SIP ₹${Number(a.sip).toLocaleString('en-IN')}` : ''}</span>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">₹{Number(a.value).toLocaleString('en-IN')}</span>
              <button onClick={() => onRemove(i)} className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 flex-shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 space-y-3">
          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {ASSET_PRESETS.map(p => (
              <button key={p.name} type="button" onClick={() => setForm(f => ({ ...f, name: p.name, type: p.type }))}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${form.name === p.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={labelCls}>Asset Name *</label>
              <input type="text" className={`${inputCls} ${err('name')}`} placeholder="e.g. SBI Gold Fund" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['Mutual Fund','Stocks (India)','Fixed Deposit','Gold','Real Estate','EPF','PPF','Cash','NPS','Bonds','Recurring Deposit','ETF','Crypto','Silver','US Stocks'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Invested Amount (₹)</label>
              <div className="relative">
                <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" className={`${inputCls} pl-6`} placeholder="50,000" value={form.invested} onChange={e => setForm(f => ({ ...f, invested: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Current Value (₹) *</label>
              <div className="relative">
                <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" className={`${inputCls} pl-6 ${err('current')}`} placeholder="60,000" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Expected ROI (% / yr) <Hint text="Expected annual return. MF: 10-15%, FD: 6-7%, Gold: 8%." /></label>
              <input type="number" className={inputCls} placeholder="12" value={form.roi} onChange={e => setForm(f => ({ ...f, roi: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Monthly SIP (₹) <Hint text="Fixed amount you invest each month. Leave blank if no SIP." /></label>
              <div className="relative">
                <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" className={`${inputCls} pl-6`} placeholder="5,000" value={form.sip} onChange={e => setForm(f => ({ ...f, sip: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowForm(false); setAttempted(false); }} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"><Check size={13} /> Add Asset</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
          <Plus size={16} /> Add Asset
        </button>
      )}
    </div>
  );
}

// ── Step 3: Debts (Compact with Auto EMI) ──────────────────────────────────
function StepDebts({ debts, onAdd, onRemove }) {
  const emptyForm = { name: '', amount: '', emi: '', rate: '', tenure: '' };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(debts.length === 0);
  const [noDebts, setNoDebts] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const suggestedEmi = autoCalcEmi(form.amount, form.rate, form.tenure);
  const showAutoEmi = suggestedEmi && form.emi !== suggestedEmi && (parseFloat(form.amount) > 0);

  const handleAdd = () => {
    setAttempted(true);
    if (!form.name || !form.amount) return;
    onAdd({
      name: form.name,
      value: parseFloat(form.amount),
      originalAmount: parseFloat(form.amount),
      emi: parseFloat(form.emi) || 0,
      interest: parseFloat(form.rate) || 0,
      tenure: parseFloat(form.tenure) || 0,
    });
    setForm(emptyForm);
    setAttempted(false);
    setShowForm(false);
  };

  const totalDebt = debts.reduce((s, d) => s + (parseFloat(d.value) || 0), 0);
  const err = (field) => attempted && !form[field] ? '!border-rose-500 !ring-1 !ring-rose-500' : '';

  return (
    <div className="space-y-3">
      {/* No-debt checkbox */}
      <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${noDebts ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'}`}>
        <input type="checkbox" className="w-4 h-4 accent-emerald-500 flex-shrink-0" checked={noDebts} onChange={e => { setNoDebts(e.target.checked); if (e.target.checked) setShowForm(false); }} />
        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">🎉 I have no loans or debts!</span>
      </label>

      {!noDebts && (
        <>
          {/* Debt list */}
          {debts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added ({debts.length})</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">₹{totalDebt.toLocaleString('en-IN')}</span>
              </div>
              {debts.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">{d.name}</span>
                    <span className="text-slate-400 text-xs">{d.interest > 0 ? `${d.interest}% · ` : ''}EMI ₹{Number(d.emi).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="font-bold text-rose-600 dark:text-rose-400 flex-shrink-0">₹{Number(d.value).toLocaleString('en-IN')}</span>
                  <button onClick={() => onRemove(i)} className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 flex-shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {showForm ? (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={labelCls}>Loan Name *</label>
                  <input type="text" className={`${inputCls} ${err('name')}`} placeholder="e.g. Home Loan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Outstanding Amount (₹) * <Hint text="How much you still owe today — not the original loan amount." /></label>
                  <div className="relative">
                    <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className={`${inputCls} pl-6 ${err('amount')}`} placeholder="25,00,000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Interest Rate (% / yr) <Hint text="Annual interest rate. Home loans: 8-9%, Personal: 12-18%, Car: 9-11%." /></label>
                  <input type="number" className={inputCls} placeholder="8.5" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Remaining Tenure (yrs) <Hint text="How many years are left on this loan? Used to auto-calculate your EMI." /></label>
                  <input type="number" className={inputCls} placeholder="15" value={form.tenure} onChange={e => setForm(f => ({ ...f, tenure: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Monthly EMI (₹) <Hint text="Fixed monthly payment. Leave blank and fill Rate + Tenure to auto-calculate." /></label>
                  <div className="relative">
                    <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className={`${inputCls} pl-6`} placeholder="22,000" value={form.emi} onChange={e => setForm(f => ({ ...f, emi: e.target.value }))} />
                  </div>
                  {/* Auto EMI Suggestion */}
                  {showAutoEmi && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, emi: suggestedEmi }))}
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 transition-colors w-full">
                      <Calculator size={11} /> ✨ Auto-fill EMI: ₹{Number(suggestedEmi).toLocaleString('en-IN')}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowForm(false); setAttempted(false); }} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"><Check size={13} /> Add Loan</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
              <Plus size={16} /> Add Loan / EMI
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Step 4: Goals (Multi-goal) ─────────────────────────────────────────────
function StepGoals({ goals, onAdd, onRemove }) {
  const emptyForm = { name: '', target: '', year: '' };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(goals.length === 0);
  const [attempted, setAttempted] = useState(false);

  const handleAdd = () => {
    setAttempted(true);
    if (!form.name || !form.target) return;
    onAdd({ name: form.name, target: parseFloat(form.target) || 0, saved: 0, date: form.year ? `${form.year}-01-01` : '', contribution: 0, roi: 12 });
    setForm(emptyForm);
    setAttempted(false);
    setShowForm(false);
  };

  const err = (field) => attempted && !form[field] ? '!border-rose-500 !ring-1 !ring-rose-500' : '';

  return (
    <div className="space-y-3">
      {/* Goals list */}
      {goals.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added ({goals.length})</span>
          {goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white truncate block">{g.name}</span>
                <span className="text-slate-400 text-xs">{g.date ? `Target: ${g.date.substring(0,4)}` : 'No deadline'}</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">₹{Number(g.target).toLocaleString('en-IN')}</span>
              <button onClick={() => onRemove(i)} className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 flex-shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-3">
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {GOAL_PRESETS.map(g => (
              <button key={g.name} type="button" onClick={() => setForm(f => ({ ...f, name: g.name }))}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors flex items-center gap-1 ${form.name === g.name ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-400'}`}>
                <span>{g.icon}</span><span>{g.name}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={labelCls}>Goal Name *</label>
              <input type="text" className={`${inputCls} ${err('name')}`} placeholder="e.g. Daughter's Marriage" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Target Amount (₹) * <Hint text="How much you'll need total. Best estimate is fine!" /></label>
              <div className="relative">
                <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" className={`${inputCls} pl-6 ${err('target')}`} placeholder="10,00,000" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Target Year <Hint text="By which year you want to achieve this goal." /></label>
              <input type="number" className={inputCls} placeholder={String(new Date().getFullYear() + 5)} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} min={new Date().getFullYear()} max={2075} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowForm(false); setAttempted(false); }} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"><Check size={13} /> Add Goal</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
          <Plus size={16} /> Add {goals.length > 0 ? 'Another' : 'a'} Goal
        </button>
      )}
    </div>
  );
}

// ── Celebration Screen ──────────────────────────────────────────────────────
function Celebration({ cashflow, assets, debts, onDone }) {
  const totalAssets = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const totalDebts = debts.reduce((s, d) => s + (parseFloat(d.value) || 0), 0);
  const netWorth = totalAssets - totalDebts;
  const surplus = (parseFloat(cashflow.income) || 0) - (parseFloat(cashflow.expenses) || 0) - (parseFloat(cashflow.emi) || 0);
  const metrics = [
    { label: 'Net Worth', value: `₹${Math.abs(netWorth).toLocaleString('en-IN')}`, sub: netWorth >= 0 ? 'Assets − Debts' : 'More debt than assets', color: netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500' },
    { label: 'Monthly Surplus', value: `${surplus >= 0 ? '+' : '−'}₹${Math.abs(surplus).toLocaleString('en-IN')}`, sub: surplus >= 0 ? 'Free to invest' : 'Review expenses', color: surplus >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500' },
    { label: 'Total Assets', value: `₹${totalAssets.toLocaleString('en-IN')}`, sub: `${assets.length} item${assets.length === 1 ? '' : 's'}`, color: 'text-slate-900 dark:text-white' },
    { label: 'Total Loans', value: `₹${totalDebts.toLocaleString('en-IN')}`, sub: totalDebts === 0 ? '🎊 Debt-free!' : `${debts.length} loan${debts.length === 1 ? '' : 's'}`, color: totalDebts === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500' },
  ];
  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">🎉</div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">You're all set!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your financial command center is live.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-left">
        {metrics.map(m => (
          <div key={m.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{m.label}</p>
            <p className={`text-sm font-bold ${m.color} truncate`}>{m.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => onDone('dashboard')}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md hover:-translate-y-0.5">
          <Sparkles size={15} /> Explore Dashboard
        </button>
        <button onClick={() => onDone('fire')}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-semibold text-sm transition-colors">
          🔥 See My FIRE Number
        </button>
      </div>
    </div>
  );
}

// ── Main Wizard ─────────────────────────────────────────────────────────────
export default function SetupWizard({ onComplete, onSkip, onActive }) {
  const { state, updateField, addItem } = useAppState();

  const hasIncome = (parseFloat(state.income) || 0) > 0;
  const hasExpenses = (parseFloat(state.expenses) || 0) > 0;
  const hasAsset = state.assets.length > 0;
  const isSetupComplete = hasIncome && hasExpenses && hasAsset;

  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    const skippedAt = parseInt(localStorage.getItem(WIZARD_SKIPPED_AT) || '0', 10);
    if (skippedAt && (Date.now() - skippedAt < EIGHT_HOURS)) {
      return true; // Still within 8 hour cooldown
    }
    return false;
  });

  // Initialize with global state
  const [cashflow, setCashflow] = useState({ 
    income: state.income || '', 
    expenses: state.expenses || '', 
    emi: state.emi || '' 
  });
  
  // Track ONLY newly added items so we don't duplicate what's already in global state
  const [newAssets, setNewAssets] = useState([]);
  const [newDebts, setNewDebts] = useState([]);
  const [newGoals, setNewGoals] = useState([]);

  // Report active status upwards
  React.useEffect(() => {
    if (onActive) onActive(!isSetupComplete && !dismissed);
  }, [isSetupComplete, dismissed, onActive]);

  if (isSetupComplete || dismissed) return null;

  const isCelebration = currentStep === STEPS.length;
  const stepConfig = !isCelebration ? STEPS[currentStep] : null;
  const c = colorMap[stepConfig?.color || 'indigo'];

  // Skip → dismiss for 8 hours
  const handleSkip = () => {
    localStorage.setItem(WIZARD_SKIPPED_AT, Date.now().toString());
    setDismissed(true);
    // If they provided any new mandatory data before skipping, save it!
    if (cashflow.income && cashflow.income !== state.income) updateField('income', parseFloat(cashflow.income) || 0);
    if (cashflow.expenses && cashflow.expenses !== state.expenses) updateField('expenses', parseFloat(cashflow.expenses) || 0);
    if (cashflow.emi && cashflow.emi !== state.emi) updateField('emi', parseFloat(cashflow.emi) || 0);
    newAssets.forEach(a => addItem('assets', a));
    newDebts.forEach(d => addItem('liabilities', d));
    newGoals.forEach(g => addItem('goals', g));

    if (onSkip) onSkip();
  };

  // Finish → commit data
  const commitAndFinish = (view) => {
    if (cashflow.income && cashflow.income !== state.income) updateField('income', parseFloat(cashflow.income) || 0);
    if (cashflow.expenses && cashflow.expenses !== state.expenses) updateField('expenses', parseFloat(cashflow.expenses) || 0);
    if (cashflow.emi && cashflow.emi !== state.emi) updateField('emi', parseFloat(cashflow.emi) || 0);
    newAssets.forEach(a => addItem('assets', a));
    newDebts.forEach(d => addItem('liabilities', d));
    newGoals.forEach(g => addItem('goals', g));
    
    // Once fully completed, it checks the data (income+expenses+assets) next reload.
    // We also set the skip timer so it doesn't pop up again immediately just in case.
    localStorage.setItem(WIZARD_SKIPPED_AT, Date.now().toString());
    setDismissed(true);
    if (onComplete) onComplete(view);
  };

  const headings = [
    { emoji: '💰', title: "What's your monthly income?", sub: "Helps us calculate your surplus and FIRE timeline. Estimates are fine!" },
    { emoji: '📈', title: "What do you own?", sub: "Add savings, investments, and valuables. The more you add, the better your net worth picture." },
    { emoji: '🏦', title: "Any loans or EMIs?", sub: "Tracking loans improves your health score and shows payoff progress." },
    { emoji: '🎯', title: "What are you saving for?", sub: "Add one or more goals — it makes your FIRE journey feel real!" },
  ];
  const heading = !isCelebration ? headings[currentStep] : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <style>{`
        @keyframes wizardSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .wizard-card { animation: wizardSlideUp 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className="wizard-card w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 32px)' }}>

        {/* ─ Header ─ */}
        <div className="flex-shrink-0 px-5 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {stepConfig && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bgLight}`}>
                  <stepConfig.icon size={15} className={c.text} />
                </div>
              )}
              {!isCelebration ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-0.5">Step {currentStep + 1} of {STEPS.length}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{stepConfig?.label}</p>
                </div>
              ) : (
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Setup Complete ✅</p>
              )}
            </div>
            <button onClick={handleSkip} title="Skip setup"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={16} />
            </button>
          </div>

          {!isCelebration && (
            <>
              <div className="flex gap-1.5 mb-1">
                {STEPS.map((s, i) => (
                  <div key={s.id} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? c.progress : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>
              <div className="flex justify-between mb-3">
                {STEPS.map((s, i) => (
                  <span key={s.id} className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${i <= currentStep ? c.text : 'text-slate-400 dark:text-slate-600'}`}>{s.label}</span>
                ))}
              </div>
              {heading && (
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{heading.emoji} {heading.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{heading.sub}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─ Scrollable Body ─ */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
          {!isCelebration ? (
            <>
              {currentStep === 0 && <StepCashflow data={cashflow} onChange={(f, v) => setCashflow(p => ({ ...p, [f]: v }))} />}
              {currentStep === 1 && <StepAssets assets={[...state.assets, ...newAssets]} onAdd={a => setNewAssets(p => [...p, a])} onRemove={i => {
                // Determine if they are trying to remove a pre-existing asset or a newly added one
                if (i >= state.assets.length) setNewAssets(p => p.filter((_, idx) => idx !== (i - state.assets.length)));
              }} />}
              {currentStep === 2 && <StepDebts debts={[...state.liabilities, ...newDebts]} onAdd={d => setNewDebts(p => [...p, d])} onRemove={i => {
                if (i >= state.liabilities.length) setNewDebts(p => p.filter((_, idx) => idx !== (i - state.liabilities.length)));
              }} />}
              {currentStep === 3 && <StepGoals goals={[...state.goals, ...newGoals]} onAdd={g => setNewGoals(p => [...p, g])} onRemove={i => {
                if (i >= state.goals.length) setNewGoals(p => p.filter((_, idx) => idx !== (i - state.goals.length)));
              }} />}
            </>
          ) : (
            <Celebration cashflow={cashflow} assets={[...state.assets, ...newAssets]} debts={[...state.liabilities, ...newDebts]} onDone={commitAndFinish} />
          )}
        </div>

        {/* ─ Footer ─ */}
        {!isCelebration && (
          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
            {currentStep > 0 ? (
              <button onClick={() => setCurrentStep(s => s - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}
            <div className="flex-1" />
            <button onClick={handleSkip} className="text-xs text-slate-400 hover:underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2">
              Skip setup
            </button>
            <button onClick={() => { if (currentStep < STEPS.length) setCurrentStep(s => s + 1); }}
              className={`flex items-center gap-1.5 px-4 py-2 ${c.btn} text-white rounded-xl font-bold text-xs transition-all shadow hover:-translate-y-0.5 active:translate-y-0`}>
              {currentStep === STEPS.length - 1 ? <><Check size={13} /> Finish</> : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}