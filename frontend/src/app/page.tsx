'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import OverviewView from '@/components/OverviewView';
import TargetLabView, { TargetConfig } from '@/components/TargetLabView';
import EvaluatorView from '@/components/EvaluatorView';
import HistoryView from '@/components/HistoryView';
import { fetchHealth } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'target_lab' | 'evaluator' | 'history'>('overview');
  const [health, setHealth] = useState<any | null>(null);
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string>('');

  // Target Application Configurable Vulnerabilities (Shared between Target Lab & Evaluator)
  const [targetConfig, setTargetConfig] = useState<TargetConfig>({
    mfa_bypass: true,
    unsupported_claims: false,
    citation_mismatch: false,
    prompt_injection_weakness: true,
    outdated_policy: false,
  });

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => console.warn('Backend offline or starting up:', e));
  }, []);

  const handleOpenEvaluationReport = (evalId: string) => {
    setCurrentEvaluationId(evalId);
    setActiveTab('evaluator');
  };

  const handleStartEvaluatorWithCurrentConfig = () => {
    setCurrentEvaluationId('');
    setActiveTab('evaluator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-app-bg text-text-primary">
      <Header
        health={health}
        activeTab={activeTab}
        setActiveTab={(t: any) => setActiveTab(t)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            onNavigate={(t: any) => setActiveTab(t)}
            targetConfig={targetConfig}
          />
        )}

        {activeTab === 'target_lab' && (
          <TargetLabView
            config={targetConfig}
            onChangeConfig={setTargetConfig}
            onNavigateToEvaluator={handleStartEvaluatorWithCurrentConfig}
          />
        )}

        {activeTab === 'evaluator' && (
          <EvaluatorView
            key={currentEvaluationId || 'new'}
            targetConfig={targetConfig}
            initialEvaluationId={currentEvaluationId}
            onNavigateToTargetLab={() => setActiveTab('target_lab')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onSelectEvaluation={handleOpenEvaluationReport}
            onNavigateToEvaluator={() => {
              setCurrentEvaluationId('');
              setActiveTab('evaluator');
            }}
          />
        )}
      </main>

      {/* Understated Enterprise Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-text-muted bg-surface">
        <p>
          TrustForge AI &bull; Agentic Quality Engineering for LLM-Enabled Systems
        </p>
      </footer>
    </div>
  );
}
