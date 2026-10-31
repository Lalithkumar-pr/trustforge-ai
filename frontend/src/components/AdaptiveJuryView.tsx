'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, GitCompare, ShieldAlert, CheckCircle2, Play, RefreshCw, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { fetchEvaluations, postAdaptation } from '@/lib/api';

interface AdaptiveJuryViewProps {
  evaluationId?: string;
}

export default function AdaptiveJuryView({ evaluationId }: AdaptiveJuryViewProps) {
  const [selectedId, setSelectedId] = useState<string>(evaluationId || '');
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [docId, setDocId] = useState('IT-001');
  const [title, setTitle] = useState('Enterprise Password Reset Policy');
  const [version, setVersion] = useState('v3.0-ZERO-TRUST-MANDATORY');
  const [content, setContent] = useState(
    'All enterprise password resets strictly require hardware multi-factor authentication (FIDO2 WebAuthn / YubiKey). Under zero circumstances can helpdesk personnel manually reset employee passwords over the telephone or via verbal badge ID verification. Any unauthorized manual override is a Tier-1 compliance violation.'
  );
  const [requirements, setRequirements] = useState(
    'Hardware FIDO2 token is mandatory for all resets without exception. Telephone/badge resets strictly prohibited.'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvaluations().then(data => {
      setAllEvaluations(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    });
  }, []);

  const loadPresetDemo = () => {
    setDocId('IT-001');
    setTitle('Enterprise Password Reset Policy');
    setVersion('v3.0-ZERO-TRUST-MANDATORY');
    setContent(
      'All enterprise password resets strictly require hardware multi-factor authentication (FIDO2 WebAuthn / YubiKey). Under zero circumstances can helpdesk personnel manually reset employee passwords over the telephone or via verbal badge ID verification. Any unauthorized manual override is a Tier-1 compliance violation.'
    );
    setRequirements(
      'Hardware FIDO2 token is mandatory for all resets without exception. Telephone/badge resets strictly prohibited.'
    );
  };

  const handleAdapt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await postAdaptation(selectedId, {
        doc_id: docId,
        title,
        version,
        new_policy_content: content,
        important_requirements: requirements,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Adaptation workflow failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-850 via-purple-950/30 to-navy-850 border border-purple-500/30 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Agent 5 Capability
            </span>
            <span className="text-xs text-gray-400">Section 9 Showcase</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Adaptive Jury & Dynamic Policy Drift</h1>
          <p className="text-xs text-gray-300 mt-0.5 max-w-2xl">
            Demonstrates runtime strategic adaptation: when enterprise policies change or new jury scenarios are introduced,
            TrustForge diffs the policy, updates its risk register, synthesizes dynamic delta tests, re-evaluates the target, and updates release gates.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-white focus:outline-none focus:border-purple-500 w-full"
          >
            {allEvaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.id.slice(0, 8)}... - Current: {ev.release_decision} ({ev.composite_score}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Adaptation Form */}
      <form onSubmit={handleAdapt} className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Supply New Policy Scenario (Runtime Delta)
          </h2>
          <button
            type="button"
            onClick={loadPresetDemo}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors"
          >
            Load Hackathon Demo Scenario
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Target Policy Document ID</label>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Updated Version Tag</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            New / Modified Policy Content (Replaces Baseline)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Updated Key Requirements
          </label>
          <input
            type="text"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !selectedId}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-purple-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Synthesizing Adaptive Delta Suite...' : 'Trigger Adaptive Re-Evaluation'}</span>
          </button>
        </div>
      </form>

      {/* Live Adaptation Results Visualizer */}
      {result && (
        <div className="p-6 rounded-2xl bg-navy-850 border border-purple-500/40 shadow-xl space-y-5 glow-purple">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Adaptive Evaluation Completed Successfully</h2>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              Evaluation {result.evaluation_id.slice(0, 8)}...
            </span>
          </div>

          {/* Diffs & Affected Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 text-xs space-y-1.5">
              <span className="font-semibold text-purple-400 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <GitCompare className="w-4 h-4" />
                <span>Policy Delta Analysis (Agent 5)</span>
              </span>
              <p className="text-gray-300 leading-relaxed">{result.diff_summary}</p>
            </div>

            <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 text-xs space-y-1.5">
              <span className="font-semibold text-blue-400 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>Affected Threat Surfaces Identified</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {result.affected_risks.map((r: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono text-[10px] font-bold">
                    {r}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Targeted test cases synthesized specifically to stress-test modified requirements.
              </p>
            </div>
          </div>

          {/* Dynamic Adaptive Tests Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Dynamically Generated Delta Test Cases ({result.adaptive_tests_generated} Tests)
            </h3>
            <div className="space-y-2">
              {result.adaptive_findings.map((f: any) => (
                <div key={f.test_id} className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-purple-400 font-bold">{f.test_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {f.status}
                      </span>
                      {f.failure_type && (
                        <span className="px-1.5 py-0.5 rounded bg-navy-800 text-[10px] text-gray-300">
                          {f.failure_type}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Severity: {f.severity}</span>
                  </div>
                  <p className="text-gray-300">{f.judge_reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Updated Gate Decision & Score */}
          <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-700 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Updated Gate Recommendation</span>
              <div className="text-lg font-bold text-white mt-0.5">
                {result.updated_recommendation.decision}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">New Composite Score</span>
              <div className="text-2xl font-extrabold text-blue-400 mt-0.5">
                {result.updated_scores.composite_score}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
