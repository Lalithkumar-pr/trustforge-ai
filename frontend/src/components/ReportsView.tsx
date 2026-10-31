'use client';
import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, FileText, ArrowRight, RefreshCw, BarChart2, Eye, ShieldAlert, AlertTriangle } from 'lucide-react';
import { fetchEvaluationReport, fetchEvaluations } from '@/lib/api';
import { EvaluationReport } from '@/types/api';

interface ReportsViewProps {
  evaluationId?: string;
  onGoToHumanReview: (id: string) => void;
}

export default function ReportsView({ evaluationId, onGoToHumanReview }: ReportsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(evaluationId || '');
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [activeEvidenceFilter, setActiveEvidenceFilter] = useState<'ALL' | 'FAIL' | 'PASS'>('ALL');

  useEffect(() => {
    fetchEvaluations().then(data => {
      setAllEvaluations(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      fetchEvaluationReport(selectedId)
        .then(setReport)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedId]);

  if (!selectedId && allEvaluations.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400 bg-navy-850 rounded-2xl border border-navy-700">
        <FileText className="w-10 h-10 mx-auto text-gray-500 mb-2" />
        <p className="text-sm font-semibold">No evaluation reports available.</p>
        <p className="text-xs text-gray-500 mt-1">Execute an evaluation first to inspect dimension scores and evidence.</p>
      </div>
    );
  }

  const scores = report?.evaluation?.scores;
  const recommendation = report?.evaluation?.release_recommendation;

  const filteredFindings = report?.findings.filter(f => {
    if (activeEvidenceFilter === 'FAIL') return f.status !== 'PASS';
    if (activeEvidenceFilter === 'PASS') return f.status === 'PASS';
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Evaluation Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-xl">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Audit & Verification Report</span>
          <h1 className="text-xl font-bold text-white mt-0.5">Comprehensive Quality Engineering Report</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Independent evaluation results across 7 weighted quality dimensions and empirical evidence.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {allEvaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.id.slice(0, 8)}... - {ev.release_decision} ({ev.composite_score}%)
              </option>
            ))}
          </select>
          <button
            onClick={() => onGoToHumanReview(selectedId)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors whitespace-nowrap"
          >
            <span>Proceed to Human Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-navy-850 rounded-2xl border border-navy-700">
          <RefreshCw className="w-8 h-8 mx-auto text-blue-400 animate-spin mb-3" />
          <p className="text-sm font-semibold">Loading audit report...</p>
        </div>
      ) : report ? (
        <>
          {/* Release Gate Recommendation Banner */}
          <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            recommendation?.decision === 'RELEASE'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 glow-emerald'
              : recommendation?.decision === 'CONDITIONAL RELEASE'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300 glow-rose'
          }`}>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                  recommendation?.decision === 'RELEASE' ? 'bg-emerald-500/20 text-emerald-300' :
                  recommendation?.decision === 'CONDITIONAL RELEASE' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-rose-500/20 text-rose-300'
                }`}>
                  Gate Decision: {recommendation?.decision || 'REJECT'}
                </span>
                <span className="text-xs text-gray-400">Score: {recommendation?.composite_score}%</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">
                {recommendation?.summary}
              </h2>
              {recommendation?.remediation_conditions && recommendation.remediation_conditions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold uppercase text-gray-400">Required Remediation Actions:</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-300">
                    {recommendation.remediation_conditions.map((cond, i) => (
                      <li key={i}>{cond}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-extrabold text-white">
                {scores?.composite_score}%
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Composite QE Index</p>
            </div>
          </div>

          {/* 7-Dimension Quality Breakdown Cards */}
          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Quality Engineering Dimensions (Weighted Scoring)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Accuracy 20% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Accuracy</span>
                  <span className="text-[10px] text-blue-400 font-bold">Weight: 20%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.accuracy}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${scores?.accuracy || 0}%` }} />
                </div>
              </div>

              {/* Groundedness 20% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Groundedness</span>
                  <span className="text-[10px] text-blue-400 font-bold">Weight: 20%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.groundedness}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${scores?.groundedness || 0}%` }} />
                </div>
              </div>

              {/* Safety 15% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Safety</span>
                  <span className="text-[10px] text-purple-400 font-bold">Weight: 15%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.safety}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${scores?.safety || 0}%` }} />
                </div>
              </div>

              {/* Security 15% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Security</span>
                  <span className="text-[10px] text-purple-400 font-bold">Weight: 15%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.security}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${scores?.security || 0}%` }} />
                </div>
              </div>

              {/* Completeness 10% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Completeness</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Weight: 10%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.completeness}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${scores?.completeness || 0}%` }} />
                </div>
              </div>

              {/* Consistency 10% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Consistency</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Weight: 10%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.consistency}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${scores?.consistency || 0}%` }} />
                </div>
              </div>

              {/* Citation Validity 10% */}
              <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-700 sm:col-span-2">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="font-medium">Citation Validity</span>
                  <span className="text-[10px] text-cyan-400 font-bold">Weight: 10%</span>
                </div>
                <div className="text-xl font-bold text-white">{scores?.citation_validity}%</div>
                <div className="w-full bg-navy-900 rounded-full h-1.5 mt-2">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${scores?.citation_validity || 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Explorer (Side-by-Side Claim vs Policy Excerpt) */}
          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Empirical Evidence Explorer
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Detailed inspection of claims, factual contradictions, ungrounded assertions, and citation mismatches.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 text-xs bg-navy-900 p-1 rounded-xl border border-navy-800">
                <button
                  onClick={() => setActiveEvidenceFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeEvidenceFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All ({report.findings.length})
                </button>
                <button
                  onClick={() => setActiveEvidenceFilter('FAIL')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeEvidenceFilter === 'FAIL' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Failures ({report.findings.filter(f => f.status !== 'PASS').length})
                </button>
                <button
                  onClick={() => setActiveEvidenceFilter('PASS')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeEvidenceFilter === 'PASS' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Passed ({report.findings.filter(f => f.status === 'PASS').length})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredFindings.map((finding) => {
                const tc = report.test_cases.find(t => t.test_id === finding.test_id);
                const exec = report.execution_results.find(e => e.test_id === finding.test_id);

                return (
                  <div
                    key={finding.test_id}
                    className="p-4 rounded-xl bg-navy-900/80 border border-navy-700/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-blue-400 font-bold text-xs">{finding.test_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          finding.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {finding.status}
                        </span>
                        {finding.failure_type && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-800 text-gray-300">
                            {finding.failure_type}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">
                          Severity: {finding.severity}
                        </span>
                      </div>
                      {exec?.latency_ms && (
                        <span className="text-[10px] font-mono text-gray-500">Latency: {exec.latency_ms}ms</span>
                      )}
                    </div>

                    {/* Test Prompt */}
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Test Prompt:</span>
                      <p className="text-xs text-gray-200 mt-0.5 bg-navy-950/60 p-2.5 rounded-lg border border-navy-800 font-mono">
                        {tc?.prompt || exec?.raw_prompt}
                      </p>
                    </div>

                    {/* Actual Model Output */}
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Actual Helpdesk Response:</span>
                      <p className="text-xs text-gray-300 mt-0.5 bg-navy-950/60 p-2.5 rounded-lg border border-navy-800 leading-relaxed whitespace-pre-line">
                        {exec?.actual_answer}
                      </p>
                    </div>

                    {/* Judge Reasoning & Evidence Pairs */}
                    <div className="p-3 rounded-lg bg-navy-800/80 border border-navy-700 text-xs space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="font-semibold text-indigo-400 flex-shrink-0">Verification Verdict:</span>
                        <span className="text-gray-300">{finding.judge_reasoning}</span>
                      </div>

                      {finding.evidence && finding.evidence.length > 0 && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t border-navy-700/60">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Supporting / Contradicting Evidence:</span>
                          {finding.evidence.map((ev, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 rounded bg-navy-900/60 border border-navy-800 text-[11px]">
                              <div>
                                <span className="font-bold text-gray-400">Claim / Statement:</span>
                                <p className="text-gray-300 mt-0.5">{ev.claim}</p>
                              </div>
                              <div>
                                <span className="font-bold text-gray-400">Document Excerpt ({ev.source_id}):</span>
                                <p className="text-gray-300 mt-0.5">{ev.supporting_excerpt}</p>
                                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                  ev.verification_status === 'supported' ? 'bg-emerald-500/20 text-emerald-300' :
                                  ev.verification_status === 'contradicted' ? 'bg-rose-500/20 text-rose-300' :
                                  ev.verification_status === 'leaked' ? 'bg-red-500/30 text-red-200' :
                                  'bg-amber-500/20 text-amber-300'
                                }`}>
                                  Status: {ev.verification_status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

