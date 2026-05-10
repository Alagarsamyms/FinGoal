import React from 'react';
import ExecutiveSummary from './ExecutiveSummary';
import WealthProjection from './WealthProjection';
import GoalsOverview from './GoalsOverview';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <ExecutiveSummary />
      
      {/* Charts and Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WealthProjection />
        <GoalsOverview />
      </div>
    </div>
  );
}
