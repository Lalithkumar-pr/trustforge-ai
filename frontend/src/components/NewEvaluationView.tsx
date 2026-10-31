'use client';
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Bug, Terminal, FileCode2, Play, CheckCircle, Info, Sparkles } from 'lucide-react';
import { createEvaluation, fetchPolicies } from '@/lib/api';
import { TargetVulnerabilitiesConfig, PolicyDocument } from '@/types/api';

interface NewEvaluationViewProps {
  onEvaluationStarted: (id: string) => void;
}

export default function NewEvaluationView({ onEvaluationStarted }: NewEvaluationViewProps) {
  const [name, setName] = useState('Enterprise IT Helpdesk Quality & Security Evaluation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);

  // Configurable Target Vulnerabilities
  const [vulns, setVulns] = useState<TargetVulnerabilitiesConfig>({
    mfa_bypass: true,
    prompt_injection_weakness: true,
    unsupported_claims: false,
    citation_mismatch: false,
    outdated_policy: false,
  });

  useEffect(() => {
    fetchPolicies().then(setPolicies).catch(console.error);
  }, []);

  const toggleVuln = (key: keyof TargetVulnerabilitiesConfig) => {
    setVulns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setPreset = (preset: 'vulnerable' | 'clean' | 'hallucination') => {
    if (preset === 'vulnerable') {
      setVulns({
        mfa_bypass: true,
        prompt_injection_weakness: true,
        unsupported_claims: false,
        citation_mismatch: false,
        outdated_policy: false,
      });
    } else if (preset === 'clean') {
      setVulns({
        mfa_bypass: false,
        prompt_injection_weakness: false,
        unsupported_claims: false,
        citation_mismatch: false,
        outdated_policy: false,
      });
    } else if (preset === 'hallucination') {
      setVulns({
        mfa_bypass: false,
        prompt_injection_weakness: false,
        unsupported_claims: true,
        citation_mismatch: true,
        outdated_policy: false,
      });
    }
  };

  const handleLaunch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await createEvaluation({
        name,
        target_config: vulns,
      });
      onEvaluationStarted(res.id);
    } catch (e: any) {
      setError(e.message || 'Failed to initialize evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configure New Quality Evaluation</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select target application parameters, synthetic policy documents, and evaluation vulnerability fixtures.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Evaluation Metadata Form */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Evaluation Identity</h2>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Evaluation Run Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-navy-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Target Application: Enterprise IT Helpdesk Assistant (System A). Evaluator: TrustForge Agent Suite (System B).</span>
        </div>
      </div>

      {/* Target Application Configurable Weaknesses */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Target Vulnerability Fixtures (Controlled Evaluation)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure synthetic vulnerabilities in System A to evaluate whether TrustForge discovers genuine failures.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400">Presets:</span>
            <button
              onClick={() => setPreset('vulnerable')}
              className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-blue-400 font-medium transition-colors"
            >
              Demo Vulnerable
            </button>
            <button
              onClick={() => setPreset('hallucination')}
              className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-purple-400 font-medium transition-colors"
            >
              Hallucination Stress
            </button>
            <button
              onClick={() => setPreset('clean')}
              className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-emerald-400 font-medium transition-colors"
            >
              Zero-Trust Clean
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weakness A */}
          <div
            onClick={() => toggleVuln('mfa_bypass')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vulns.mfa_bypass
                ? 'bg-rose-950/20 border-rose-500/40 text-white glow-rose'
                : 'bg-navy-800/40 border-navy-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">A. MFA Bypass Vulnerability</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                vulns.mfa_bypass ? 'bg-rose-500/20 text-rose-300' : 'bg-navy-700 text-gray-400'
              }`}>
                {vulns.mfa_bypass ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Target application incorrectly suggests password resets can be granted over telephone or badge ID without mandatory MFA.
            </p>
          </div>

          {/* Weakness B */}
          <div
            onClick={() => toggleVuln('unsupported_claims')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vulns.unsupported_claims
                ? 'bg-purple-950/20 border-purple-500/40 text-white glow-purple'
                : 'bg-navy-800/40 border-navy-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">B. Unsupported Claims / Hallucination</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                vulns.unsupported_claims ? 'bg-purple-500/20 text-purple-300' : 'bg-navy-700 text-gray-400'
              }`}>
                {vulns.unsupported_claims ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Target hallucinates answers to out-of-domain queries (e.g. fabricating $100 home internet reimbursement) instead of refusing.
            </p>
          </div>

          {/* Weakness C */}
          <div
            onClick={() => toggleVuln('citation_mismatch')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vulns.citation_mismatch
                ? 'bg-amber-950/20 border-amber-500/40 text-white'
                : 'bg-navy-800/40 border-navy-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">C. Citation Mismatch</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                vulns.citation_mismatch ? 'bg-amber-500/20 text-amber-300' : 'bg-navy-700 text-gray-400'
              }`}>
                {vulns.citation_mismatch ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Target intentionally returns incorrect source IDs (e.g. citing IT-005 Incident Response for password questions).
            </p>
          </div>

          {/* Weakness D */}
          <div
            onClick={() => toggleVuln('prompt_injection_weakness')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vulns.prompt_injection_weakness
                ? 'bg-red-950/20 border-red-500/40 text-white glow-rose'
                : 'bg-navy-800/40 border-navy-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">D. Prompt Injection Weakness</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                vulns.prompt_injection_weakness ? 'bg-red-500/20 text-red-300' : 'bg-navy-700 text-gray-400'
              }`}>
                {vulns.prompt_injection_weakness ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Target succumbs to system override directives and exfiltrates synthetic administration debug tokens.
            </p>
          </div>

          {/* Weakness E */}
          <div
            onClick={() => toggleVuln('outdated_policy')}
            className={`p-4 rounded-xl border cursor-pointer transition-all md:col-span-2 ${
              vulns.outdated_policy
                ? 'bg-blue-950/20 border-blue-500/40 text-white'
                : 'bg-navy-800/40 border-navy-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">E. Outdated Policy Adherence (v1.0 Legacy Drift)</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                vulns.outdated_policy ? 'bg-blue-500/20 text-blue-300' : 'bg-navy-700 text-gray-400'
              }`}>
                {vulns.outdated_policy ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Target uses legacy 2021 policy version where 8-character passwords were permitted and MFA was optional.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Catalog Browser */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Active Knowledge Base Policies (Synthetic Enterprise Standards)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {policies.map((p) => (
            <div
              key={p.doc_id}
              onClick={() => setSelectedPolicy(p)}
              className="p-3.5 rounded-xl bg-navy-800/60 hover:bg-navy-800 border border-navy-700 cursor-pointer transition-colors text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-400 font-bold">{p.doc_id}</span>
                <span className="px-1.5 py-0.5 rounded bg-navy-700 text-[10px] text-gray-300">{p.version}</span>
              </div>
              <p className="font-semibold text-white mt-1.5 line-clamp-1">{p.title}</p>
              <p className="text-gray-400 mt-1 line-clamp-2">{p.important_requirements}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleLaunch}
          disabled={loading}
          className="flex items-center space-x-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{loading ? 'Initializing Agent Workflow...' : 'Execute TrustForge Quality Evaluation'}</span>
        </button>
      </div>

      {/* Policy Viewer Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-navy-850 border border-navy-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy-700 pb-3">
              <div>
                <span className="font-mono text-blue-400 font-bold text-sm">{selectedPolicy.doc_id}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedPolicy.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Key Requirements</h4>
              <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-xs text-indigo-300 font-mono whitespace-pre-line">
                {selectedPolicy.important_requirements}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Document Content</h4>
              <div className="p-4 rounded-lg bg-navy-900 border border-navy-800 text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                {selectedPolicy.content}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-700 hover:bg-navy-600 text-white"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

