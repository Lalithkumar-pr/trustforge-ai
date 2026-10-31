'use client';
import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  health: {
    status: string;
    version: string;
    [key: string]: any;
  } | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ health, activeTab, setActiveTab }: HeaderProps) {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'target_lab', label: 'Target Lab', badge: 'Product A' },
    { id: 'evaluator', label: 'Evaluator', badge: 'Product B' },
    { id: 'history', label: 'Evaluation History' },
  ];

  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Product Tagline */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-9 h-9 rounded-lg bg-primary-light border border-[#C5D9F8] flex items-center justify-center text-primary group-hover:border-primary/40 transition-colors">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-text-primary">
                  TRUSTFORGE AI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-surface-secondary text-text-secondary border border-border">
                  Enterprise QE
                </span>
              </div>
              <p className="text-[11px] text-text-muted hidden sm:block">
                Agentic Quality Engineering for LLM-Enabled Systems
              </p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-primary-light text-primary border border-primary/25 font-semibold shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent font-medium'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`hidden md:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-primary/10 text-primary-accent'
                          : 'bg-surface-secondary text-text-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Status */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {health ? (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-surface border border-border text-text-secondary shadow-sm">
                <span className="w-2 h-2 rounded-full bg-status-success-text" />
                <span className="text-text-secondary text-xs font-medium">System Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-status-warning-bg border border-[#F0D5A3] text-status-warning-text">
                <span className="w-2 h-2 rounded-full bg-status-warning-text animate-pulse" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
