import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Bot, Sparkles, Loader2 } from 'lucide-react';

export default function Simulation() {
  const { state } = useAppState();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);

  const totalIncome = parseFloat(state.income) || 0;
  const totalExpenses = parseFloat(state.expenses) || 0;
  let totalEmi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => { if (l.emi) totalEmi += parseFloat(l.emi); });
  const surplus = totalIncome - totalExpenses - totalEmi;

  const handleAskAI = async (promptType) => {
    if (!state.settings?.openaiApiKey) {
      alert("Please configure your OpenAI API Key in the Settings tab first.");
      return;
    }

    setLoading(true);
    setInsight(null);

    const systemPrompt = `You are an elite financial advisor focusing on the Indian market.
    The user's current state:
    Monthly Income: ₹${totalIncome}
    Monthly Expenses: ₹${totalExpenses}
    Total EMI: ₹${totalEmi}
    Monthly Surplus: ₹${surplus}
    Assets: ${JSON.stringify(state.assets)}
    Liabilities: ${JSON.stringify(state.liabilities)}
    Goals: ${JSON.stringify(state.goals)}
    
    IMPORTANT FORMATTING RULES:
    1. Provide the response entirely in valid, clean HTML format.
    2. Use standard tags like <h3>, <p>, <ul>, <li>, and <strong>.
    3. DO NOT use markdown characters (like ### or **).
    4. DO NOT use LaTeX or complex math symbols (like \\[ or \\frac). Write math as simple text.
    5. Keep it highly specific, actionable, and concise (under 250 words).`;

    let userPrompt = "Analyze my financial health and provide 3 immediate action items.";
    if (promptType === 'debt') userPrompt = "Analyze my liabilities. Which exact loan should I pre-close first to save maximum interest, and how should I restructure my EMIs?";
    if (promptType === 'fire') userPrompt = "Based on my assets, expenses, and surplus, realistically when can I achieve FIRE (Financial Independence, Retire Early)? What is the exact corpus I need assuming 4% withdrawal rate?";

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      setInsight(data.choices[0].message.content);
    } catch (err) {
      setInsight(`**Error:** ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto transition-colors">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">AI Advisor & Simulator</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Leverage AI to optimize your wealth and debt strategies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <button onClick={() => handleAskAI('general')} className="w-full text-left p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Sparkles size={20} /></div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">General Health Check</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get 3 immediate actionable insights.</p>
            </div>
          </button>
          
          <button onClick={() => handleAskAI('debt')} className="w-full text-left p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm flex items-start gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg"><Bot size={20} /></div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Debt Destroyer Strategy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mathematical analysis on what to pre-close.</p>
            </div>
          </button>

          <button onClick={() => handleAskAI('fire')} className="w-full text-left p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Sparkles size={20} /></div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">FIRE Readiness</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Calculate your retirement corpus & date.</p>
            </div>
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[300px] sm:min-h-[400px] flex flex-col transition-colors">
            <h2 className="text-lg font-semibold mb-4 border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-900 dark:text-white">AI Output</h2>
            <div className="flex-1 overflow-auto prose prose-slate dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200">
              {loading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Analyzing your financial matrix...</p>
                </div>
              )}
              {!loading && !insight && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <Bot size={48} className="opacity-20 mb-3" />
                  <p>Select a simulation on the left to generate insights.</p>
                </div>
              )}
              {!loading && insight && (
                <div className="leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: insight }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
