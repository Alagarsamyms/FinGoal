import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import {
  Bot, Sparkles, Loader2, Send, Trash2, CloudOff, Cloud,
  MessageSquare, ChevronDown, Activity, Flame, Lock, Share2
} from 'lucide-react';
import { syncChatToDrive, isSyncedToDrive } from '../utils/gdrive';
import { InfoTooltip } from './Onboarding';
import { trackEvent, captureError } from '../utils/telemetry';

const MAX_MESSAGES = 50;
const LS_KEY = 'fingoal_chat_v1';

const QUICK_PROMPTS = [
  {
    id: 'general',
    label: 'Health Check',
    icon: <Activity size={14} />,
    color: 'indigo',
    prompt: 'Analyze my overall financial health and give me 3 immediate, specific action items I can act on this month.'
  },
  {
    id: 'debt',
    label: 'Debt Strategy',
    icon: <Bot size={14} />,
    color: 'rose',
    prompt: 'Analyze my liabilities in detail. Which exact loan should I pre-close first to save maximum interest? Provide a specific debt repayment roadmap.'
  },
  {
    id: 'fire',
    label: 'FIRE Readiness',
    icon: <Flame size={14} />,
    color: 'amber',
    prompt: 'Based on my assets, expenses, and monthly surplus, when can I realistically achieve FIRE? What is the exact corpus I need assuming a 4% withdrawal rate?'
  }
];

function formatAIResponse(content) {
  if (!content) return '';

  let text = content.trim();

  // Convert Markdown headers (e.g. ### Header or ## Header)
  text = text.replace(/^(?:###|##|#)\s+(.+)$/gm, '<h4 class="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-3 mb-1.5 flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-900/40 pb-1">$1</h4>');

  // Convert bold: **text** -> <strong>text</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');

  // Convert italic: *text* -> <em>text</em>
  text = text.replace(/(?<!\*)\*(?!\*)(.*?)\*/g, '<em>$1</em>');

  // Parse lines for bullet lists and numbered lists
  const lines = text.split('\n');
  const result = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check unordered list item (- or *)
    const ulMatch = line.match(/^[\-\*]\s+(.+)/);
    if (ulMatch) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul class="my-2 space-y-1.5 pl-4 list-disc text-slate-700 dark:text-slate-300">'); inUl = true; }
      result.push(`<li class="leading-relaxed">${ulMatch[1]}</li>`);
      continue;
    }

    // Check ordered list item (1., 2., etc.)
    const olMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (olMatch) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol class="my-2 space-y-1.5 pl-4 list-decimal text-slate-700 dark:text-slate-300">'); inOl = true; }
      result.push(`<li class="leading-relaxed">${olMatch[2]}</li>`);
      continue;
    }

    // Close any open lists if line is normal text or empty
    if (inUl) { result.push('</ul>'); inUl = false; }
    if (inOl) { result.push('</ol>'); inOl = false; }

    if (!line) continue;

    // Check if line is already an HTML tag
    if (/^<(h[1-6]|p|ul|ol|li|div|blockquote)/i.test(line)) {
      result.push(line);
    } else {
      result.push(`<p class="my-1.5 leading-relaxed text-slate-700 dark:text-slate-300">${line}</p>`);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('\n');
}

function ChatBubble({ msg, theme }) {
  const isUser = msg.role === 'user';
  const isWelcome = msg.isWelcome;

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 self-end mb-0.5">
          <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : isWelcome
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 text-slate-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-800/50 rounded-bl-sm shadow-sm'
              : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 shadow-sm rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none space-y-1"
              dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }}
            />
          )}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    </div>
  );
}

