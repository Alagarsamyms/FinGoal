// Supabase Edge Function: fingoal-ai-advisor
// Deploy with: supabase functions deploy fingoal-ai-advisor
// Set secret:  supabase secrets set OPENAI_API_KEY=sk-...
//
// This function:
//  1. Verifies the user's JWT
//  2. Builds a structured financial context from the request payload
//  3. Sends a secure request to OpenAI (key never leaves the server)
//  4. Returns the AI response

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Auth: Verify user JWT ──────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 2. Parse request body ─────────────────────────────────────────────
    const body = await req.json();
    const { messages = [], financialContext = {} } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Build structured system prompt with financial context ───────────
    const {
      netWorth = 0,
      income = 0,
      expenses = 0,
      emi = 0,
      totalAssets = 0,
      totalLiabilities = 0,
      savingsRate = 0,
      goalCount = 0,
      fireNumber = 0,
      currentAge = null,
    } = financialContext;

    const systemPrompt = `You are FinGoal AI, an expert personal finance advisor embedded in FinGoal OS.
You deliver highly structured, clear, and visually appealing financial analysis tailored to Indian personal finance.

Current Financial Snapshot:
- Net Worth: ₹${netWorth.toLocaleString('en-IN')}
- Monthly Income: ₹${income.toLocaleString('en-IN')}
- Monthly Expenses: ₹${expenses.toLocaleString('en-IN')}
- Monthly EMI: ₹${emi.toLocaleString('en-IN')}
- Total Assets: ₹${totalAssets.toLocaleString('en-IN')}
- Total Liabilities: ₹${totalLiabilities.toLocaleString('en-IN')}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Active Goals: ${goalCount}
- FIRE Target: ₹${fireNumber.toLocaleString('en-IN')}
${currentAge ? `- Current Age: ${currentAge}` : ''}

RESPONSE STRUCTURE FORMAT & RULES:
1. ALWAYS structure your answer into clean, distinct sections using Markdown headers:
   - ### 📊 Executive Summary (1-2 sentences overview)
   - ### 💡 Key Insights & Analysis (Bullet points with **bold** key numbers)
   - ### 🎯 Action Steps (Numbered items: 1., 2., 3. with clear priorities)
   - ### ℹ️ Financial Disclaimer (Short note that you are an AI assistant, not a certified planner)

2. FORMATTING RULES:
   - Use **bold** for all currency amounts (e.g. **₹25,000**), percentages (e.g. **35%**), and specific asset/loan names.
   - Use bullet lists (\`-\`) or numbered lists (\`1.\`) for clarity — avoid long walls of plain text.
   - Keep paragraphs short (maximum 2-3 sentences per paragraph).
   - Use relevant emojis for section titles (📊, 💡, 🎯, ⚡, 🛡️, ⚠️).
   - Be direct, professional, and actionable (under 300 words unless detail is requested).
   - Never request bank account numbers, PAN, or passwords.`;

    // ── 4. Send to OpenAI ─────────────────────────────────────────────────
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'AI service is not configured.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-20), // limit context window
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!openaiResponse.ok) {
      const errData = await openaiResponse.json();
      console.error('OpenAI error:', errData);
      return new Response(JSON.stringify({ error: errData.error?.message || 'AI request failed.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await openaiResponse.json();
    const reply = data.choices?.[0]?.message?.content ?? '';

    // ── 5. Return response ────────────────────────────────────────────────
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge Function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
