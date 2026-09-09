import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { fetchDriveBackup } from '../utils/gdrive';

// ── Initial / Default State ────────────────────────────────────────────────
const initialState = {
  income: 0,
  expenses: 0,
  emi: 0,
  assets: [],      // {id, name, value, type}
  liabilities: [], // {id, name, value, interest, emi, type}
  goals: [],       // {id, name, target, saved, contribution, roi, date}
  protection: {
    termInsurance: 0,
    healthInsurance: 0,
    emergencyTarget: 0,
    emergencyCurrent: 0,
  },
  settings: {
    theme: 'light',
    assetTypes: ['Mutual Fund', 'Stocks (India)', 'Fixed Deposit', 'Gold', 'Real Estate', 'EPF', 'PPF', 'Recurring Deposit', 'Cash', 'NPS', 'Debt', 'Small Savings Scheme', 'Sovereign Gold Bond', 'ETF', 'Bonds', 'Sukanya Samriddhi', 'Silver', 'US Stocks', 'Stocks (Foreign)', 'REITs', 'ULIP', 'Crypto'],
    dob: '',
    // NOTE: openaiApiKey is no longer stored in state — AI calls go via Edge Function.
  },
  lastUpdated: 0,
};

const LOCAL_STORAGE_KEY = 'fingoal_v2';
const AppStateContext = createContext();

const mergeAssetTypes = (savedTypes) => {
  if (!savedTypes || !Array.isArray(savedTypes)) return initialState.settings.assetTypes;
  const currentTypes = new Set(savedTypes);
  const missingDefaults = initialState.settings.assetTypes.filter(t => !currentTypes.has(t));
  return [...savedTypes, ...missingDefaults];
};

// ── Helper: ensure item ID is a valid UUID (Postgres type safety) ─────────
function ensureValidUuid(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (id && typeof id === 'string' && uuidRegex.test(id)) {
    return id;
  }
  return crypto.randomUUID();
}

// ── Check if a user is new to Supabase (no data in any table) ─────────────
async function isUserNewToSupabase(userId) {
  try {
    const [summaryRes, assetsRes] = await Promise.all([
      supabase.from('financial_summaries').select('user_id').eq('user_id', userId).maybeSingle(),
      supabase.from('assets').select('id').eq('user_id', userId).limit(1),
    ]);
    const hasNoSummary = !summaryRes.data;
    const hasNoAssets = !assetsRes.data || assetsRes.data.length === 0;
    return hasNoSummary && hasNoAssets;
  } catch {
    return false; // assume existing user if we can't check — safer default
  }
}

