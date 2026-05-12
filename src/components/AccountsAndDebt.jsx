import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

export default function AccountsAndDebt() {
  const { state, updateField, addItem, removeItem, updateItem } = useAppState();

  const [assetName, setAssetName] = useState('');
  const [assetInvested, setAssetInvested] = useState('');
  const [assetCurrent, setAssetCurrent] = useState('');
  const [assetSip, setAssetSip] = useState('');
  const [assetRoi, setAssetRoi] = useState('');
  
  const assetTypes = state.settings?.assetTypes || ['Mutual Fund', 'Equity', 'Gold', 'Real Estate', 'Debt', 'Cash'];
  const [assetType, setAssetType] = useState(assetTypes[0]);
  const [editingAssetId, setEditingAssetId] = useState(null);

  const [liabName, setLiabName] = useState('');
  const [liabValue, setLiabValue] = useState('');
  const [liabEmi, setLiabEmi] = useState('');
  const [liabRate, setLiabRate] = useState('');
  const [editingLiabId, setEditingLiabId] = useState(null);

  const handleAddAsset = () => {
    if (assetName && assetCurrent) {
      const newAsset = {
        name: assetName,
        type: assetType,
        invested: parseFloat(assetInvested) || 0,
        currentValue: parseFloat(assetCurrent) || 0,
        sip: parseFloat(assetSip) || 0,
        roi: parseFloat(assetRoi) || 0
      };
      
      if (editingAssetId) {
        updateItem('assets', editingAssetId, newAsset);
        setEditingAssetId(null);
      } else {
        addItem('assets', newAsset);
      }
      setAssetName(''); setAssetInvested(''); setAssetCurrent(''); setAssetSip(''); setAssetRoi('');
    }
  };

  const handleEditAsset = (asset) => {
    setAssetName(asset.name);
    setAssetInvested(asset.invested || '');
    setAssetCurrent(asset.currentValue || asset.value || '');
    setAssetSip(asset.sip || '');
    setAssetRoi(asset.roi || '');
    setAssetType(asset.type);
    setEditingAssetId(asset.id);
  };

  const handleAddLiability = () => {
    if (liabName && liabValue) {
      if (editingLiabId) {
        updateItem('liabilities', editingLiabId, { 
          name: liabName, 
          value: parseFloat(liabValue), 
          emi: parseFloat(liabEmi) || 0,
          interest: parseFloat(liabRate) || 0
        });
        setEditingLiabId(null);
      } else {
        addItem('liabilities', { 
          name: liabName, 
          value: parseFloat(liabValue), 
          emi: parseFloat(liabEmi) || 0,
          interest: parseFloat(liabRate) || 0
        });
      }
      setLiabName(''); setLiabValue(''); setLiabEmi(''); setLiabRate('');
    }
  };

  const handleEditLiability = (liab) => {
    setLiabName(liab.name);
    setLiabValue(liab.value);
    setLiabEmi(liab.emi || '');
    setLiabRate(liab.interest || '');
    setEditingLiabId(liab.id);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Accounts & Debt</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Manage your cash flow, assets, and liabilities.</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cash Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Income (₹)</label>
              <input type="number" className="w-full border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.income || ''} onChange={e => updateField('income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Expenses (₹)</label>
              <input type="number" className="w-full border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.expenses || ''} onChange={e => updateField('expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Other EMIs (₹)</label>
              <input type="number" className="w-full border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.emi || ''} onChange={e => updateField('emi', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Liability & Debt Manager</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="text" placeholder="Loan Name" className="flex-1 min-w-[200px] border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={liabName} onChange={e => setLiabName(e.target.value)} />
            <input type="number" placeholder="Outstanding (₹)" className="w-32 border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={liabValue} onChange={e => setLiabValue(e.target.value)} />
            <input type="number" placeholder="EMI (₹)" className="w-32 border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={liabEmi} onChange={e => setLiabEmi(e.target.value)} />
            <input type="number" placeholder="Rate (%)" className="w-24 border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={liabRate} onChange={e => setLiabRate(e.target.value)} />
            <button onClick={handleAddLiability} className={`px-4 py-2 rounded-lg text-white ${editingLiabId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
              {editingLiabId ? <Check size={20} /> : <Plus size={20} />}
            </button>
          </div>
          <div className="space-y-2">
            {state.liabilities.map(l => (
              <div key={l.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-lg transition-colors">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{l.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Rate: {l.interest}% | EMI: ₹{l.emi.toLocaleString('en-IN')}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-rose-600 dark:text-rose-500">₹{l.value.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditLiability(l)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit2 size={16} /></button>
                    <button onClick={() => removeItem('liabilities', l.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
            {state.liabilities.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No liabilities added.</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Assets Manager</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <input type="text" placeholder="Asset Name" className="border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg col-span-2 md:col-span-1" value={assetName} onChange={e => setAssetName(e.target.value)} />
            <select className="border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white p-2 rounded-lg col-span-2 md:col-span-1" value={assetType} onChange={e => setAssetType(e.target.value)}>
              {assetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input type="number" placeholder="Invested (₹)" className="border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={assetInvested} onChange={e => setAssetInvested(e.target.value)} />
            <input type="number" placeholder="Current Value (₹)" className="border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={assetCurrent} onChange={e => setAssetCurrent(e.target.value)} />
            <input type="number" placeholder="Monthly SIP (₹)" className="border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={assetSip} onChange={e => setAssetSip(e.target.value)} />
            <input type="number" placeholder="Exp. ROI (%)" className="border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 p-2 rounded-lg" value={assetRoi} onChange={e => setAssetRoi(e.target.value)} />
            <button onClick={handleAddAsset} className={`px-4 py-2 col-span-2 rounded-lg text-white font-medium ${editingAssetId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {editingAssetId ? 'Update Asset' : 'Add Asset'}
            </button>
          </div>
          <div className="space-y-2">
            {state.assets.map(a => {
              const val = a.currentValue || a.value || 0;
              return (
                <div key={a.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{a.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-3 mt-1">
                      <span>Type: {a.type}</span>
                      {a.sip > 0 && <span>SIP: ₹{a.sip.toLocaleString('en-IN')}</span>}
                      {a.roi > 0 && <span>ROI: {a.roi}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-500 block">₹{val.toLocaleString('en-IN')}</span>
                      {a.invested > 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500">Inv: ₹{a.invested.toLocaleString('en-IN')}</span>}
                    </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditAsset(a)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit2 size={16} /></button>
                    <button onClick={() => removeItem('assets', a.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
            })}
            {state.assets.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No assets added.</div>}
          </div>
        </div>
      </div>


    </div>
  );
}
