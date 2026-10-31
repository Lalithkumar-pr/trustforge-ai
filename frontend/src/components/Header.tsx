'use client';
import React from 'react';
import { ShieldAlert, Cpu, Sparkles, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  health: {
    status: string;
    version: string;
    gemini_configured: boolean;
    gemini_model: string;
  } | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ health, activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'new_eval', label: 'New Evaluation' },
    { id: 'live_eval', label: 'Live Evaluation' },
    { id: 'reports', label: 'Reports & Evidence' },
    { id: 'regression', label: 'Regression Suite' },
    { id: 'human_review', label: 'Human Review' },
    { id: 'adaptive_jury', label: 'Adaptive Jury (Demo)' },
    { id: 'sandbox_chat', label: 'Helpdesk Sandbox' },
    { id: 'benchmark', label: 'Benchmark Metrics' },
  ];

  return (
    <header className="border-b border-navy-700 bg-navy-900/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center glow-blue shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400">
                  TRUSTFORGE AI
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Agentic QE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Agentic Quality Engineering for LLM-Enabled Systems</p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center space-x-3 text-xs">
            {health ? (
              <>
                <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-navy-800 border border-navy-700 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Backend v{health.version}</span>
                </div>
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
                  health.gemini_configured
                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {health.gemini_configured
                      ? `Gemini Active (${health.gemini_model})`
                      : 'Gemini Offline (Deterministic Fallback Engine)'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/30 text-red-300">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Connecting to Backend...</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-navy-800/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