// ── Silently migrate localStorage data to Supabase for new users ──────────
async function autoMigrateToSupabase(userId, local) {
  if (!local || !userId) return;
  console.log('[AppState] Auto-migrating local data for new user...');

  const promises = [];

  // Financial Summary
  promises.push(
    supabase.from('financial_summaries').upsert({
      user_id: userId,
      monthly_income: Number(local.income) || 0,
      monthly_expenses: Number(local.expenses) || 0,
      monthly_emi: Number(local.emi) || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  );

  // Assets (preserve client-generated IDs for consistency, validated as UUID)
  if (Array.isArray(local.assets) && local.assets.length > 0) {
    promises.push(
      supabase.from('assets').upsert(
        local.assets.map(a => ({
          id: ensureValidUuid(a.id),
          user_id: userId,
          name: a.name || 'Unnamed',
          value: Number(a.currentValue ?? a.value) || 0,
          type: a.type || 'Other',
          invested: Number(a.invested) || 0,
          sip: Number(a.sip) || 0,
          roi: Number(a.roi) || 0,
          owner: a.owner || 'Self',
        })),
        { onConflict: 'id' }
      )
    );
  }

  // Liabilities
  if (Array.isArray(local.liabilities) && local.liabilities.length > 0) {
    promises.push(
      supabase.from('liabilities').upsert(
        local.liabilities.map(l => ({
          id: ensureValidUuid(l.id),
          user_id: userId,
          name: l.name || 'Unnamed',
          value: Number(l.value) || 0,
          interest_rate: Number(l.interest) || 0,
          emi: Number(l.emi) || 0,
          type: l.type || 'Loan',
          tenure: Number(l.tenure) || 0,
          owner: l.owner || 'Self',
        })),
        { onConflict: 'id' }
      )
    );
  }

  // Goals
  if (Array.isArray(local.goals) && local.goals.length > 0) {
    promises.push(
      supabase.from('goals').upsert(
        local.goals.map(g => ({
          id: ensureValidUuid(g.id),
          user_id: userId,
          name: g.name || 'Unnamed',
          target_amount: Number(g.target) || 0,
          saved_amount: Number(g.saved) || 0,
          monthly_contribution: Number(g.contribution) || 0,
          expected_roi: Number(g.roi) || 8,
          target_date: (g.date && g.date.length === 7) ? `${g.date}-01` : (g.date || null),
          linked_assets: g.linkedAssets || [],
        })),
        { onConflict: 'id' }
      )
    );
  }

  // Protection Settings
  if (local.protection) {
    promises.push(
      supabase.from('protection_settings').upsert({
        user_id: userId,
        term_insurance: Number(local.protection.termInsurance) || 0,
        health_insurance: Number(local.protection.healthInsurance) || 0,
        emergency_target: Number(local.protection.emergencyTarget) || 0,
        emergency_current: Number(local.protection.emergencyCurrent) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    );
  }

  // User Settings
  promises.push(
    supabase.from('user_settings').upsert({
      user_id: userId,
      theme: local.settings?.theme || 'light',
      asset_types: local.settings?.assetTypes || initialState.settings.assetTypes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  );

  // Profile DOB
  if (local.settings?.dob) {
    promises.push(
      supabase.from('profiles').upsert(
        { id: userId, dob: local.settings.dob, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
    );
  }

  const results = await Promise.allSettled(promises);
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn('[AppState] Some migration promises failed:', failures);
  } else {
    console.log('[AppState] Auto-migration complete.');
  }
}

// ── Helper: read from Supabase and assemble the app state object ─────────
async function loadStateFromSupabase(userId) {
  const [summary, assets, liabilities, goals, protection, settings, profile] = await Promise.all([
    supabase.from('financial_summaries').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('assets').select('*').eq('user_id', userId),
    supabase.from('liabilities').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('protection_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ]);

  const s = summary.data;
  const prot = protection.data;
  const cfg = settings.data;
  const prof = profile.data;

  return {
    income: s?.monthly_income ?? 0,
    expenses: s?.monthly_expenses ?? 0,
    emi: s?.monthly_emi ?? 0,

    assets: (assets.data || []).map(a => ({
      id: a.id,
      name: a.name,
      value: a.value,
      currentValue: a.value,
      type: a.type,
      invested: a.invested,
      sip: a.sip,
      roi: a.roi,
      owner: a.owner,
    })),

    liabilities: (liabilities.data || []).map(l => ({
      id: l.id,
      name: l.name,
      value: l.value,
      interest: l.interest_rate,
      emi: l.emi,
      type: l.type,
      tenure: l.tenure,
      owner: l.owner,
    })),

    goals: (goals.data || []).map(g => ({
      id: g.id,
      name: g.name,
      target: g.target_amount,
      saved: g.saved_amount,
      contribution: g.monthly_contribution,
      roi: g.expected_roi,
      date: g.target_date,
      linkedAssets: Array.isArray(g.linked_assets) ? g.linked_assets : [],
    })),

    protection: {
      termInsurance: prot?.term_insurance ?? 0,
      healthInsurance: prot?.health_insurance ?? 0,
      emergencyTarget: prot?.emergency_target ?? 0,
      emergencyCurrent: prot?.emergency_current ?? 0,
    },

    settings: {
      theme: cfg?.theme ?? 'light',
      assetTypes: mergeAssetTypes(cfg?.asset_types),
      dob: prof?.dob ?? '',
    },

    lastUpdated: Date.now(),
  };
}

// ── Per-item Supabase helpers — called immediately on add/update/remove ───

async function supabaseUpsertItem(listName, userId, item) {
  if (!userId || !item?.id) return;
  const validId = ensureValidUuid(item.id);
  try {
    let result;
    if (listName === 'assets') {
      result = await supabase.from('assets').upsert({
        id: validId,
        user_id: userId,
        name: item.name || 'Unnamed',
        value: Number(item.currentValue ?? item.value) || 0,
        type: item.type || 'Other',
        invested: Number(item.invested) || 0,
        sip: Number(item.sip) || 0,
        roi: Number(item.roi) || 0,
        owner: item.owner || 'Self',
      }, { onConflict: 'id' });
    } else if (listName === 'liabilities') {
      result = await supabase.from('liabilities').upsert({
        id: validId,
        user_id: userId,
        name: item.name || 'Unnamed',
        value: Number(item.value) || 0,
        interest_rate: Number(item.interest) || 0,
        emi: Number(item.emi) || 0,
        type: item.type || 'Loan',
        tenure: Number(item.tenure) || 0,
        owner: item.owner || 'Self',
      }, { onConflict: 'id' });
    } else if (listName === 'goals') {
      result = await supabase.from('goals').upsert({
        id: validId,
        user_id: userId,
        name: item.name || 'Unnamed',
        target_amount: Number(item.target) || 0,
        saved_amount: Number(item.saved) || 0,
        monthly_contribution: Number(item.contribution) || 0,
        expected_roi: Number(item.roi) || 8,
        target_date: (item.date && item.date.length === 7) ? `${item.date}-01` : (item.date || null),
        linked_assets: Array.isArray(item.linkedAssets) ? item.linkedAssets : [],
      }, { onConflict: 'id' });
    }
    if (result?.error) {
      console.error(`[AppState] Supabase upsert ${listName} error:`, result.error.message);
    }
  } catch (err) {
    console.error(`[AppState] supabaseUpsertItem(${listName}) error:`, err);
  }
}

async function supabaseDeleteItem(listName, itemId) {
  const tableMap = { assets: 'assets', liabilities: 'liabilities', goals: 'goals' };
  const table = tableMap[listName];
  if (!table || !itemId) return;
  try {
    const { error } = await supabase.from(table).delete().eq('id', itemId);
    if (error) console.error(`[AppState] Supabase delete ${table} error:`, error.message);
  } catch (err) {
    console.error(`[AppState] supabaseDeleteItem(${listName}) error:`, err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
export function AppStateProvider({ children }) {
  const [state, setState] = useState(() => {
    // Bootstrap from localStorage for instant paint (avoids blank screen)
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let local = saved ? JSON.parse(saved) : initialState;
    
    // Deep merge to guarantee all objects exist even if loaded from older localStorage
    local = {
      ...initialState,
      ...local,
      protection: { ...initialState.protection, ...(local.protection || {}) },
      settings: { ...initialState.settings, ...(local.settings || {}) },
      assets: local.assets || [],
      liabilities: local.liabilities || [],
      goals: local.goals || []
    };

    // Strip the openaiApiKey from any existing local data for security
    delete local.settings.openaiApiKey;
    local.settings.assetTypes = mergeAssetTypes(local.settings.assetTypes);
    
    return local;
  });

  const [userId, setUserId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const syncTimeoutRef = useRef(null);

  // Stable refs so callbacks don't need to re-memoize on every state/userId change
  const userIdRef = useRef(null);
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Handle sign-in: auto-migrate new users, then load from Supabase ──────
  const handleSignIn = useCallback(async (uid) => {
    setUserId(uid);
    userIdRef.current = uid;
    setSyncing(true);
    try {
      // Check if this is a brand-new user with no Supabase data
      const isNew = await isUserNewToSupabase(uid);
      if (isNew) {
        // Silently migrate any guest data — no prompt needed
        const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localStr) {
          try {
            await autoMigrateToSupabase(uid, JSON.parse(localStr));
          } catch (e) {
            console.error('[AppState] Auto-migration failed:', e);
          }
        }
      }
      // Always load Supabase as authoritative source after sign-in
      const remoteState = await loadStateFromSupabase(uid);
      setState(remoteState);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteState));
    } catch (err) {
      console.error('[AppState] Failed to load from Supabase:', err);
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Auth listener: reload state from Supabase when user logs in/out ──────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      if (uid) await handleSignIn(uid);
    });

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null;

      if (event === 'SIGNED_IN' && uid) {
        await handleSignIn(uid);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        userIdRef.current = null;
        // Revert to localStorage snapshot (guest mode)
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) setState(JSON.parse(saved));
      }
    });

    return () => subscription.unsubscribe();
  }, [handleSignIn]);

  // ── Dark mode sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings?.theme]);

  // ── Persist to localStorage + debounced Supabase sync (SCALAR fields) ───
  // Note: List items (assets/liabilities/goals) are synced per-operation below.
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));

    // Debounced scalar sync to Supabase (500ms delay to batch rapid updates)
    if (userIdRef.current && isSupabaseConfigured()) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncStateToSupabase(userIdRef.current, state);
        
        // Also push to Google Drive if connected (One-way backup)
        if (window.syncToDrive) {
          window.syncToDrive(state);
        }
      }, 500);
    } else {
      // If not logged in to Supabase, just backup to GDrive locally
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (window.syncToDrive) {
          window.syncToDrive(state);
        }
      }, 500);
    }

    return () => clearTimeout(syncTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Expose global setter for GDrive sync (backward-compat) ───────────────
  useEffect(() => {
    window.updateAppStateFromDrive = (data) => {
      if (userIdRef.current && isSupabaseConfigured()) {
        console.log('[AppState] Ignoring GDrive sync overwrite because Supabase is the active master database.');
        return;
      }
      if (data.settings) delete data.settings.openaiApiKey;
      setState(data);
    };
  }, []);

  const restoreFromBackup = useCallback(async () => {
    try {
      setSyncing(true);
      const backupData = await fetchDriveBackup();
      if (backupData) {
        if (backupData.settings) delete backupData.settings.openaiApiKey;
        setState(backupData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(backupData));
        
        // Force-push restored data to Supabase
        if (userIdRef.current && isSupabaseConfigured()) {
          await autoMigrateToSupabase(userIdRef.current, backupData);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AppState] Restore failed:', err);
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── State mutation helpers ─────────────────────────────────────────────────

  const updateField = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value, lastUpdated: Date.now() }));
  }, []);

  const updateProtection = useCallback((field, value) => {
    setState(prev => ({
      ...prev,
      protection: { ...prev.protection, [field]: value },
      lastUpdated: Date.now(),
    }));
  }, []);

  // addItem: updates state AND immediately writes to Supabase
  const addItem = useCallback((listName, item) => {
    const newId = crypto.randomUUID();
    const newItem = { ...item, id: newId };

    setState(prev => ({
      ...prev,
      [listName]: [...prev[listName], newItem],
      lastUpdated: Date.now(),
    }));

    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured()) {
      supabaseUpsertItem(listName, uid, newItem);
    }
  }, []);

  // removeItem: updates state AND immediately deletes from Supabase
  const removeItem = useCallback((listName, id) => {
    setState(prev => ({
      ...prev,
      [listName]: prev[listName].filter(item => item.id !== id),
      lastUpdated: Date.now(),
    }));

    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured()) {
      supabaseDeleteItem(listName, id);
    }
  }, []);

  // updateItem: merges with current state AND immediately upserts to Supabase
  const updateItem = useCallback((listName, id, updatedFields) => {
    setState(prev => ({
      ...prev,
      [listName]: prev[listName].map(item =>
        item.id === id ? { ...item, ...updatedFields } : item
      ),
      lastUpdated: Date.now(),
    }));

    // Merge with current state to get the full item for upsert
    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured()) {
      const existing = stateRef.current[listName].find(item => item.id === id) || {};
      const mergedItem = { ...existing, ...updatedFields, id };
      supabaseUpsertItem(listName, uid, mergedItem);
    }
  }, []);

  const addAssetType = useCallback((type) => {
    setState(prev => {
      const current = prev.settings?.assetTypes || initialState.settings.assetTypes;
      if (current.includes(type)) return prev;
      return {
        ...prev,
        settings: { ...prev.settings, assetTypes: [...current, type] },
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const removeAssetType = useCallback((type) => {
    setState(prev => {
      const current = prev.settings?.assetTypes || initialState.settings.assetTypes;
      return {
        ...prev,
        settings: { ...prev.settings, assetTypes: current.filter(t => t !== type) },
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const renameAssetType = useCallback((oldType, newType) => {
    setState(prev => {
      const current = prev.settings?.assetTypes || initialState.settings.assetTypes;
      if (!current.includes(oldType) || current.includes(newType)) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          assetTypes: current.map(t => t === oldType ? newType : t),
        },
        assets: prev.assets.map(a => a.type === oldType ? { ...a, type: newType } : a),
        lastUpdated: Date.now(),
      };
    });

    // Bulk upsert all assets that were renamed
    const uid = userIdRef.current;
    if (uid && isSupabaseConfigured()) {
      const affectedAssets = stateRef.current.assets.filter(a => a.type === oldType);
      affectedAssets.forEach(asset =>
        supabaseUpsertItem('assets', uid, { ...asset, type: newType })
      );
    }
  }, []);

  return (
    <AppStateContext.Provider value={{
      state,
      setState,
      syncing,
      updateField,
      updateProtection,
      addItem,
      removeItem,
      updateItem,
      addAssetType,
      removeAssetType,
      renameAssetType,
      restoreFromBackup,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);

// ── Supabase scalar sync: syncs income, expenses, protection, settings ────
// List items (assets/liabilities/goals) are NOT included here —
// they are written immediately per operation (add/update/remove above).
async function syncStateToSupabase(userId, state) {
  if (!userId) return;

  try {
    const responses = await Promise.all([
      // Financial Summary
      supabase.from('financial_summaries').upsert({
        user_id: userId,
        monthly_income: Number(state.income) || 0,
        monthly_expenses: Number(state.expenses) || 0,
        monthly_emi: Number(state.emi) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }),

      // Protection Settings
      supabase.from('protection_settings').upsert({
        user_id: userId,
        term_insurance: Number(state.protection?.termInsurance) || 0,
        health_insurance: Number(state.protection?.healthInsurance) || 0,
        emergency_target: Number(state.protection?.emergencyTarget) || 0,
        emergency_current: Number(state.protection?.emergencyCurrent) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }),

      // User Settings (theme, asset types)
      supabase.from('user_settings').upsert({
        user_id: userId,
        theme: state.settings?.theme || 'light',
        asset_types: state.settings?.assetTypes || initialState.settings.assetTypes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }),

      // Profile DOB
      ...(state.settings?.dob ? [
        supabase.from('profiles').upsert(
          { id: userId, dob: state.settings.dob, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        )
      ] : []),
    ]);

    const tableNames = ['financial_summaries', 'protection_settings', 'user_settings', 'profiles'];
    responses.forEach((res, idx) => {
      if (res?.error) {
        console.error(`[AppState Sync Error] Table ${tableNames[idx]} upsert failed:`, res.error.message, res.error);
      }
    });
  } catch (err) {
    console.error('[AppState] Supabase sync error:', err);
  }
}
