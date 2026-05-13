import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { exportToExcel } from '../utils/exportExcel';
import { Download, Database, Layers, Plus, Edit2, Trash2, Check, X, User } from 'lucide-react';

export default function Settings() {
  const { state, updateField, addAssetType, removeAssetType, renameAssetType } = useAppState();

  const [newType, setNewType] = useState('');
  const [editingType, setEditingType] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const assetTypes = state.settings?.assetTypes || ['Mutual Fund', 'Equity', 'Gold', 'Real Estate', 'Debt', 'Cash'];

  const handleKeyChange = (e) => {
    updateField('settings', { ...state.settings, openaiApiKey: e.target.value });
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-3xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">AI & Settings</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Configure your personal finance AI advisor.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">OpenAI Integration</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Connect your OpenAI API key to enable the AI Financial Advisor. This key is stored securely in your personal Google Drive and is only used to generate personalized strategies.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">OpenAI API Key</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                className="w-full border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                value={state.settings?.openaiApiKey || ''} 
                onChange={handleKeyChange} 
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">Your key is synced securely to your Google Drive and never sent to any other server.</p>
            </div>
          </div>
        </div>
      </div>

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
                        if (window.confirm(`Are you sure you want to delete the "${type}" category? Assets currently using this category will keep the string value, but it won't appear in the dropdown.`)) {
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

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Database size={24} />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data & Backups</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Export your entire FinGoal OS state into a formatted Excel spreadsheet for offline analysis or safe keeping.
            </p>
            <button 
              onClick={() => exportToExcel(state)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              <Download size={18} />
              Export to Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
