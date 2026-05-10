import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function GoalTracker() {
  const { state, addItem, removeItem, updateItem } = useAppState();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [contribution, setContribution] = useState('');
  const [roi, setRoi] = useState('12');
  const [targetDate, setTargetDate] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);

  const handleAddGoal = () => {
    if (name && target) {
      if (editingGoalId) {
        updateItem('goals', editingGoalId, {
          name,
          target: parseFloat(target),
          saved: parseFloat(saved) || 0,
          contribution: parseFloat(contribution) || 0,
          roi: parseFloat(roi) || 0,
          date: targetDate
        });
        setEditingGoalId(null);
      } else {
        addItem('goals', {
          name,
          target: parseFloat(target),
          saved: parseFloat(saved) || 0,
          contribution: parseFloat(contribution) || 0,
          roi: parseFloat(roi) || 0,
          date: targetDate
        });
      }
      setName(''); setTarget(''); setSaved(''); setContribution(''); setTargetDate('');
    }
  };

  const handleEditGoal = (g) => {
    setName(g.name);
    setTarget(g.target);
    setSaved(g.saved);
    setContribution(g.contribution);
    setRoi(g.roi);
    setTargetDate(g.date || '');
    setEditingGoalId(g.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateMonthsToGoal = (current, targetAmt, monthly, roiAnnual) => {
    if (current >= targetAmt) return 0;
    if (monthly <= 0 && roiAnnual <= 0) return -1;
    let monthlyRate = (roiAnnual / 100) / 12;
    let balance = current;
    let months = 0;
    while (balance < targetAmt && months <= 1200) {
      balance += (balance * monthlyRate) + monthly;
      months++;
    }
    return months > 1200 ? 1201 : months;
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Goals Matrix</h1>
        <p className="text-slate-500 mt-1">Plan, project, and achieve your financial milestones.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Goal</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Goal Name</label>
            <input type="text" className="w-full border p-2 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-500 mb-1">Target (₹)</label>
            <input type="number" className="w-full border p-2 rounded-lg" value={target} onChange={e => setTarget(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-500 mb-1">Current (₹)</label>
            <input type="number" className="w-full border p-2 rounded-lg" value={saved} onChange={e => setSaved(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-500 mb-1">Monthly SIP (₹)</label>
            <input type="number" className="w-full border p-2 rounded-lg" value={contribution} onChange={e => setContribution(e.target.value)} />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-500 mb-1">ROI (%)</label>
            <input type="number" className="w-full border p-2 rounded-lg" value={roi} onChange={e => setRoi(e.target.value)} />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-slate-500 mb-1">Target Date</label>
            <input type="month" className="w-full border p-2 rounded-lg text-sm" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <button onClick={handleAddGoal} className={`px-6 py-2 rounded-lg text-white h-[42px] font-medium ${editingGoalId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {editingGoalId ? 'Update Goal' : 'Add Goal'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {state.goals.map(g => {
          const monthsReq = calculateMonthsToGoal(g.saved, g.target, g.contribution, g.roi);
          
          let predictedDate = new Date();
          predictedDate.setMonth(predictedDate.getMonth() + monthsReq);
          
          let targetD = g.date ? new Date(g.date) : null;
          let statusIcon = null;
          let statusColor = "text-slate-500";
          let statusBg = "bg-slate-100";
          let statusText = "No date set";

          if (g.saved >= g.target) {
            statusIcon = <CheckCircle2 size={16} />; statusColor = "text-emerald-700"; statusBg = "bg-emerald-100"; statusText = "Achieved";
          } else if (monthsReq === -1 || monthsReq > 1200) {
            statusIcon = <XCircle size={16} />; statusColor = "text-rose-700"; statusBg = "bg-rose-100"; statusText = "Unachievable";
          } else if (targetD) {
            if (predictedDate <= targetD) {
              statusIcon = <CheckCircle2 size={16} />; statusColor = "text-emerald-700"; statusBg = "bg-emerald-100"; statusText = "On Track";
            } else {
              statusIcon = <AlertTriangle size={16} />; statusColor = "text-amber-700"; statusBg = "bg-amber-100"; statusText = "At Risk";
            }
          } else {
            statusText = `${predictedDate.toLocaleString('default', {month:'short'})} ${predictedDate.getFullYear()}`;
          }

          const percent = Math.min((g.saved / g.target) * 100, 100).toFixed(1);

          return (
            <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative group">
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditGoal(g)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={18} /></button>
                <button onClick={() => removeItem('goals', g.id)} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 size={18} /></button>
              </div>
              
              <div className="flex justify-between items-start mb-4 pr-16">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{g.name}</h3>
                  <div className="text-sm text-slate-500 mt-1 flex gap-4">
                    <span>Target: ₹{g.target.toLocaleString('en-IN')}</span>
                    <span>SIP: ₹{g.contribution.toLocaleString('en-IN')}</span>
                    <span>ROI: {g.roi}%</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
                  {statusIcon} {statusText}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">₹{g.saved.toLocaleString('en-IN')} saved</span>
                  <span className="text-indigo-600">{percent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${percent}%`}}></div>
                </div>
                <div className="text-xs text-slate-400 text-right mt-1">
                  Predicted: {monthsReq <= 1200 && monthsReq !== -1 ? `${predictedDate.toLocaleString('default', {month:'short'})} ${predictedDate.getFullYear()}` : 'Never'}
                </div>
              </div>
            </div>
          );
        })}
        {state.goals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            No goals added. Start planning your future!
          </div>
        )}
      </div>
    </div>
  );
}
