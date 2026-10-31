'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import NewEvaluationView from '@/components/NewEvaluationView';
import LiveEvaluationView from '@/components/LiveEvaluationView';
import ReportsView from '@/components/ReportsView';
import RegressionView from '@/components/RegressionView';
import HumanReviewView from '@/components/HumanReviewView';
import AdaptiveJuryView from '@/components/AdaptiveJuryView';
import HelpdeskChatView from '@/components/HelpdeskChatView';
import BenchmarkView from '@/components/BenchmarkView';
import { fetchHealth } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentEvaluationId, setCurrentEvaluationId] = useState('');
  const [health, setHealth] = useState<any | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => console.warn('Backend offline or starting up:', e));
  }, []);

  const handleStartNew = () => {
    setActiveTab('new_eval');
  };

  const handleEvaluationStarted = (id: string) => {
    setCurrentEvaluationId(id);
    setActiveTab('live_eval');
  };

  const handleViewEvaluation = (id: string) => {
    setCurrentEvaluationId(id);
    setActiveTab('reports');
  };

  const handleGoToHumanReview = (id: string) => {
    setCurrentEvaluationId(id);
    setActiveTab('human_review');
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-900 text-gray-100">
      <Header health={health} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onStartNew={handleStartNew}
            onViewEvaluation={handleViewEvaluation}
          />
        )}

        {activeTab === 'new_eval' && (
          <NewEvaluationView
            onEvaluationStarted={handleEvaluationStarted}
          />
        )}

        {activeTab === 'live_eval' && (
          <LiveEvaluationView
            evaluationId={currentEvaluationId}
            onViewReport={handleViewEvaluation}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            evaluationId={currentEvaluationId}
            onGoToHumanReview={handleGoToHumanReview}
          />
        )}

        {activeTab === 'regression' && (
          <RegressionView />
        )}

        {activeTab === 'human_review' && (
          <HumanReviewView
            evaluationId={currentEvaluationId}
          />
        )}

        {activeTab === 'adaptive_jury' && (
          <AdaptiveJuryView
            evaluationId={currentEvaluationId}
          />
        )}

        {activeTab === 'sandbox_chat' && (
          <HelpdeskChatView />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkView />
        )}
      </main>

      <footer className="border-t border-navy-800 bg-navy-900/80 py-4 text-center text-xs text-gray-500">
        <p>TrustForge AI &bull; Agentic Quality Engineering for LLM-Enabled Systems &bull; Hackathon Edition</p>
      </footer>
    </div>
  );
}

