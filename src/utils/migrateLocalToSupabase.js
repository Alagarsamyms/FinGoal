/**
 * migrateLocalToSupabase.js
 *
 * Reads the user's existing localStorage data ('fingoal_v2') and
 * inserts it into Supabase as the new authoritative data source.
 *
 * Called once after a new user signs up, if local data exists.
 */
import { supabase } from './supabase';

const LOCAL_KEY = 'fingoal_v2';
const MIGRATION_FLAG = 'fingoal_migrated_v1';

/**
 * Returns true if the user has local data that has NOT been migrated yet.
 */
export function hasLocalDataToMigrate() {
  return (
    !!localStorage.getItem(LOCAL_KEY) &&
    localStorage.getItem(MIGRATION_FLAG) !== 'true'
  );
}

/**
 * Migrates localStorage data to Supabase for the currently authenticated user.
 * Safe to call multiple times — subsequent calls are no-ops due to the migration flag.
 *
 * @returns {{ success: boolean, migrated: string[], error: string|null }}
 */
export async function migrateLocalToSupabase() {
  // Guard: already migrated
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
    return { success: true, migrated: [], error: null };
  }

  const localStr = localStorage.getItem(LOCAL_KEY);
  if (!localStr) {
    return { success: true, migrated: [], error: null };
  }

  let local;
  try {
    local = JSON.parse(localStr);
  } catch {
    return { success: false, migrated: [], error: 'Failed to parse local data.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, migrated: [], error: 'Not authenticated.' };
  }

  const userId = user.id;
  const migrated = [];
  const errors = [];

  // ── 1. Financial Summary (income, expenses, emi) ──────────────────────────
  try {
    const { error } = await supabase.from('financial_summaries').upsert({
      user_id: userId,
      monthly_income: Number(local.income) || 0,
      monthly_expenses: Number(local.expenses) || 0,
      monthly_emi: Number(local.emi) || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;
    migrated.push('financial_summaries');
  } catch (e) {
    errors.push(`financial_summaries: ${e.message}`);
  }

  // ── 2. Assets ─────────────────────────────────────────────────────────────
  if (Array.isArray(local.assets) && local.assets.length > 0) {
    try {
      const rows = local.assets.map(a => ({
        user_id: userId,
        name: a.name || 'Unnamed Asset',
        value: Number(a.value) || 0,
        type: a.type || 'Other',
      }));
      const { error } = await supabase.from('assets').insert(rows);
      if (error) throw error;
      migrated.push(`assets (${rows.length})`);
    } catch (e) {
      errors.push(`assets: ${e.message}`);
    }
  }

  // ── 3. Liabilities ────────────────────────────────────────────────────────
  if (Array.isArray(local.liabilities) && local.liabilities.length > 0) {
    try {
      const rows = local.liabilities.map(l => ({
        user_id: userId,
        name: l.name || 'Unnamed Liability',
        value: Number(l.value) || 0,
        interest_rate: Number(l.interest) || 0,
        emi: Number(l.emi) || 0,
        type: l.type || 'Loan',
      }));
      const { error } = await supabase.from('liabilities').insert(rows);
      if (error) throw error;
      migrated.push(`liabilities (${rows.length})`);
    } catch (e) {
      errors.push(`liabilities: ${e.message}`);
    }
  }

  // ── 4. Goals ──────────────────────────────────────────────────────────────
  if (Array.isArray(local.goals) && local.goals.length > 0) {
    try {
      const rows = local.goals.map(g => ({
        user_id: userId,
        name: g.name || 'Unnamed Goal',
        target_amount: Number(g.target) || 0,
        saved_amount: Number(g.saved) || 0,
        monthly_contribution: Number(g.contribution) || 0,
        expected_roi: Number(g.roi) || 8,
        target_date: g.date || null,
      }));
      const { error } = await supabase.from('goals').insert(rows);
      if (error) throw error;
      migrated.push(`goals (${rows.length})`);
    } catch (e) {
      errors.push(`goals: ${e.message}`);
    }
  }

  // ── 5. Protection Settings ────────────────────────────────────────────────
  if (local.protection) {
    try {
      const { error } = await supabase.from('protection_settings').upsert({
        user_id: userId,
        term_insurance: Number(local.protection.termInsurance) || 0,
        health_insurance: Number(local.protection.healthInsurance) || 0,
        emergency_target: Number(local.protection.emergencyTarget) || 0,
        emergency_current: Number(local.protection.emergencyCurrent) || 0,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      migrated.push('protection_settings');
    } catch (e) {
      errors.push(`protection_settings: ${e.message}`);
    }
  }

  // ── 6. User Settings (theme, asset types, dob) ────────────────────────────
  try {
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      theme: local.settings?.theme || 'light',
      asset_types: local.settings?.assetTypes || ['Mutual Fund', 'Equity', 'Gold', 'Real Estate', 'Debt', 'Cash'],
    }, { onConflict: 'user_id' });
    if (error) throw error;

    // Update DOB in profiles table
    if (local.settings?.dob) {
      await supabase.from('profiles').update({ dob: local.settings.dob })
        .eq('id', userId);
    }
    migrated.push('user_settings');
  } catch (e) {
    errors.push(`user_settings: ${e.message}`);
  }

  const success = errors.length === 0;

  if (success) {
    // Mark as migrated so we don't run again
    localStorage.setItem(MIGRATION_FLAG, 'true');
  }

  return {
    success,
    migrated,
    error: errors.length > 0 ? errors.join('; ') : null,
  };
}
