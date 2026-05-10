import React from 'react';
import { useAppState } from '../context/AppStateContext';

export default function Settings() {
  const { state, updateField } = useAppState();

  const handleKeyChange = (e) => {
    updateField('settings', { ...state.settings, openaiApiKey: e.target.value });
  };

  return (
    <div className="space-y-8 pb-20 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI & Settings</h1>
        <p className="text-slate-500 mt-1">Configure your personal finance AI advisor.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">OpenAI Integration</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Connect your OpenAI API key to enable the AI Financial Advisor. This key is stored securely in your personal Google Drive and is only used to generate personalized strategies.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">OpenAI API Key</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                value={state.settings?.openaiApiKey || ''} 
                onChange={handleKeyChange} 
              />
              <p className="text-xs text-slate-400">Your key is synced securely to your Google Drive and never sent to any other server.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
