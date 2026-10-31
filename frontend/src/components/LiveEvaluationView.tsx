'use client';
import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertOctagon, Clock, ArrowRight, ShieldAlert, Cpu, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { fetchEvaluationDetail, fetchEvaluationReport } from '@/lib/api';
import { EvaluationDetail, EvaluationReport } from '@/types/api';

interface LiveEvaluationViewProps {
  evaluationId: string;
  onViewReport: (id: string) => void;
}

export default function LiveEvaluationView({ evaluationId, onViewReport }: LiveEvaluationViewProps) {
  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);

  const STAGES = [
    { key: 'INITIALIZING', label: '1. Init' },
    { key: 'RISK_ANALYSIS', label: '2. Risk Intelligence' },
    { key: 'TEST_GENERATION', label: '3. Test Strategist' },
    { key: 'EXECUTION', label: '4. Target Execution' },
    { key: 'VERIFICATION', label: '5. Verification Agent' },
    { key: 'SCORING_AND_RELEASE', label: '6. Release Gates' },
    { key: 'COMPLETED', label: '7. Completed' },
  ];

  const getStageIndex = (stage: string) => {
    const idx = STAGES.findIndex(s => s.key === stage);
    return idx >= 0 ? idx : 0;
  };

  const poll = async () => {
    if (!evaluationId) return;
    try {
      const data = await fetchEvaluationDetail(evaluationId);
      setDetail(data);

      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setPollingActive(false);
        // Load full report
        const rep = await fetchEvaluationReport(evaluationId);
        setReport(rep);
      }
    } catch (e) {
      console.error('Polling error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    poll();
    let interval: NodeJS.Timeout;
    if (pollingActive) {
      interval = setInterval(poll, 2000);
    }
    return () => clearInterval(interval);
  }, [evaluationId, pollingActive]);

  if (!evaluationId) {
    return (
      <div className="p-12 text-center text-gray-400 bg-navy-850 rounded-2xl border border-navy-700">
        <Clock className="w-10 h-10 mx-auto text-gray-500 mb-2" />
        <p className="text-sm font-semibold">No active evaluation selected.</p>
        <p className="text-xs text-gray-500 mt-1">Select an evaluation from the Dashboard or launch a New Evaluation.</p>
      </div>
    );
  }

  const currentIdx = getStageIndex(detail?.current_stage || 'INITIALIZING');
  const isCompleted = detail?.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              ID: {evaluationId}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
              detail?.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              detail?.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
            }`}>
              {detail?.status || 'INITIALIZING'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Live Agentic Workflow Execution</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time multi-agent execution pipeline evaluating Target Enterprise Helpdesk AI.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={poll}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-gray-300"
            title="Refresh manually"
          >
            <RefreshCw className={`w-4 h-4 ${pollingActive ? 'animate-spin' : ''}`} />
          </button>
          {isCompleted && (
            <button
              onClick={() => onViewReport(evaluationId)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg transition-transform transform hover:-translate-y-0.5"
            >
              <span>View Full Audit Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 6-Stage Stepper */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold uppercase tracking-wider">Evaluation Lifecycle Progress</span>
          <span className="font-mono font-bold text-white">{detail?.progress || 0}% Complete</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden border border-navy-700">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${detail?.progress || 10}%` }}
          />
        </div>

        {/* Stepper nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {STAGES.map((s, idx) => {
            const isDone = currentIdx > idx || isCompleted;
            const isCurrent = currentIdx === idx && !isCompleted;
            return (
              <div
                key={s.key}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-blue-950/30 border-blue-500/50 text-blue-300 animate-pulse glow-blue'
                    : 'bg-navy-900/60 border-navy-800 text-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  )}
                </div>
                <span className="text-[11px] font-bold block">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Summary Strip when complete */}
      {detail?.scores && detail.scores.composite_score !== undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700">
            <span className="text-xs font-semibold text-gray-400 uppercase">Composite Quality Score</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {detail.scores.composite_score}%
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Weighted across 7 quality dimensions</p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700">
            <span className="text-xs font-semibold text-gray-400 uppercase">Release Recommendation</span>
            <div className={`text-xl font-bold mt-1 ${
              detail.release_recommendation?.decision === 'RELEASE' ? 'text-emerald-400' :
              detail.release_recommendation?.decision === 'CONDITIONAL RELEASE' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {detail.release_recommendation?.decision || 'EVALUATING'}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Critical: {detail.release_recommendation?.critical_failures || 0} | High: {detail.release_recommendation?.high_failures || 0}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700">
            <span className="text-xs font-semibold text-gray-400 uppercase">Test Suite Results</span>
            <div className="text-2xl font-bold text-white mt-1">
              <span className="text-emerald-400">{detail.passed_count} Passed</span>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-rose-400">{detail.failed_count} Failed</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Total {detail.test_count} tests executed</p>
          </div>
        </div>
      )}

      {/* Live Findings Table */}
      {report && report.findings && (
        <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Live Verification Findings ({report.findings.length} Tests)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Target responses verified independently against ground truth policies and security baselines.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-gray-400 uppercase bg-navy-800/80 border-b border-navy-700">
                <tr>
                  <th className="px-3 py-2.5">Test ID</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Failure Type</th>
                  <th className="px-3 py-2.5">Severity</th>
                  <th className="px-3 py-2.5">Judge Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60 text-gray-300">
                {report.findings.map((f) => (
                  <tr key={f.test_id} className="hover:bg-navy-800/40">
                    <td className="px-3 py-3 font-mono font-bold text-blue-400">{f.test_id}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        f.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        f.status === 'FAIL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-300">
                      {f.failure_type || 'NONE'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        f.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        f.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        f.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-300 leading-relaxed max-w-md">
                      {f.judge_reasoning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

