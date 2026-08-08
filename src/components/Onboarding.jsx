import React, { useState, useEffect, useRef } from 'react';
import { Info, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

// ─────────────────────────────────────────────────────────────────
// LAYER 2: InfoTooltip — small ℹ️ icon with popover
// Usage: <InfoTooltip text="Explain this section..." />
// ─────────────────────────────────────────────────────────────────
export function InfoTooltip({ text, title }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1.5">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="More information"
        className="text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
      >
        <Info size={15} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-[-16px] sm:left-1/2 sm:-translate-x-1/2 w-64 sm:w-72 text-left font-normal normal-case tracking-normal">
          {/* Arrow */}
          <div className="absolute top-[-6px] left-[24px] sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-slate-800 dark:bg-slate-700 rotate-45 rounded-sm" />
          {/* Card */}
          <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-2xl px-4 py-3 text-sm relative">
            {title && <p className="font-semibold mb-1 text-indigo-300">{title}</p>}
            <p className="leading-relaxed text-slate-200">{text}</p>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// LAYER 1: WelcomeBanner — shown once on first visit
// ─────────────────────────────────────────────────────────────────
const WELCOME_KEY = 'fingoal_welcome_dismissed_v1';

const STEPS = [
  {
    icon: '💰',
    title: 'Add Your Money',
    desc: 'Go to Accounts & Debt → enter your income, expenses, assets (mutual funds, gold, equity) and any loans.',
  },
  {
    icon: '🎯',
    title: 'Set Your Goals',
    desc: 'In Goals Matrix, create financial goals like a home purchase or retirement. Link your assets to track real progress.',
  },
  {
    icon: '📊',
    title: 'Watch It Work',
    desc: 'Your Command Center auto-calculates your Net Worth, Health Score, FIRE number, and more — all in real time.',
  },
];

export function WelcomeBanner({ onNavigate }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { state } = useAppState();

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_KEY);
    // Don't show if they dismissed it, OR if they are already an existing user (have assets/liabilities/income)
    const isExistingUser = state.assets.length > 0 || state.liabilities.length > 0 || (parseFloat(state.income) > 0);
    
    if (!dismissed && !isExistingUser) {
      setVisible(true);
    } else if (!dismissed && isExistingUser) {
      // Silently dismiss for existing users so they never see it
      localStorage.setItem(WELCOME_KEY, '1');
    }
  }, [state.assets.length, state.liabilities.length, state.income]);

  const dismiss = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={{ animation: 'welcomeIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <style>{`
          @keyframes welcomeIn {
            from { opacity: 0; transform: scale(0.92) translateY(24px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white relative">
          <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
          <div className="text-3xl mb-1">👋</div>
          <h2 className="text-xl font-bold">Welcome to FinGoal OS</h2>
          <p className="text-indigo-200 text-sm mt-0.5">Your personal finance operating system</p>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-600' : 'w-3 bg-slate-200 dark:bg-slate-600'}`}
              />
            ))}
          </div>

          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-2xl">
              {currentStep.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Step {step + 1}: {currentStep.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentStep.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 flex items-center gap-3">
          {step < STEPS.length - 1 ? (
            <>
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors">
                Next →
              </button>
              <button onClick={dismiss} className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-sm hover:underline">
                Skip
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { dismiss(); onNavigate && onNavigate('accounts'); }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                🚀 Start with Accounts & Debt
              </button>
              <button onClick={dismiss} className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-sm hover:underline">
                Close
              </button>
            </>
          )}
        </div>

        {/* Quick tips strip */}
        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            💡 Hover the <span className="inline-flex items-center gap-0.5 text-indigo-500"><Info size={11} /> info</span> icons anytime for tips on each section
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LAYER 3: SectionEmptyState — rich placeholder when no data
// Usage: <SectionEmptyState icon="💼" title="No Assets Yet" ... />
// ─────────────────────────────────────────────────────────────────
export function SectionEmptyState({ icon, title, description, example, ctaLabel, onCta, accentColor = 'indigo' }) {
  const colors = {
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950/30',  border: 'border-indigo-200 dark:border-indigo-800',  btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',  tag: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' },
    rose:    { bg: 'bg-rose-50 dark:bg-rose-950/30',      border: 'border-rose-200 dark:border-rose-800',      btn: 'bg-rose-600 hover:bg-rose-700 text-white',      tag: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30',border: 'border-emerald-200 dark:border-emerald-800',btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30',    border: 'border-amber-200 dark:border-amber-800',    btn: 'bg-amber-500 hover:bg-amber-600 text-white',    tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
  };
  const c = colors[accentColor] || colors.indigo;

  return (
    <div className={`rounded-xl border-2 border-dashed ${c.border} ${c.bg} p-6 text-center`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4 leading-relaxed">{description}</p>
      {example && (
        <div className={`inline-block text-xs rounded-lg px-3 py-1.5 mb-4 font-mono ${c.tag}`}>
          e.g. {example}
        </div>
      )}
      {ctaLabel && onCta && (
        <div>
          <button
            onClick={onCta}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.btn}`}
          >
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
