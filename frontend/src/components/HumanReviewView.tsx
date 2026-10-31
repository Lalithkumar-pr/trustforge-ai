'use client';
import React, { useEffect, useState } from 'react';
import { UserCheck, ShieldAlert, AlertTriangle, CheckCircle2, AlertOctagon, FileCheck, Send, History } from 'lucide-react';
import { fetchEvaluationReport, fetchEvaluations, postHumanApproval } from '@/lib/api';
import { EvaluationReport } from '@/types/api';

interface HumanReviewViewProps {
  evaluationId?: string;
}

export default function HumanReviewView({ evaluationId }: HumanReviewViewProps) {
  const [selectedId, setSelectedId] = useState<string>(evaluationId || '');
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [decision, setDecision] = useState<'APPROVED' | 'CONDITIONAL' | 'REJECTED'>('CONDITIONAL');
  const [reviewer, setReviewer] = useState('Chief AI Safety & Compliance Officer');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchEvaluations().then(data => {
      setAllEvaluations(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    });
  }, []);

  const loadReport = (id: string) => {
    if (!id) return;
    setLoading(true);
    fetchEvaluationReport(id)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedId) {
      loadReport(selectedId);
    }
  }, [selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !comments.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await postHumanApproval(selectedId, {
        decision,
        reviewer,
        comments,
      });
      setFeedback({ type: 'success', message: res.message });
      setComments('');
      // Reload report to refresh audit log
      loadReport(selectedId);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Approval recording failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const rec = report?.evaluation?.release_recommendation;
  const criticalFindings = report?.findings.filter(f => f.status !== 'PASS' && f.severity === 'critical') || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Mandatory Human-in-the-Loop Gate</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">Human Governance & Release Authorization</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            TrustForge produces advisory recommendations. Deployments strictly require an audited human authorization.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-white focus:outline-none focus:border-blue-500 w-full"
          >
            {allEvaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.id.slice(0, 8)}... - Gate: {ev.release_decision} ({ev.composite_score}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
          feedback.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Advisory Gate vs Human Authority Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System Recommendation */}
        <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md">
          <span className="text-xs font-semibold text-gray-400 uppercase">System Advisory Recommendation</span>
          <div className="mt-3 flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-lg text-sm font-extrabold uppercase ${
              rec?.decision === 'RELEASE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              rec?.decision === 'CONDITIONAL RELEASE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {rec?.decision || 'REJECT'}
            </span>
            <span className="text-xs text-gray-400">Score: {rec?.composite_score || 0}%</span>
          </div>
          <p className="text-xs text-gray-300 mt-3 leading-relaxed">
            {rec?.summary || 'No evaluation selected.'}
          </p>
          <div className="mt-3 pt-3 border-t border-navy-700/60 text-[11px] text-gray-500">
            Critical Blockers: {rec?.critical_failures || 0} | High Issues: {rec?.high_failures || 0}
          </div>
        </div>

        {/* Human Governance Rule */}
        <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase">Audit & Governance Standard</span>
            <h3 className="text-sm font-bold text-white mt-1">Non-Delegable Release Authority</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              In accordance with enterprise compliance policies, the AI evaluator is restricted from self-authorizing production deployment.
              All releases, conditional waivers, or rejections are permanently recorded in the immutable audit event log.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-gray-500 flex items-center space-x-1.5">
            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Cryptographic audit event recorded upon signing</span>
          </div>
        </div>
      </div>

      {/* Critical Findings Needing Human Sign-off */}
      {criticalFindings.length > 0 && (
        <div className="p-6 rounded-2xl bg-navy-850 border border-rose-500/30 shadow-md space-y-3">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              {criticalFindings.length} Critical Security Finding(s) Requiring Human Review
            </h2>
          </div>

          <div className="space-y-2 pt-1">
            {criticalFindings.map((cf) => (
              <div key={cf.test_id} className="p-3.5 rounded-xl bg-navy-900 border border-rose-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-rose-400">{cf.test_id}</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase text-[10px]">
                    {cf.failure_type}
                  </span>
                </div>
                <p className="text-gray-300">{cf.judge_reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Decision Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Record Official Human Review Decision
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Human Decision</label>
            <select
              value={decision}
              onChange={(e: any) => setDecision(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="APPROVED">APPROVED (Authorize Production Deployment)</option>
              <option value="CONDITIONAL">CONDITIONAL (Authorize Sandbox / Remediation Pilot)</option>
              <option value="REJECTED">REJECTED (Halt Deployment & Return for Engineering Fix)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Reviewer Identity</label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Audit Rationale & Remediation Conditions
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required
            rows={3}
            placeholder="Document rationale, risk mitigation conditions, or rejection instructions..."
            className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-white text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={submitting || !selectedId}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-transform transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Recording Audit Signature...' : 'Submit Official Human Decision'}</span>
          </button>
        </div>
      </form>

      {/* Historical Approvals Trail */}
      {report && report.approvals && report.approvals.length > 0 && (
        <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
            <History className="w-4 h-4 text-purple-400" />
            <span>Human Approval Audit History</span>
          </h2>
          <div className="space-y-2">
            {report.approvals.map((apprv) => (
              <div key={apprv.id} className="p-3.5 rounded-xl bg-navy-900 border border-navy-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{apprv.reviewer}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      apprv.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      apprv.decision === 'CONDITIONAL' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {apprv.decision}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {apprv.timestamp ? new Date(apprv.timestamp).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-gray-300">{apprv.comments}</p>
                <div className="text-[10px] text-gray-500 pt-1">
                  Previous AI Gate Recommendation: {apprv.previous_recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

