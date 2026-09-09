import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { Users, Bot, Share2, Activity, AlertCircle, RefreshCw, Wallet, CreditCard, Target, IndianRupee } from 'lucide-react';

function formatINR(value) {
  const num = Number(value);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) return `₹${+(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${+(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${+(num / 1000).toFixed(1)}K`;
  return `₹${+num.toFixed(1)}`;
}

export default function AdminDashboard({ setCurrentView }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAiQueries: 0,
    totalShares: 0,
    totalWealth: 0,
    totalDebt: 0,
    totalGoals: 0,
    avgIncome: 0
  });
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Security Guard: Only allow specific admin email
  useEffect(() => {
    if (!user || user.email !== 'alagar9894@gmail.com') {
      setCurrentView('dashboard');
    }
  }, [user, setCurrentView]);

  useEffect(() => {
    async function fetchAdminStats() {
      if (!isSupabaseConfigured()) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase.from('admin_stats_view').select('*').single();
        
        if (error) {
          console.error('Failed to fetch admin stats from view:', error);
          return;
        }

        if (data) {
          setStats({
            totalUsers: data.total_users || 0,
            totalAiQueries: data.total_ai_queries || 0,
            totalShares: data.total_shares || 0,
            totalWealth: data.total_wealth || 0,
            totalDebt: data.total_debt || 0,
            totalGoals: data.total_goals || 0,
            avgIncome: data.avg_monthly_income || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.email === 'alagar9894@gmail.com') {
      fetchAdminStats();
    }
  }, [user]);

  if (!user || user.email !== 'alagar9894@gmail.com') {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="text-indigo-600 dark:text-indigo-400" />
          Admin Analytics
        </h2>
      </div>

      {/* Supabase Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Users size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">Users</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : stats.totalUsers}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Bot size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">AI Queries</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : stats.totalAiQueries}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Share2 size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">Shares</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : stats.totalShares}
          </span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Target size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">Goals</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : stats.totalGoals}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Wallet size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">Wealth</span>
          </div>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : formatINR(stats.totalWealth)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <CreditCard size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">Debt</span>
          </div>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {loading ? '...' : formatINR(stats.totalDebt)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <IndianRupee size={14} />
            <span className="text-xs font-medium uppercase tracking-wide truncate">Avg Income</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : formatINR(stats.avgIncome)}
          </span>
        </div>
      </div>

      {/* PostHog Setup Instructions / Iframe Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Behavioral Analytics (PostHog)</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIframeKey(prev => prev + 1)}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw size={16} />
            </button>
            <div className="hidden sm:flex text-xs text-slate-500 dark:text-slate-400 items-center gap-1">
              <AlertCircle size={14} /> Only visible to Admin
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-b-2xl overflow-y-auto overflow-x-hidden" style={{ maxHeight: '800px', WebkitOverflowScrolling: 'touch' }}>
          <iframe 
            key={iframeKey}
            width="100%" 
            style={{ minHeight: '1800px', border: 'none' }}
            frameBorder="0" 
            allowFullScreen 
            src="https://us.posthog.com/embedded/Oat-nk0IBoBmiXZd2qZY3t0KbfVfTQ" 
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            className="w-full rounded-b-2xl block"
          ></iframe>
        </div>
      </div>
      
    </div>
  );
}
