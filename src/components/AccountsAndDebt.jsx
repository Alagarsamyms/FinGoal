import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

export default function AccountsAndDebt() {
  const { state, updateField, addItem, removeItem, updateItem } = useAppState();

  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetType, setAssetType] = useState('Equity');
  const [editingAssetId, setEditingAssetId] = useState(null);

  const [liabName, setLiabName] = useState('');
  const [liabValue, setLiabValue] = useState('');
  const [liabEmi, setLiabEmi] = useState('');
  const [liabRate, setLiabRate] = useState('');
  const [editingLiabId, setEditingLiabId] = useState(null);

  const handleAddAsset = () => {
    if (assetName && assetValue) {
      if (editingAssetId) {
        updateItem('assets', editingAssetId, { name: assetName, value: parseFloat(assetValue), type: assetType });
        setEditingAssetId(null);
      } else {
        addItem('assets', { name: assetName, value: parseFloat(assetValue), type: assetType });
      }
      setAssetName(''); setAssetValue('');
    }
  };

  const handleEditAsset = (asset) => {
    setAssetName(asset.name);
    setAssetValue(asset.value);
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
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Accounts & Debt</h1>
        <p className="text-slate-500 mt-1">Manage your cash flow, assets, and liabilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Cash Flow</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Income (₹)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.income || ''} onChange={e => updateField('income', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Expenses (₹)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.expenses || ''} onChange={e => updateField('expenses', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Other EMIs (₹)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-500 outline-none" value={state.emi || ''} onChange={e => updateField('emi', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Assets Manager</h2>
          <div className="flex gap-3 mb-6">
            <input type="text" placeholder="Asset Name" className="flex-1 border p-2 rounded-lg" value={assetName} onChange={e => setAssetName(e.target.value)} />
            <input type="number" placeholder="Value (₹)" className="w-32 border p-2 rounded-lg" value={assetValue} onChange={e => setAssetValue(e.target.value)} />
            <select className="border p-2 rounded-lg" value={assetType} onChange={e => setAssetType(e.target.value)}>
              <option>Equity</option>
              <option>Debt</option>
              <option>Real Estate</option>
              <option>Gold</option>
              <option>Cash</option>
            </select>
            <button onClick={handleAddAsset} className={`px-4 py-2 rounded-lg text-white ${editingAssetId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {editingAssetId ? <Check size={20} /> : <Plus size={20} />}
            </button>
          </div>
          <div className="space-y-2">
            {state.assets.map(a => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.type}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-emerald-600">₹{a.value.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditAsset(a)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                    <button onClick={() => removeItem('assets', a.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
            {state.assets.length === 0 && <div className="text-sm text-slate-500 text-center py-4">No assets added.</div>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Liability & Debt Manager</h2>
        <div className="flex flex-wrap gap-3 mb-6">
          <input type="text" placeholder="Loan Name" className="flex-1 min-w-[200px] border p-2 rounded-lg" value={liabName} onChange={e => setLiabName(e.target.value)} />
          <input type="number" placeholder="Outstanding (₹)" className="w-32 border p-2 rounded-lg" value={liabValue} onChange={e => setLiabValue(e.target.value)} />
          <input type="number" placeholder="EMI (₹)" className="w-32 border p-2 rounded-lg" value={liabEmi} onChange={e => setLiabEmi(e.target.value)} />
          <input type="number" placeholder="Rate (%)" className="w-24 border p-2 rounded-lg" value={liabRate} onChange={e => setLiabRate(e.target.value)} />
          <button onClick={handleAddLiability} className={`px-4 py-2 rounded-lg text-white ${editingLiabId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
            {editingLiabId ? <Check size={20} /> : <Plus size={20} />}
          </button>
        </div>
        <div className="space-y-2">
          {state.liabilities.map(l => (
            <div key={l.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-slate-500">Rate: {l.interest}% | EMI: ₹{l.emi.toLocaleString('en-IN')}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-rose-600">₹{l.value.toLocaleString('en-IN')}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditLiability(l)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                  <button onClick={() => removeItem('liabilities', l.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {state.liabilities.length === 0 && <div className="text-sm text-slate-500 text-center py-4">No liabilities added.</div>}
        </div>
      </div>
    </div>
  );
}
