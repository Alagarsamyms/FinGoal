import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { X, Mail, Lock, User, Loader2, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * AuthModal — Signup / Login modal for FinGoal OS
 * Props:
 *   isOpen      : boolean
 *   onClose     : () => void
 *   onSuccess   : (user) => void  — called after successful auth
 *   defaultTab  : 'login' | 'signup'
 */
export default function AuthModal({ isOpen, onClose, onSuccess, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: string }

  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  if (!isOpen) return null;

  const clearMessage = () => setMessage(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessage();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Signed in successfully!' });
      setTimeout(() => { onSuccess?.(data.user); onClose(); }, 800);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setLoading(true);
    clearMessage();

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim() },
      },
    });

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user && !data.session) {
      // Email confirmation required
      setMessage({ type: 'success', text: 'Account created! Please check your email to confirm your account.' });
    } else {
      setMessage({ type: 'success', text: 'Account created and signed in!' });
      setTimeout(() => { onSuccess?.(data.user); onClose(); }, 800);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    clearMessage();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // Browser will redirect; no need to setLoading(false)
  };

  const handlePasswordReset = async () => {
    if (!form.email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address first.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
      redirectTo: `${window.location.origin}?reset=true`,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password reset email sent. Check your inbox.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {tab === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{tab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="text-indigo-200 text-sm">{tab === 'login' ? 'Sign in to access your financial plan' : 'Secure your financial data across all devices'}</p>
            </div>
          </div>
          {/* Privacy Trust Badge */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-indigo-100/90 bg-white/10 rounded-lg px-3 py-2">
            <span>🔒 No bank linking required</span>
            <span className="text-white/30">·</span>
            <span>🗄️ Data encrypted & secure</span>
            <span className="text-white/30">·</span>
            <span>🚫 Never sold</span>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); clearMessage(); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {tab === 'signup' && (
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mb-5 px-2 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#legal" onClick={onClose} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Terms of Service</a>
              {' '}and{' '}
              <a href="#legal" onClick={onClose} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Privacy Policy</a>.
            </p>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 font-medium text-sm mb-4 disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={set('fullName')}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder={tab === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                  value={form.password}
                  onChange={set('password')}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${message.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700'
                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                }`}>
                {message.type === 'error' ? <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-wait text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Please wait…' : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {tab === 'login' && (
            <button
              onClick={handlePasswordReset}
              className="mt-3 w-full text-center text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              Forgot your password?
            </button>
          )}

          <div className="mt-6 text-center text-[11px] text-slate-500 dark:text-slate-400">
            By continuing, you agree to our{' '}
            <button 
              onClick={() => { window.location.hash = '#legal'; onClose(); }} 
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button 
              onClick={() => { window.location.hash = '#legal'; onClose(); }} 
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Privacy Policy
            </button>.
          </div>
        </div>
      </div>
    </div>
  );
}
