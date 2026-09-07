import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[FinGoal] Supabase environment variables are not set. ' +
    'Copy .env.example to .env.local and fill in your Supabase project URL and anon key. ' +
    'The app will run in local-only (Guest) mode until configured.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Returns true if Supabase is properly configured (non-placeholder values).
 */
export function isSupabaseConfigured() {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co'
  );
}
