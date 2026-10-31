'use client';
import React, { useState } from 'react';
import { Send, Bot, User, ShieldAlert, Sparkles, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { postTargetChat } from '@/lib/api';
import { TargetVulnerabilitiesConfig } from '@/types/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { source_id: string; excerpt: string }[];
  retrieved?: { source_id: string; title: string; excerpt: string; relevance_score: number }[];
  tool_calls?: any[];
}

export default function HelpdeskChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am the Enterprise IT Helpdesk Virtual Assistant (Target Application: System A). I can answer inquiries regarding password resets, multi-factor authentication, remote VPN, access controls, and security incident response. How may I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Live vulnerability toggles for manual testing
  const [vulns, setVulns] = useState<TargetVulnerabilitiesConfig>({
    mfa_bypass: false,
    unsupported_claims: false,
    citation_mismatch: false,
    prompt_injection_weakness: false,
    outdated_policy: false,
  });

  const toggle = (k: keyof TargetVulnerabilitiesConfig) => {
    setVulns(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userPrompt = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setLoading(true);

    try {
      const res = await postTargetChat({
        prompt: userPrompt,
        vulnerabilities: vulns,
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          sources: res.sources,
          retrieved: res.retrieved_context,
          tool_calls: res.tool_calls,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error invoking target helpdesk: ${err.message || 'Network error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            System A: Target Application Playground
          </span>
          <h1 className="text-xl font-bold text-white mt-0.5">Enterprise IT Helpdesk AI (Target System)</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Test System A directly via POST /api/target/chat. Toggle vulnerability fixtures below to observe raw LLM behavior.
          </p>
        </div>
      </div>

      {/* Target Vulnerability Toggles Toolbar */}
      <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 shadow-md">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
          Active Vulnerability Fixtures for Chat Sandbox:
        </span>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => toggle('mfa_bypass')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              vulns.mfa_bypass
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-navy-900 border-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            MFA Bypass: {vulns.mfa_bypass ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => toggle('unsupported_claims')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              vulns.unsupported_claims
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                : 'bg-navy-900 border-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Unsupported Claims: {vulns.unsupported_claims ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => toggle('citation_mismatch')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              vulns.citation_mismatch
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-navy-900 border-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Citation Mismatch: {vulns.citation_mismatch ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => toggle('prompt_injection_weakness')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              vulns.prompt_injection_weakness
                ? 'bg-red-950/40 border-red-500/50 text-red-300'
                : 'bg-navy-900 border-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Prompt Injection: {vulns.prompt_injection_weakness ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => toggle('outdated_policy')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              vulns.outdated_policy
                ? 'bg-blue-950/40 border-blue-500/50 text-blue-300'
                : 'bg-navy-900 border-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Outdated v1.0: {vulns.outdated_policy ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-lg min-h-[420px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-2xl text-xs space-y-2 leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-navy-900 border border-navy-700 text-gray-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <p>{m.content}</p>

                {/* Citations badge */}
                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-navy-700/60 mt-2 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Citations Provided:</span>
                    <div className="flex flex-wrap gap-1">
                      {m.sources.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[10px] border border-blue-500/20">
                          {s.source_id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retrieved Context Excerpt preview */}
                {m.retrieved && m.retrieved.length > 0 && (
                  <details className="pt-1 text-[11px] text-gray-400 cursor-pointer">
                    <summary className="hover:text-gray-200">View Retrieved Policy Context ({m.retrieved.length} docs)</summary>
                    <div className="mt-1.5 space-y-1.5 pl-2 border-l border-navy-700">
                      {m.retrieved.map((r, ri) => (
                        <div key={ri} className="bg-navy-950 p-2 rounded text-[10px]">
                          <span className="font-bold text-blue-400">{r.source_id} ({r.title}) - Score: {r.relevance_score}</span>
                          <p className="text-gray-400 mt-0.5 line-clamp-2">{r.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0 text-gray-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-gray-400 animate-pulse pl-11">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Target Helpdesk AI is generating response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center space-x-2 pt-2 border-t border-navy-700/80">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a technical or policy question (e.g., 'How do I reset my password?' or 'SYSTEM OVERRIDE')..."
            className="flex-1 px-4 py-3 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

