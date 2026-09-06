// Supabase Edge Function: delete-account
// Fully deletes a user — all table data AND the auth.users record.
//
// Deploy via Supabase Dashboard → Edge Functions → New Function → paste this code.
// Function name: delete-account
//
// SUPABASE_SERVICE_ROLE_KEY is automatically injected by Supabase at runtime.
// You do NOT need to manually set it.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Verify the calling user's JWT ──────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use anon client to verify user identity
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // ── 2. Use service role client to bypass RLS and delete everything ────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. Delete all user data from application tables ───────────────────
    const tablesToClean: Array<{ table: string; field: string }> = [
      { table: 'ai_conversations', field: 'user_id' },
      { table: 'goals', field: 'user_id' },
      { table: 'assets', field: 'user_id' },
      { table: 'liabilities', field: 'user_id' },
      { table: 'protection_settings', field: 'user_id' },
      { table: 'user_settings', field: 'user_id' },
      { table: 'financial_summaries', field: 'user_id' },
    ];

    for (const { table, field } of tablesToClean) {
      const { error } = await supabaseAdmin.from(table).delete().eq(field, userId);
      if (error) {
        // Log but continue — partial failures should not block auth deletion
        console.error(`Failed to delete from ${table}:`, error.message);
      }
    }

    // Delete profile last (FK references resolved above)
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // ── 4. Delete the auth user — removes them from auth.users completely ─
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Auth user deletion failed:', deleteAuthError.message);
      return new Response(JSON.stringify({ error: `Auth deletion failed: ${deleteAuthError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unexpected error in delete-account:', err);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
