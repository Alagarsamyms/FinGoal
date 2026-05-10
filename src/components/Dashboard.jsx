import React from 'react';
import ExecutiveSummary from './ExecutiveSummary';
import WealthProjection from './WealthProjection';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <ExecutiveSummary />
      
      {/* Charts and Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WealthProjection />
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px] flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900">AI Advisor Ready</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Navigate to the AI & Simulator tab to get personalized debt destruction strategies and FIRE readiness reports based on your current inputs.
          </p>
        </div>
      </div>
    </div>
  );
}
