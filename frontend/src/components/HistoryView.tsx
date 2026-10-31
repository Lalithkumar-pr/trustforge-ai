'use client';
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  GitBranch,
  RotateCcw
} from 'lucide-react';
import { fetchEvaluations, fetchRegressionTests } from '@/lib/api';

interface HistoryViewProps {
  onSelectEvaluation: (evalId: string) => void;
  onNavigateToEvaluator: () => void;
}

export default function HistoryView({
  onSelectEvaluation,
  onNavigateToEvaluator,
}: HistoryViewProps) {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [regressions, setRegressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegressionsList, setShowRegressionsList] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evals, regs] = await Promise.all([
        fetchEvaluations().catch(() => []),
        fetchRegressionTests().catch(() => []),
      ]);
      setEvaluations(evals);
      setRegressions(regs);
    } catch (e) {
      console.error('Error loading history:', e);
    } finally {
      setLoading(false);
    }
  };

  const completedEvals = evaluations.filter((e) => e.status === 'COMPLETED');
  const avgScore = completedEvals.length > 0
    ? (completedEvals.reduce((acc, e) => acc + (e.composite_score || 0), 0) / completedEvals.length).toFixed(1)
    : 'N/A';
  const activeRegressionsCount = regressions.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Evaluation History</h1>
          <p className="text-xs text-text-secondary mt-1">
            Historical audit records of agentic quality evaluations, release recommendations, and persistent regression tests.
          </p>
        </div>

        <button
          onClick={onNavigateToEvaluator}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition"
        >
          <span>Run New Evaluation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-muted">Total Evaluations</span>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{evaluations.length}</p>
          <p className="text-[11px] text-text-secondary">{completedEvals.length} Completed Runs</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-muted">Average Quality Score</span>
          <p className="text-2xl font-bold text-primary tabular-nums">{avgScore}%</p>
          <p className="text-[11px] text-text-secondary">Across completed audits</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-muted">Active Regressions</span>
          <p className="text-2xl font-bold text-secondary tabular-nums">{activeRegressionsCount}</p>
          <p className="text-[11px] text-text-secondary">Persistent failure catalog</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-1">
          <span className="text-xs font-medium text-text-muted">Release Decisions</span>
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {completedEvals.filter((e) => e.release_decision === 'RELEASE').length} Pass / {completedEvals.filter((e) => e.release_decision === 'REJECT').length} Reject
          </p>
          <p className="text-[11px] text-text-secondary">Automated gate decisions</p>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold text-text-primary">Previous Evaluation Runs</h2>
          <button
            onClick={loadData}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center space-x-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-text-muted">
            Loading evaluation history...
          </div>
        ) : evaluations.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary space-y-2">
            <p>No evaluation records found.</p>
            <button
              onClick={onNavigateToEvaluator}
              className="text-primary hover:underline font-medium"
            >
              Start your first evaluation in Evaluator
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-[11px] uppercase tracking-wider font-semibold bg-surface-secondary/40">
                  <th className="py-2.5 px-3 font-medium">Application Name</th>
                  <th className="py-2.5 px-3 font-medium">Date & Time</th>
                  <th className="py-2.5 px-3 font-medium">Quality Score</th>
                  <th className="py-2.5 px-3 font-medium">Release Recommendation</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-surface-subtle transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-text-primary">Enterprise IT Helpdesk AI</div>
                      <span className="font-mono text-[10px] text-text-muted truncate block max-w-[160px]">
                        {ev.id}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                      {ev.created_at ? new Date(ev.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold font-mono text-sm tabular-nums ${
                        ev.composite_score >= 90
                          ? 'text-status-success-text'
                          : ev.composite_score >= 70
                          ? 'text-status-warning-text'
                          : 'text-status-error-text'
                      }`}>
                        {ev.composite_score ? `${ev.composite_score.toFixed(1)}%` : '0.0%'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ev.release_decision === 'RELEASE'
                          ? 'bg-status-success-bg text-status-success-text border border-status-success-text/20'
                          : ev.release_decision === 'CONDITIONAL RELEASE'
                          ? 'bg-status-warning-bg text-status-warning-text border border-status-warning-text/20'
                          : 'bg-status-error-bg text-status-error-text border border-status-error-text/20'
                      }`}>
                        {ev.release_decision || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      <span className="font-mono text-[11px]">{ev.status}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectEvaluation(ev.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-surface hover:bg-surface-secondary text-text-primary hover:text-primary text-xs font-semibold border border-border shadow-sm transition"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Embedded Persistent Regression Catalog */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-secondary" />
              <span>Persistent Regression Suite ({activeRegressionsCount} Active)</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Discovered failures are permanently cataloged to ensure bugs cannot silently resurface in subsequent evaluations.
            </p>
          </div>

          <button
            onClick={() => setShowRegressionsList(!showRegressionsList)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {showRegressionsList ? 'Hide Catalog' : 'Inspect Catalog'}
          </button>
        </div>

        {showRegressionsList && (
          <div className="pt-3 border-t border-border space-y-2">
            {regressions.length === 0 ? (
              <p className="text-xs text-text-muted">No regressions cataloged yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {regressions.slice(0, 8).map((r) => (
                  <div key={r.id} className="p-2.5 rounded-lg bg-surface-subtle border border-border flex flex-col justify-between space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-secondary text-[11px]">{r.test_id}</span>
                      <span className="text-[10px] bg-status-error-bg text-status-error-text px-1.5 py-0.2 rounded font-bold uppercase">
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-text-primary text-[11px] line-clamp-1 font-medium">"{r.prompt}"</p>
                    <span className="text-[10px] text-text-muted">Status: {r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
