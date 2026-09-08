import { useState, useEffect, useRef } from 'react';
import { X, Download, Smartphone, ExternalLink } from 'lucide-react';

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEY_DISMISSED_AT  = 'wff_install_dismissed_at';
const KEY_INSTALLED     = 'wff_installed';
// ── Timings ───────────────────────────────────────────────────────────────────
const INITIAL_DELAY_MS  = 10_000;       // First show: 10 s after load
const DISMISS_COOLDOWN  = 60 * 60 * 1000; // Re-show 1 h after last dismiss

// ── Helpers ───────────────────────────────────────────────────────────────────
const isRunningStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const isMobileOrTablet = () => window.innerWidth < 1024;

// ── Component ─────────────────────────────────────────────────────────────────
export default function InstallPrompt() {
  // 'install'  – user is in browser, app NOT yet installed → nudge to install
  // 'openapp'  – user is in browser, app IS installed      → nudge to open app
  // null       – show nothing
  const [mode, setMode]               = useState(null);
  const [deferredPrompt, setDeferred] = useState(null);
  const [visible, setVisible]         = useState(false);
  const timerRef                      = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Determine what to show once per load
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Already running as installed app → nothing to show
    if (isRunningStandalone()) return;

    const wasInstalled = localStorage.getItem(KEY_INSTALLED) === '1';

    if (wasInstalled) {
      // App is installed but user opened the browser version → nag them
      setMode('openapp');
      timerRef.current = setTimeout(() => setVisible(true), INITIAL_DELAY_MS);
      return;
    }

    // ── Not installed yet: check dismiss cooldown ──────────────────────────
    const dismissedAt  = parseInt(localStorage.getItem(KEY_DISMISSED_AT) || '0', 10);
    const cooldownOver = Date.now() - dismissedAt > DISMISS_COOLDOWN;
    if (!cooldownOver && dismissedAt !== 0) return;

    // Capture browser's native install event
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // Confirm when user actually installed
    const onInstalled = () => {
      localStorage.setItem(KEY_INSTALLED, '1');
      setVisible(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    setMode('install');
    timerRef.current = setTimeout(() => setVisible(true), INITIAL_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(timerRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────
  const dismiss = () => {
    localStorage.setItem(KEY_DISMISSED_AT, String(Date.now()));
    setVisible(false);

    // Re-show after 1 hour (only for same browser session that stays open)
    timerRef.current = setTimeout(() => {
      const now       = Date.now();
      const dismissed = parseInt(localStorage.getItem(KEY_DISMISSED_AT) || '0', 10);
      if (now - dismissed >= DISMISS_COOLDOWN) setVisible(true);
    }, DISMISS_COOLDOWN);
  };

  const triggerNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(KEY_INSTALLED, '1');
      }
      setDeferred(null);
    }
    setVisible(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Nothing to render
  // ─────────────────────────────────────────────────────────────────────────
  if (!visible || !mode) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // "Open in App" nudge (installed but opened in browser)
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'openapp') {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] md:hidden"
          onClick={dismiss}
        />
        <div className="fixed z-[9999] bottom-4 left-3 right-3 md:bottom-6 md:right-6 md:left-auto md:w-80 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-2xl shadow-2xl shadow-emerald-200/40 dark:shadow-emerald-900/40 p-4 flex items-start gap-3 animate-slide-up">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <img src="/logo.png" alt="App icon" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
              You have the app installed! 🎉
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Open <strong>Wealth For FIRE</strong> from your home screen for a faster, full-screen experience.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all"
              >
                <ExternalLink size={12} />
                Got it — opening app
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // "Install" nudge (not yet installed)
  // ─────────────────────────────────────────────────────────────────────────
  const ios = isIOS();
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden"
        onClick={dismiss}
      />

      <div className="fixed z-[9999] bottom-4 left-3 right-3 md:bottom-6 md:right-6 md:left-auto md:w-80 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-700 rounded-2xl shadow-2xl shadow-indigo-200/40 dark:shadow-indigo-900/40 p-4 flex items-start gap-3 animate-slide-up">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <img src="/logo.png" alt="App icon" className="w-8 h-8 object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
            Install Wealth For FIRE
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {ios
              ? "Add to your home screen for the full app experience — no App Store needed."
              : "Add to your home screen for instant, offline access — free, no app store needed."}
          </p>

          {/* iOS step-by-step guide */}
          {ios ? (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h8M12 8v8M12 2a10 10 0 100 20A10 10 0 0012 2z" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px] font-semibold">1. Tap Share ⬆</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600 text-xs">→</span>
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                <Smartphone size={11} />
                <span className="text-[10px] font-semibold">2. Add to Home Screen</span>
              </div>
            </div>
          ) : (
            <button
              onClick={triggerNativeInstall}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all"
            >
              <Download size={13} />
              Install App — It's Free
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </>
  );
}
