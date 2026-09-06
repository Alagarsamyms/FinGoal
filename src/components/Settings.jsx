import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/exportExcel';
import { supabase } from '../utils/supabase';
import {
  Download, Database, Layers, Plus, Edit2, Trash2, Check, X,
  User, Loader2, LogOut, ShieldCheck, AlertTriangle, CheckCircle2, FileText, ExternalLink
} from 'lucide-react';
import { InfoTooltip } from './Onboarding';
import AuthModal from './AuthModal';

export default function Settings({ setCurrentView }) {
  const { state, updateField, addAssetType, removeAssetType, renameAssetType } = useAppState();
  const { user, signOut, isGuest } = useAuth();

  const [newType, setNewType] = useState('');
  const [exporting, setExporting] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const assetTypes = state.settings?.assetTypes || ['Mutual Fund', 'Equity', 'Gold', 'Real Estate', 'Debt', 'Cash'];

  // ── Account Deletion ───────────────────────────────────────────────────────
  // Calls the delete-account Edge Function which removes ALL data + auth.users record.
  // This allows the same email to be re-registered immediately.
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ DELETE ACCOUNT\n\nThis will permanently delete all your financial data including assets, liabilities, goals, and your account.\n\nYou can re-register with the same email after deletion.\n\nThis action CANNOT be undone. Click OK to confirm.'
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Clear everything locally and sign out
      localStorage.clear();
      await signOut();
    } catch (err) {
      console.error('Account deletion failed:', err);
      alert(
        `Account deletion failed: ${err.message}\n\n` +
        `If the error persists, please ensure the "delete-account" Edge Function is deployed in your Supabase project.`
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-3xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Settings
          <InfoTooltip title="Settings" text="Manage your account, customize asset categories, set your date of birth for FIRE calculations, and export your data." />
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
          Account, preferences, and data management.
        </p>
      </div>

      {/* ── Account Section ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account & Security</h2>

            {isGuest ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">You're in Guest Mode</p>
                    <p className="mt-0.5 text-amber-700 dark:text-amber-400">Your data is saved locally in this browser only. Create an account to save your financial plan securely across all devices.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  <User size={16} /> Create Free Account / Sign In
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">Signed in</p>
                    <p className="text-emerald-700 dark:text-emerald-400">{user.email}</p>
                  </div>
                </div>


                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal Information ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <User size={24} />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Your details are used to calculate age-based projections in the FIRE engine and Protection analysis.
            </p>
            <div className="space-y-2 max-w-xs">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
              <input
                type="date"
                className="w-full border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 outline-none"
                value={state.settings?.dob || ''}
                onChange={(e) => updateField('settings', { ...state.settings, dob: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Asset Categories ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Layers size={24} />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Asset Categories</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Customize the types of assets available in your Accounts & Debt manager. Renaming a category will automatically update all existing assets assigned to it.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New Asset Type..."
                className="flex-1 border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newType.trim()) {
                    addAssetType(newType.trim());
                    setNewType('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newType.trim()) {
                    addAssetType(newType.trim());
                    setNewType('');
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {assetTypes.map(type => (
                <div key={type} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
                  {editingType === type ? (
                    <div className="flex-1 flex gap-2 mr-2">
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded px-2 py-1 outline-none focus:border-amber-500"
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editingValue.trim()) {
                            renameAssetType(type, editingValue.trim());
                            setEditingType(null);
                          } else if (e.key === 'Escape') {
                            setEditingType(null);
                          }
                        }}
                      />
                      <button onClick={() => {
                        if (editingValue.trim()) {
                          renameAssetType(type, editingValue.trim());
                          setEditingType(null);
                        }
                      }} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded dark:hover:bg-emerald-900/30"><Check size={16} /></button>
                      <button onClick={() => setEditingType(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded dark:hover:bg-slate-600"><X size={16} /></button>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-700 dark:text-slate-200">{type}</span>
                  )}

                  {!editingType && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setEditingType(type);
                        setEditingValue(type);
                      }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the "${type}" category?`)) {
                          removeAssetType(type);
                        }
                      }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Data & Backups ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Database size={24} />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data & Backups</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Export your entire Wealth For FIRE state into a formatted Excel spreadsheet for offline analysis or safe keeping.
            </p>
            <button
              onClick={() => {
                setExporting(true);
                try { exportToExcel(state); }
                finally { setExporting(false); }
              }}
              disabled={exporting}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-wait text-white rounded-lg font-medium transition-colors"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {exporting ? 'Generating Excel…' : 'Export to Excel (.xlsx)'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Danger Zone (authenticated users only) ───────────────────────────── */}
      {!isGuest && (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-rose-200 dark:border-rose-800 shadow-sm transition-colors">
          <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-2">
            <AlertTriangle size={20} /> Danger Zone
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Permanently delete your account and all associated financial data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {deletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {deletingAccount ? 'Deleting…' : 'Delete Account & All Data'}
          </button>
        </div>
      )}

      {/* ── Legal ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <FileText size={24} />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy & Legal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Read our Privacy Policy, Terms of Service, and financial disclaimer for Wealth For FIRE.
            </p>
            <button
              onClick={() => setCurrentView && setCurrentView('legal')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <ShieldCheck size={16} /> View Privacy Policy & Terms
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
          defaultTab="signup"
        />
      )}
    </div>
  );
}
