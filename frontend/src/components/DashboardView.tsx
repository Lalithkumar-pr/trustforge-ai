'use client';
import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, FileText, ArrowRight, Play, RefreshCw, BarChart3, Lock, Users } from 'lucide-react';
import { fetchEvaluations } from '@/lib/api';
import { EvaluationSummary } from '@/types/api';

interface DashboardViewProps {
  onStartNew: () => void;
  onViewEvaluation: (id: string) => void;
}

export default function DashboardView({ onStartNew, onViewEvaluation }: DashboardViewProps) {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvals = async () => {
    setLoading(true);
    try {
      const data = await fetchEvaluations();
      setEvaluations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvals();
  }, []);

  const latest = evaluations.length > 0 ? evaluations[0] : null;
  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.composite_score || 0), 0) / evaluations.length)
    : 0;

  const totalEvaluations = evaluations.length;
  const passedEvaluations = evaluations.filter(e => e.release_decision === 'RELEASE').length;
  const rejectedEvaluations = evaluations.filter(e => e.release_decision === 'REJECT').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-850 via-navy-800 to-navy-850 border border-navy-700 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Agentic Quality Engineering Overview</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Control Plane
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Autonomous verification of enterprise LLM applications. Discovers security risks, synthesizes runtime test suites,
            validates factual citations, and evaluates release readiness gates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadEvals}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-gray-300 transition-colors"
            title="Refresh evaluations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onStartNew}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Evaluation</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Latest Quality Score */}
        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest Quality Score</span>
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {latest ? `${latest.composite_score}%` : 'N/A'}
            </span>
            {latest && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                latest.composite_score >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                latest.composite_score >= 75 ? 'bg-amber-500/10 text-amber-400' :
                'bg-rose-500/10 text-rose-400'
              }`}>
                {latest.release_decision}
              </span>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {latest ? `ID: ${latest.id.slice(0, 8)}... (${latest.current_stage})` : 'No evaluations executed yet'}
          </div>
        </div>

        {/* Metric 2: Total Evaluations Executed */}
        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Evaluations Run</span>
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{totalEvaluations}</span>
            <span className="text-xs text-gray-400">runs</span>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Avg Score: {avgScore}% across historical runs
          </div>
        </div>

        {/* Metric 3: Release Gates Passed */}
        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved Releases</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">{passedEvaluations}</span>
            <span className="text-xs text-gray-400">/ {totalEvaluations}</span>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Zero unresolved critical failures required
          </div>
        </div>

        {/* Metric 4: Gate Rejections */}
        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Blocked Deployments</span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-400">{rejectedEvaluations}</span>
            <span className="text-xs text-gray-400">blocked</span>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Critical security/compliance blockers trapped
          </div>
        </div>
      </div>

      {/* Agent Architecture Overview Card */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-lg">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Specialized Agent Orchestration Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700">
            <div className="flex items-center space-x-2 text-blue-400 font-bold mb-1">
              <span>Agent 1</span>
            </div>
            <p className="font-semibold text-white">Orchestrator</p>
            <p className="text-gray-400 mt-1">Lifecycle coordination, state persistence, audit trail.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700">
            <div className="flex items-center space-x-2 text-purple-400 font-bold mb-1">
              <span>Agent 2</span>
            </div>
            <p className="font-semibold text-white">Risk Intelligence</p>
            <p className="text-gray-400 mt-1">Analyzes 5 policies, target config, and attack surfaces.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-1">
              <span>Agent 3</span>
            </div>
            <p className="font-semibold text-white">Test Strategist</p>
            <p className="text-gray-400 mt-1">Synthesizes dynamic positive, boundary & adversarial tests.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
              <span>Agent 4</span>
            </div>
            <p className="font-semibold text-white">Verification Agent</p>
            <p className="text-gray-400 mt-1">Grounding checks, citation validation, secret leak scanner.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700">
            <div className="flex items-center space-x-2 text-amber-400 font-bold mb-1">
              <span>Agent 5</span>
            </div>
            <p className="font-semibold text-white">Adaptation Agent</p>
            <p className="text-gray-400 mt-1">Diffs updated policies, generates targeted delta tests.</p>
          </div>
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Quality Evaluations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click any evaluation to open full audit findings and evidence report.</p>
          </div>
          <button
            onClick={onStartNew}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>Configure New Run</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {evaluations.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-navy-800/40 rounded-xl border border-dashed border-navy-700">
            <FileText className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <p className="text-sm font-medium">No evaluations recorded yet.</p>
            <p className="text-xs text-gray-500 mt-1">Launch your first evaluation to begin agentic quality analysis.</p>
            <button
              onClick={onStartNew}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Start First Evaluation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-gray-400 uppercase bg-navy-800/80 border-b border-navy-700">
                <tr>
                  <th className="px-4 py-3">Evaluation ID</th>
                  <th className="px-4 py-3">Status / Stage</th>
                  <th className="px-4 py-3">Quality Score</th>
                  <th className="px-4 py-3">Release Gate</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60 text-gray-300">
                {evaluations.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => onViewEvaluation(ev.id)}
                    className="hover:bg-navy-800/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-blue-400 font-medium">
                      {ev.id.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          ev.status === 'COMPLETED' ? 'bg-emerald-400' :
                          ev.status === 'RUNNING' ? 'bg-blue-400 animate-pulse' :
                          ev.status === 'FAILED' ? 'bg-rose-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-semibold text-white">{ev.current_stage}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {ev.composite_score ? `${ev.composite_score}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        ev.release_decision === 'RELEASE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        ev.release_decision === 'CONDITIONAL RELEASE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        ev.release_decision === 'REJECT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {ev.release_decision || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-gray-400">
                      {ev.summary || 'In progress...'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-blue-400 hover:text-blue-300">
                      Inspect &rarr;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

