import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
  Bot, Sparkles, Loader2, Send, Trash2, CloudOff, Cloud,
  MessageSquare, ChevronDown, Activity, Flame
} from 'lucide-react';
import { syncChatToDrive, isSyncedToDrive } from '../utils/gdrive';

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
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 text-slate-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-800/50 rounded-bl-sm'
              : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 shadow-sm rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-2 [&>ul]:mt-1 [&>ul]:space-y-0.5 [&>p]:my-1"
              dangerouslySetInnerHTML={{ __html: msg.content }}
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
  const { state } = useAppState();
  const theme = state.settings?.theme || 'light';

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
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

  const systemPrompt = `You are FinGoal AI, an elite financial advisor specializing in the Indian personal finance market.

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

  // ── Persist messages to localStorage ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    // Sync to Drive (debounced by browser)
    if (isSyncedToDrive() && messages.length > 0) {
      syncChatToDrive(messages);
    }
  }, [messages]);

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

  // ── Show welcome message only on first load if chat is empty ──────────────
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `<p>👋 <strong>Welcome to FinGoal AI Advisor!</strong></p>
<p>I have full context of your financial data — assets, liabilities, goals, and cash flow. Ask me anything:</p>
<ul>
  <li>Use the <strong>Quick Prompt</strong> chips below for instant analysis</li>
  <li>Or type your own question — I support follow-up questions too!</li>
</ul>
<p><em>Note: Your OpenAI API key is required in Settings to activate AI responses.</em></p>`,
        isWelcome: true,
        timestamp: Date.now()
      }]);
    }
  }, []); // run only once on mount

  // ── Core send function ─────────────────────────────────────────────────────
  const sendMessage = async (userText) => {
    if (!userText?.trim() || loading) return;

    if (!state.settings?.openaiApiKey) {
      const errorMsg = {
        role: 'assistant',
        content: `<p>⚠️ <strong>API Key Required</strong></p><p>Please go to <strong>Settings</strong> and enter your OpenAI API key to enable AI responses.</p>`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const userMessage = { role: 'user', content: userText.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    // Build OpenAI messages array — use the last 20 real messages for context window
    const contextMessages = updatedMessages
      .filter(m => !m.isWelcome)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...contextMessages
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiReply = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), aiReply]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `<p>❌ <strong>Error:</strong> ${err.message}</p><p>Please check your API key in Settings and try again.</p>`,
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

  const clearChat = () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      setMessages([]);
      localStorage.removeItem(LS_KEY);
      if (isSyncedToDrive()) syncChatToDrive([]);
      // Reinstate welcome message
      setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: `<p>🔄 <strong>Chat cleared.</strong> Ready for a fresh conversation! Use the chips below or type your question.</p>`,
          isWelcome: true,
          timestamp: Date.now()
        }]);
      }, 100);
    }
  };

  // ── Chip color mapping ─────────────────────────────────────────────────────
  const chipColors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800/50',
    rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-800/50',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/50'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto pb-2 transition-colors">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles size={22} className="text-indigo-500" />
            AI Advisor &amp; Simulator
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-turn conversation with full financial context
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Drive sync badge */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            driveSync
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            {driveSync ? <Cloud size={12} /> : <CloudOff size={12} />}
            {driveSync ? 'Drive Synced' : 'Local Only'}
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
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp.id}
                onClick={() => sendMessage(qp.prompt)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${chipColors[qp.color]}`}
              >
                {qp.icon}
                {qp.label}
              </button>
            ))}
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
              <MessageSquare size={10} />
              {messages.filter(m => !m.isWelcome).length} messages
            </div>
          </div>

          {/* Input Row */}
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
                placeholder="Ask anything about your finances… (Enter to send, Shift+Enter for new line)"
                rows={1}
                disabled={loading}
                className="w-full resize-none border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 leading-relaxed"
                style={{ minHeight: 46 }}
              />
            </div>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={loading || !inputText.trim()}
              className="flex-shrink-0 w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
