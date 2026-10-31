'use client';
import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Bot,
  ArrowRight,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  Lock,
  GitBranch
} from 'lucide-react';
import { fetchEvaluations, fetchRegressionTests, fetchPolicies } from '@/lib/api';

interface OverviewViewProps {
  onNavigate: (tab: string) => void;
  targetConfig: {
    mfa_bypass: boolean;
    unsupported_claims: boolean;
    citation_mismatch: boolean;
    prompt_injection_weakness: boolean;
    outdated_policy: boolean;
  };
}

export default function OverviewView({ onNavigate, targetConfig }: OverviewViewProps) {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [regressions, setRegressions] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchEvaluations().catch(() => []),
      fetchRegressionTests().catch(() => []),
      fetchPolicies().catch(() => []),
    ]).then(([evals, regs, pols]) => {
      setEvaluations(evals);
      setRegressions(regs);
      setPolicies(pols);
      setLoading(false);
    });
  }, []);

  const latestEval = evaluations.length > 0 ? evaluations[0] : null;
  const activeRegressionsCount = regressions.filter((r) => r.status === 'ACTIVE').length;
  const activeVulnerabilitiesCount = Object.values(targetConfig).filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Hero Section */}
      <div className="border border-border rounded-xl p-6 sm:p-8 bg-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-light border border-primary/20 text-primary-accent text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Agentic Quality Engineering</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              TrustForge AI
            </h1>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              An enterprise platform designed to autonomously evaluate LLM applications for grounding, accuracy,
              security, prompt injection, and release readiness through independent multi-agent verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('target_lab')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-secondary text-text-primary text-sm font-semibold border border-border shadow-sm transition"
            >
              <Bot className="w-4 h-4 text-primary" />
              <span>Open Target Lab</span>
            </button>
            <button
              onClick={() => onNavigate('evaluator')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition"
            >
              <span>Run Evaluator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Platform Health & Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Latest Quality Score</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {latestEval ? `${latestEval.composite_score?.toFixed(1) || 0}%` : 'N/A'}
          </p>
          <p className="text-[11px] text-text-secondary">
            {latestEval ? `Decision: ${latestEval.release_decision}` : 'No evaluations yet'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Target Lab Weaknesses</span>
            <AlertTriangle className="w-4 h-4 text-status-warning-text" />
          </div>
          <p className="text-2xl font-bold text-status-warning-text tabular-nums">
            {activeVulnerabilitiesCount} / 5 Active
          </p>
          <p className="text-[11px] text-text-secondary">
            {activeVulnerabilitiesCount > 0 ? 'Weaknesses simulated' : 'Clean baseline'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Active Regressions</span>
            <GitBranch className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-bold text-secondary tabular-nums">
            {activeRegressionsCount}
          </p>
          <p className="text-[11px] text-text-secondary">
            Persistent failure catalog
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Knowledge Base</span>
            <FileText className="w-4 h-4 text-status-success-text" />
          </div>
          <p className="text-2xl font-bold text-status-success-text tabular-nums">
            {policies.length} Policies
          </p>
          <p className="text-[11px] text-text-secondary">
            Active synthetic standards
          </p>
        </div>
      </div>

      {/* The Two Core Products */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Two Distinct Core Products</h2>
          <p className="text-xs text-text-muted">
            TrustForge AI cleanly separates the application under test from the quality engineering evaluator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product A: Target Lab */}
          <div
            onClick={() => onNavigate('target_lab')}
            className="group cursor-pointer border border-border hover:border-primary/40 rounded-xl p-6 bg-surface hover:shadow-md transition duration-150 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary-light border border-[#C5D9F8] flex items-center justify-center text-primary">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Product A</span>
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                    Target Lab
                  </h3>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              The configurable LLM application under test. Customize application system instructions, manage policy documents,
              and deliberately enable synthetic vulnerability fixtures to stress-test your system.
            </p>

            <div className="space-y-2 pt-2 border-t border-border text-xs text-text-secondary">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Enterprise Helpdesk assistant with keyword policy retrieval</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>5 controllable vulnerability fixtures (MFA bypass, prompt injection, etc.)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Conversational sandbox chat with source citations inspection</span>
              </div>
            </div>
          </div>

          {/* Product B: TrustForge Evaluator */}
          <div
            onClick={() => onNavigate('evaluator')}
            className="group cursor-pointer border border-border hover:border-secondary/40 rounded-xl p-6 bg-surface hover:shadow-md transition duration-150 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-light border border-[#D9D1EF] flex items-center justify-center text-secondary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">Product B</span>
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-secondary transition-colors">
                    TrustForge Evaluator
                  </h3>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              The independent quality engineering platform. Autonomously inspects policies, synthesizes positive and adversarial tests,
              verifies claims against source truth, scores 7 quality dimensions, and recommends release decisions.
            </p>

            <div className="space-y-2 pt-2 border-t border-border text-xs text-text-secondary">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                <span>Independent verification without trusting target claims</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                <span>7-dimension weighted scoring and advisory release gates</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                <span>Runtime policy adaptation and mandatory human sign-off</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Principles */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Core Engineering Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-text-secondary">
          <div className="space-y-1">
            <h4 className="font-semibold text-text-primary flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Strict Decoupling</span>
            </h4>
            <p className="leading-relaxed">
              Target Application and Evaluator use separate instructions and configurations. The target never grades its own homework.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-text-primary flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Dynamic Test Synthesis</span>
            </h4>
            <p className="leading-relaxed">
              Tests are synthesized at runtime from discovered policy risks and active regressions, not picked from static prompt lists.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-text-primary flex items-center space-x-1.5">
              <GitBranch className="w-3.5 h-3.5 text-secondary" />
              <span>Adaptive Governance</span>
            </h4>
            <p className="leading-relaxed">
              When policies update, Agent 5 diffs text and synthesizes targeted tests. AI recommendations remain advisory to human authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