export default function Simulation() {
  const { state, updateSettings } = useAppState();
  const theme = state.settings?.theme || 'light';

  const aiQueriesCount = state.settings?.aiQueriesCount || 0;
  const sharesCount = state.settings?.sharesCount || 0;
  const isLocked = aiQueriesCount >= 3 && sharesCount < 5;

  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatReady, setChatReady] = useState(false); // true after auth+load resolves
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [driveSync, setDriveSync] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Derived financial context ──────────────────────────────────────────────
  const totalIncome = parseFloat(state.income) || 0;
  const totalExpenses = parseFloat(state.expenses) || 0;
  let totalEmi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => { if (l.emi) totalEmi += parseFloat(l.emi); });
  const surplus = totalIncome - totalExpenses - totalEmi;
  const totalAssets = state.assets.reduce((s, a) => s + (parseFloat(a.currentValue ?? a.value) || 0), 0);
  const totalDebt = state.liabilities.reduce((s, l) => s + (parseFloat(l.value) || 0), 0);

  const systemPrompt = `You are Wealth For FIRE AI, an elite financial advisor specializing in the Indian personal finance market.

The user's current financial snapshot:
- Monthly Income: ₹${totalIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
- Total EMI: ₹${totalEmi.toLocaleString('en-IN')}
- Monthly Surplus: ₹${surplus.toLocaleString('en-IN')}
- Total Assets (Current Value): ₹${totalAssets.toLocaleString('en-IN')}
- Total Debt Outstanding: ₹${totalDebt.toLocaleString('en-IN')}
- Assets: ${JSON.stringify(state.assets.map(a => ({ name: a.name, type: a.type, invested: a.invested, currentValue: a.currentValue ?? a.value, sip: a.sip, roi: a.roi })))}
- Liabilities: ${JSON.stringify(state.liabilities.map(l => ({ name: l.name, value: l.value, emi: l.emi, interest: l.interest })))}
- Goals: ${JSON.stringify(state.goals.map(g => ({ name: g.name, target: g.target, saved: g.saved, contribution: g.contribution, roi: g.roi })))}

FORMATTING RULES (strictly follow):
1. Respond entirely in valid, clean HTML.
2. Use <h3>, <p>, <ul>, <li>, <strong>, <em> tags only.
3. Do NOT use markdown (no ## or **).
4. Do NOT use LaTeX or math symbols. Write all math as simple text.
5. Be highly specific, actionable, and concise (under 300 words per response).
6. Refer to specific asset names, loan names, and amounts from the user's data when relevant.
7. Always maintain context from the conversation history.`;

  // ── Auth: track current user, clear & reload chat on user switch ────────────
  useEffect(() => {
    const showWelcome = (isLoggedIn) => {
      setMessages([{
        role: 'assistant',
        content: isLoggedIn
          ? `<p>\ud83d\udc4b <strong>Welcome back to Wealth For FIRE AI Advisor!</strong></p>
<p>Your chat history is synced to the cloud. I have full context of your financial data \u2014 assets, liabilities, goals, and cash flow.</p>
<ul>
  <li>Use the <strong>Quick Prompt</strong> chips below for instant analysis</li>
  <li>Or type your own question \u2014 I support follow-up questions too!</li>
</ul>`
          : `<p>\ud83d\udc4b <strong>Welcome to Wealth For FIRE AI Advisor!</strong></p>
<p>I have full context of your financial data \u2014 assets, liabilities, goals, and cash flow. Ask me anything:</p>
<ul>
  <li>Use the <strong>Quick Prompt</strong> chips below for instant analysis</li>
  <li>Or type your own question \u2014 I support follow-up questions too!</li>
</ul>
<p><em>\ud83d\udca1 Sign in to save your conversation history to the cloud.</em></p>`,
        isWelcome: true,
        timestamp: Date.now()
      }]);
    };

    if (!isSupabaseConfigured()) {
      // No Supabase — load from localStorage once, then mark ready
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0) { setMessages(parsed); setChatReady(true); return; }
        }
      } catch { /* ignore */ }
      showWelcome(false);
      setChatReady(true);
      return;
    }

    const loadUserChat = async (uid) => {
      setChatReady(false);
      setMessages([]);
      localStorage.removeItem(LS_KEY);

      if (!uid) {
        // Guest — show welcome immediately
        showWelcome(false);
        setChatReady(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('messages')
          .eq('user_id', uid)
          .maybeSingle();

        if (!error && data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // No saved chat for this user — show welcome
          showWelcome(true);
        }
      } catch (err) {
        console.error('[Simulation] Error loading chat from Supabase:', err);
        showWelcome(true);
      } finally {
        setChatReady(true);
      }
    };

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setCurrentUserId(uid);
      loadUserChat(uid);
    });

    // Listen for auth changes (sign in, sign out, user switch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      setCurrentUserId(uid);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        loadUserChat(uid);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist messages to localStorage & Supabase ─────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return; // don't overwrite on clear
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    if (isSyncedToDrive() && messages.length > 0) {
      syncChatToDrive(messages);
    }

    if (isSupabaseConfigured() && currentUserId && messages.length > 0) {
      supabase.from('ai_conversations').upsert({
        user_id: currentUserId,
        messages: messages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).then(({ error }) => {
        if (error) console.error('[Simulation] Failed to save chat to Supabase:', error.message);
      });
    }
  }, [messages, currentUserId]);

  // ── Check Drive sync status ────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setDriveSync(isSyncedToDrive());
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Listen for chat loaded from Drive ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const driveMessages = e.detail?.messages;
      if (driveMessages && driveMessages.length > messages.length) {
        setMessages(driveMessages);
      }
    };
    window.addEventListener('chatLoadedFromDrive', handler);
    return () => window.removeEventListener('chatLoadedFromDrive', handler);
  }, [messages.length]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setShowScrollBtn(!atBottom);
  };

  // ── (No separate welcome useEffect needed — welcome is shown inline inside loadUserChat) ──

  // ── Core send function ─────────────────────────────────────────────────────
  const sendMessage = async (userText) => {
    if (!userText?.trim() || loading) return;

    const userMessage = { role: 'user', content: userText.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);
    updateSettings('aiQueriesCount', aiQueriesCount + 1);

    // Build context messages (strip welcome msg + timestamps for AI)
    const contextMessages = updatedMessages
      .filter(m => !m.isWelcome)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    // Build structured financial context (no raw PII sent)
    const netWorth = totalAssets - totalDebt;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses - totalEmi) / totalIncome) * 100 : 0;
    const fireNumber = (totalExpenses * 12) / 0.04;
    const financialContext = {
      netWorth,
      income: totalIncome,
      expenses: totalExpenses,
      emi: totalEmi,
      totalAssets,
      totalLiabilities: totalDebt,
      savingsRate,
      goalCount: state.goals?.length || 0,
      fireNumber,
    };

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('SUPABASE_NOT_CONFIGURED');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('NOT_AUTHENTICATED');
      }

      // Invoke the secure Edge Function
      const { data, error } = await supabase.functions.invoke('fingoal-ai-advisor', {
        body: { messages: contextMessages, financialContext },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        // FunctionsFetchError typically means the function isn't deployed yet
        if (error.message?.includes('FunctionsFetchError') || error.message?.includes('Failed to fetch') || error.context?.status === 404) {
          throw new Error('FUNCTION_NOT_DEPLOYED');
        }
        throw new Error(error.message);
      }
      if (data?.error) throw new Error(data.error);

      const aiReply = {
        role: 'assistant',
        content: data.reply || '<p>No response received. Please try again.</p>',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), aiReply]);
      trackEvent('ai_advisor_used');
    } catch (err) {
      let errorContent;

      if (err.message === 'NOT_AUTHENTICATED') {
        errorContent = `<p>🔐 <strong>Sign in to use AI Advisor</strong></p>
<p>The AI Advisor requires an account to securely process your financial data. Your analysis stays private — we never share your data.</p>
<ul><li>Click <strong>Sign In / Sign Up</strong> in the sidebar to get started</li><li>All your guest data will be saved automatically when you sign in</li></ul>`;
      } else if (err.message === 'FUNCTION_NOT_DEPLOYED') {
        errorContent = `<p>⚙️ <strong>AI Advisor Setup Required</strong></p>
<p>The AI advisor function needs to be deployed to your Supabase project first.</p>
<ul>
  <li>Go to your <strong>Supabase Dashboard → Edge Functions</strong></li>
  <li>Create a new function named <strong>fingoal-ai-advisor</strong></li>
  <li>Paste the code from <code>supabase/functions/fingoal-ai-advisor/index.ts</code></li>
  <li>Ensure <strong>OPENAI_API_KEY</strong> is set in Supabase Secrets</li>
</ul>`;
      } else if (err.message === 'SUPABASE_NOT_CONFIGURED') {
        errorContent = `<p>⚙️ <strong>Supabase Not Configured</strong></p>
<p>Please ensure your <code>.env.local</code> file contains valid <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> values, then restart the dev server.</p>`;
      } else if (err.message?.includes('AI service is not configured')) {
        errorContent = `<p>🔑 <strong>OpenAI Key Not Set</strong></p>
<p>The AI advisor is running but the OpenAI API key is not configured on the server.</p>
<ul><li>In your Supabase Dashboard, go to <strong>Edge Functions → Secrets</strong></li><li>Add a secret: <strong>OPENAI_API_KEY</strong> = your OpenAI API key</li></ul>`;
      } else {
        errorContent = `<p>❌ <strong>AI Advisor Error</strong></p><p>${err.message}</p><p>Your financial dashboard and all calculations remain fully available.</p>`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorContent,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const clearChat = async () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      localStorage.removeItem(LS_KEY);
      if (isSyncedToDrive()) syncChatToDrive([]);

      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (uid) {
          await supabase.from('ai_conversations').delete().eq('user_id', uid);
        }
      }

      // Show fresh welcome after clear
      setMessages([{
        role: 'assistant',
        content: currentUserId
          ? `<p>\ud83d\udd04 <strong>Chat cleared.</strong> Ready for a fresh conversation!</p>
<p>Your new conversation will be saved to the cloud automatically.</p>`
          : `<p>\ud83d\udd04 <strong>Chat cleared.</strong> Ready for a fresh conversation! Use the chips below or type your question.</p>`,
        isWelcome: true,
        timestamp: Date.now()
      }]);
    }
  };

  // ── Chip color mapping ─────────────────────────────────────────────────────
  const chipColors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800/50',
    rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-800/50',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/50'
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Wealth For FIRE',
          text: "I'm using Wealth For FIRE to plan my early retirement and manage my finances. Check it out!",
          url: 'https://wealthforfire.geevika.com/',
        });
        updateSettings('sharesCount', sharesCount + 1);
      } else {
        await navigator.clipboard.writeText('https://wealthforfire.geevika.com/');
        alert('Link copied to clipboard! Share it with a friend.');
        updateSettings('sharesCount', sharesCount + 1);
      }
    } catch (err) {
      console.log('Share canceled or failed', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto pb-2 transition-colors">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles size={22} className="text-indigo-500" />
            AI Advisor &amp; Simulator
            <InfoTooltip title="AI Advisor" text="Ask your AI financial advisor anything. It already knows your income, assets, debts, and goals. Try asking: 'Am I on track for retirement?', 'Which loan should I pre-close?', or 'How can I reach ₹1 crore net worth?'" />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-turn conversation with full financial context
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync status badge — shows Cloud if Supabase or Drive synced, else Local Only */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            currentUserId || driveSync
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            {currentUserId || driveSync ? <Cloud size={12} /> : <CloudOff size={12} />}
            {currentUserId ? 'Cloud Synced' : driveSync ? 'Drive Synced' : 'Local Only'}
          </div>
          {/* Clear chat */}
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              title="Clear chat history"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-700 transition-colors"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

        {/* Messages */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-0 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} theme={theme} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-end gap-2.5 flex-row mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Analyzing your financial data…</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-4 w-8 h-8 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full shadow-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ChevronDown size={16} />
          </button>
        )}

        {/* ── Bottom bar: Quick Chips + Input ── */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-b-xl">

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp.id}
                onClick={() => sendMessage(qp.prompt)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${chipColors[qp.color]}`}
              >
                {!currentUserId ? <Lock size={12} className="opacity-70" /> : qp.icon}
                <span className="whitespace-nowrap">{qp.label}</span>
              </button>
            ))}
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 ml-auto pt-1 sm:pt-0">
              <MessageSquare size={10} />
              {messages.filter(m => !m.isWelcome).length} messages
            </div>
          </div>

          {/* Input Row */}
          {isLocked ? (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center shadow-inner relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
              <Lock size={28} className="text-indigo-500 mb-2 drop-shadow-sm" />
              <h4 className="font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Unlock Unlimited AI Advice</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 px-2 max-w-sm">
                You've reached your free limit (3 queries). Share Wealth For FIRE with 5 friends to unlock the AI Advisor forever!
              </p>
              
              <div className="w-full max-w-[240px] mb-4">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1.5 px-1">
                  <span className="uppercase tracking-wider">Shares</span>
                  <span>{sharesCount} / 5</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-700 ease-out" 
                    style={{ width: `${(sharesCount / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <button 
                onClick={handleShare}
                className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-6 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Share2 size={16} />
                Share to Unlock
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => {
                    setInputText(e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your finances..."
                  rows={1}
                  disabled={loading}
                  className="w-full resize-none border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 leading-relaxed overflow-hidden"
                  style={{ minHeight: 46 }}
                />
              </div>
              <button
                onClick={() => sendMessage(inputText)}
                disabled={loading || !inputText.trim()}
                className="flex-shrink-0 w-12 h-12 sm:w-11 sm:h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm self-end"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
            </div>
            <div className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 text-center">
              Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-sans mx-0.5">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-sans mx-0.5">Shift + Enter</kbd> for new line
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
