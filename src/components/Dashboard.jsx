import React from 'react';
import ExecutiveSummary from './ExecutiveSummary';
import DebtDashboard from './DebtDashboard';
import GoalsOverview from './GoalsOverview';
import UnlinkedAssetsProjection from './UnlinkedAssetsProjection';
import PortfolioDiversification from './PortfolioDiversification';
import CashflowFunnel from './CashflowFunnel';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <ExecutiveSummary />
      
      {/* Portfolio & Cashflow Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PortfolioDiversification />
        <CashflowFunnel />
      </div>
      
      {/* Charts and Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <UnlinkedAssetsProjection />
        </div>
        <DebtDashboard />
        <GoalsOverview />
      </div>
    </div>
  );
}
