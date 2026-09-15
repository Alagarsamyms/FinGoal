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

  // Close on outside click or ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const keyHandler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1.5">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(v => !v);
          }
        }}
        aria-label="More information"
        className="text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors focus:outline-none p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        <Info size={16} />
      </span>

      {open && (
        <>
          {/* MOBILE VIEW (< 640px): Fixed center popover card with backdrop */}
          <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div
              className="w-full max-w-sm bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl p-5 relative border border-slate-700/80 text-left font-normal normal-case tracking-normal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                {title ? (
                  <h4 className="font-bold text-base text-indigo-300 flex items-center gap-1.5">
                    <Info size={16} className="text-indigo-400" />
                    {title}
                  </h4>
                ) : <span />}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors -mr-1 -mt-1"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">{text}</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (>= 640px): Anchored popover */}
          <div className="hidden sm:block absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-72 text-left font-normal normal-case tracking-normal">
            {/* Arrow */}
            <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 dark:bg-slate-700 rotate-45 rounded-sm border-t border-l border-slate-700/50" />
            {/* Card */}
            <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-2xl px-4 py-3.5 text-sm relative border border-slate-700/80">
              {title && <p className="font-semibold mb-1 text-indigo-300">{title}</p>}
              <p className="leading-relaxed text-slate-200 text-xs sm:text-sm">{text}</p>
              <button
                onClick={() => setOpen(false)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────

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
