'use client';
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitCompare,
  UserCheck,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  createEvaluation,
  fetchEvaluationDetail,
  fetchEvaluationReport,
  postAdaptation,
  postHumanApproval,
  fetchPolicies,
  fetchRegressionTests
} from '@/lib/api';
import { TargetConfig } from './TargetLabView';

interface EvaluatorViewProps {
  targetConfig: TargetConfig;
  initialEvaluationId?: string;
  onNavigateToTargetLab: () => void;
}

const FRIENDLY_STAGES = [
  { id: 'policies', title: '1. Understanding application policies', backendStage: 'INITIALIZING' },
  { id: 'risks', title: '2. Identifying potential risks', backendStage: 'RISK_ANALYSIS' },
  { id: 'scenarios', title: '3. Generating test scenarios', backendStage: 'TEST_GENERATION' },
  { id: 'testing', title: '4. Testing the application', backendStage: 'EXECUTION' },
  { id: 'verifying', title: '5. Verifying responses', backendStage: 'VERIFICATION' },
  { id: 'report', title: '6. Preparing evaluation report', backendStage: 'SCORING_AND_RELEASE' },
];

export default function EvaluatorView({
  targetConfig,
  initialEvaluationId,
  onNavigateToTargetLab,
}: EvaluatorViewProps) {
  // Evaluation Lifecycle Mode: 'configure' | 'live' | 'report'
  const [mode, setMode] = useState<'configure' | 'live' | 'report'>(
    initialEvaluationId ? 'report' : 'configure'
  );
  const [evaluationId, setEvaluationId] = useState<string>(initialEvaluationId || '');

  // Step 2 Configuration State
  const [evalName, setEvalName] = useState('Enterprise IT Helpdesk Compliance & Security Audit');
  const [evalObjective, setEvalObjective] = useState('Grounding, Security, and Incident Readiness');
  const [testingDepth, setTestingDepth] = useState<'Standard' | 'Comprehensive'>('Standard');
  const [includeAdversarial, setIncludeAdversarial] = useState(true);
  const [includeRegression, setIncludeRegression] = useState(true);
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<{ [id: string]: boolean }>({});
  const [activeRegressions, setActiveRegressions] = useState<any[]>([]);

  // Step 4 Live Polling State
  const [liveDetail, setLiveDetail] = useState<any | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Step 5 & 6 Report State
  const [reportData, setReportData] = useState<any | null>(null);
  const [findingsFilter, setFindingsFilter] = useState<'ALL' | 'FAIL' | 'CRITICAL' | 'PASS'>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<{ [id: string]: boolean }>({});

  // Step 7 Policy Adaptation State
  const [showAdaptationDrawer, setShowAdaptationDrawer] = useState(false);
  const [adaptDocId, setAdaptDocId] = useState('IT-001');
  const [adaptTitle, setAdaptTitle] = useState('Enterprise Password Reset Policy (Zero-Trust Revision)');
  const [adaptVersion, setAdaptVersion] = useState('v3.0-ADAPTED');
  const [adaptContent, setAdaptContent] = useState('');
  const [adaptRequirements, setAdaptRequirements] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<any | null>(null);

  // Step 8 Human Review State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('Lead Quality & Security Auditor');
  const [humanDecision, setHumanDecision] = useState<'APPROVED' | 'CONDITIONAL' | 'REJECTED'>('CONDITIONAL');
  const [humanComments, setHumanComments] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies().then((pols) => {
      setPolicies(pols);
      const sel: { [id: string]: boolean } = {};
      pols.forEach((p) => (sel[p.doc_id] = true));
      setSelectedPolicies(sel);
    }).catch(console.error);

    fetchRegressionTests().then((regs) => {
      setActiveRegressions(regs.filter((r) => r.status === 'ACTIVE'));
    }).catch(console.error);
  }, []);

  // Handle Initial Evaluation ID if provided
  useEffect(() => {
    if (initialEvaluationId) {
      setEvaluationId(initialEvaluationId);
      loadReport(initialEvaluationId);
    }
  }, [initialEvaluationId]);

  // Polling loop for Step 4 Live Execution
  useEffect(() => {
    if (mode !== 'live' || !evaluationId) return;

    const interval = setInterval(async () => {
      try {
        const detail = await fetchEvaluationDetail(evaluationId);
        setLiveDetail(detail);

        if (detail.status === 'COMPLETED' || detail.status === 'FAILED') {
          clearInterval(interval);
          loadReport(evaluationId);
        }
      } catch (err) {
        console.error('Error polling evaluation status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mode, evaluationId]);

  const loadReport = async (id: string) => {
    try {
      const report = await fetchEvaluationReport(id);
      setReportData(report);
      setMode('report');
    } catch (e) {
      console.error('Failed to load full report:', e);
    }
  };

  const handleStartEvaluation = async () => {
    setIsStarting(true);
    try {
      const res = await createEvaluation({
        name: evalName,
        target_config: targetConfig,
      });
      setEvaluationId(res.id);
      setMode('live');
    } catch (err: any) {
      alert(`Error starting evaluation: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleLoadDemoAdaptation = () => {
    setAdaptDocId('IT-001');
    setAdaptTitle('Enterprise Password Reset Policy (Zero-Trust Revision)');
    setAdaptVersion('v3.0-ADAPTED');
    setAdaptContent(
      '1. Zero-Trust Identity Verification: Mandatory physical smartcard tap or WebAuthn biometric passkey is strictly required for all password reset procedures. Software TOTPs and SMS are permanently deprecated.\n' +
      '2. In-Person Identity Verification: Any remote or helpdesk password reset strictly requires a live encrypted video call with government photo ID inspection verified against employee HR biometric records.\n' +
      '3. Instant Session Revocation: Password resets immediately terminate all active VPN, cloud, email, and single sign-on tokens across all endpoints within 3 seconds.\n' +
      '4. Strict Compliance: Any agent or system authorizing a reset without both WebAuthn hardware proof and HR biometric verification is immediately locked for security inspection.'
    );
    setAdaptRequirements(
      '- WebAuthn biometric passkey or physical smartcard MANDATORY.\n' +
      '- In-person or live video photo ID verification required for all resets.\n' +
      '- Zero exceptions permitted for any employee level.'
    );
  };

  const handleExecuteAdaptation = async () => {
    if (!adaptContent || isAdapting) return;
    setIsAdapting(true);
    try {
      const result = await postAdaptation(evaluationId, {
        doc_id: adaptDocId,
        title: adaptTitle,
        version: adaptVersion,
        new_policy_content: adaptContent,
        important_requirements: adaptRequirements,
      });
      setAdaptationResult(result);
      await loadReport(evaluationId);
    } catch (err: any) {
      alert(`Adaptation error: ${err.message}`);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleRecordHumanApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || submittingApproval) return;
    setSubmittingApproval(true);
    try {
      const res = await postHumanApproval(evaluationId, {
        decision: humanDecision,
        reviewer: `${reviewerName.trim()} (${reviewerRole})`,
        comments: humanComments.trim() || 'Official quality & security governance review recorded.',
      });
      setApprovalMessage(res.message);
      await loadReport(evaluationId);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const getStageIndex = (stageName?: string) => {
    if (!stageName) return 0;
    if (stageName === 'INITIALIZING') return 0;
    if (stageName === 'RISK_ANALYSIS') return 1;
    if (stageName === 'TEST_GENERATION') return 2;
    if (stageName === 'EXECUTION') return 3;
    if (stageName === 'VERIFICATION') return 4;
    if (stageName === 'SCORING_AND_RELEASE' || stageName === 'COMPLETED') return 5;
    return 0;
  };

  const activeVulnerabilitiesCount = Object.values(targetConfig).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-border shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-light px-2 py-0.5 rounded border border-secondary/20">
              Product B
            </span>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">TrustForge Evaluator</h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Independent Agentic Quality Engineering platform: dynamic test generation, independent verification, 7-dimension scoring, and release gates.
          </p>
        </div>

        {mode !== 'configure' && (
          <button
            onClick={() => {
              setMode('configure');
              setLiveDetail(null);
              setReportData(null);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-secondary text-text-primary text-xs font-semibold border border-border shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Configure New Evaluation</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* STEP 1 & 2: SETUP & CONFIGURE EVALUATION */}
      {/* ========================================================= */}
      {mode === 'configure' && (
        <div className="space-y-6">
          {/* STEP 1: SELECT TARGET APPLICATION */}
          <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-sm font-bold text-text-primary">Target Application Under Test</h2>
              </div>
              <button
                onClick={onNavigateToTargetLab}
                className="text-xs text-primary hover:underline flex items-center space-x-1 font-medium"
              >
                <span>Edit in Target Lab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-3.5 rounded-lg bg-surface-subtle border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Enterprise IT Helpdesk AI</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Tier-1 enterprise support application handling password resets, MFA, VPN setup, and security incident response.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider">Vulnerability Profile</span>
                <p className="text-base font-bold text-status-warning-text">
                  {activeVulnerabilitiesCount > 0 ? `${activeVulnerabilitiesCount} Weaknesses Active` : 'Clean Baseline'}
                </p>
                <p className="text-[11px] text-text-secondary">
                  {activeVulnerabilitiesCount > 0
                    ? Object.entries(targetConfig).filter(([_, v]) => v).map(([k]) => k.replace('_', ' ')).join(', ')
                    : 'All safeguards active'}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: CONFIGURE EVALUATION */}
          <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-5">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <span className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-sm font-bold text-text-primary">Configure Quality Evaluation</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Evaluation Title</label>
                <input
                  type="text"
                  value={evalName}
                  onChange={(e) => setEvalName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Evaluation Objectives</label>
                <input
                  type="text"
                  value={evalObjective}
                  onChange={(e) => setEvalObjective(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Testing Depth</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestingDepth('Standard')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${testingDepth === 'Standard'
                        ? 'bg-primary-light border-primary/40 text-primary-accent shadow-sm'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
                      }`}
                  >
                    Standard (Core Scenarios)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestingDepth('Comprehensive')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${testingDepth === 'Comprehensive'
                        ? 'bg-primary-light border-primary/40 text-primary-accent shadow-sm'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
                      }`}
                  >
                    Comprehensive (Full Vectors)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-text-secondary font-medium">Testing Dimensions & Scopes</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 p-2 bg-surface-subtle rounded-lg border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAdversarial}
                      onChange={(e) => setIncludeAdversarial(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    <span className="text-text-primary text-xs">Adversarial Testing</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-surface-subtle rounded-lg border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRegression}
                      onChange={(e) => setIncludeRegression(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    <span className="text-text-primary text-xs">Include Regressions ({activeRegressions.length})</span>
                  </label>
                </div>
              </div>

              {/* Policy Scope */}
              <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-border">
                <label className="block text-text-secondary font-medium">Relevant Policies to Audit ({policies.length})</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {policies.map((p) => (
                    <label
                      key={p.doc_id}
                      className="flex items-center space-x-2 p-2 bg-surface-subtle rounded-lg border border-border text-xs text-text-primary cursor-pointer hover:border-border-strong transition"
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedPolicies[p.doc_id]}
                        onChange={(e) =>
                          setSelectedPolicies((prev) => ({
                            ...prev,
                            [p.doc_id]: e.target.checked,
                          }))
                        }
                        className="rounded text-primary focus:ring-0"
                      />
                      <span className="font-mono text-primary font-semibold">{p.doc_id}</span>
                      <span className="truncate text-text-secondary text-[11px]">{p.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={handleStartEvaluation}
                disabled={isStarting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isStarting ? 'Initializing Evaluation...' : 'Run Quality Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: LIVE EXECUTION PROGRESS */}
      {/* ========================================================= */}
      {mode === 'live' && (
        <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <span className="text-xs font-mono text-secondary font-semibold uppercase">Step 4: Live Execution</span>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">{evalName}</h2>
              <p className="text-xs text-text-muted">Execution ID: <span className="font-mono text-text-secondary">{evaluationId}</span></p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <span className="text-xs font-semibold text-primary">
                {liveDetail?.current_stage || 'INITIALIZING'} ({liveDetail?.progress || 0}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-medium">Overall Progress</span>
              <span className="font-mono font-bold text-text-primary tabular-nums">{liveDetail?.progress || 0}%</span>
            </div>
            <div className="w-full bg-surface-secondary rounded-full h-2.5 border border-border overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${liveDetail?.progress || 5}%` }}
              />
            </div>
          </div>

          {/* 6 User-Friendly Stages */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Evaluation Lifecycle Stages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FRIENDLY_STAGES.map((stg, sIdx) => {
                const currentIdx = getStageIndex(liveDetail?.current_stage);
                const isPassed = sIdx < currentIdx || liveDetail?.status === 'COMPLETED';
                const isCurrent = sIdx === currentIdx && liveDetail?.status !== 'COMPLETED';

                return (
                  <div
                    key={stg.id}
                    className={`p-3.5 rounded-lg border flex items-center space-x-3 transition ${isCurrent
                        ? 'bg-primary-light border-primary/40 text-primary-accent shadow-sm'
                        : isPassed
                          ? 'bg-status-success-bg/40 border-status-success-text/30 text-text-primary'
                          : 'bg-surface-subtle border-border text-text-muted'
                      }`}
                  >
                    <div className="flex-shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-status-success-text" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border-strong" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{stg.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Expandable Technical Details */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center space-x-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              {showTechnicalDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span>Inspect Technical Details</span>
            </button>

            {showTechnicalDetails && liveDetail && (
              <div className="mt-3 p-3 bg-surface-subtle rounded-lg border border-border font-mono text-[11px] text-text-secondary space-y-1">
                <div>Status: {liveDetail.status}</div>
                <div>Stage: {liveDetail.current_stage}</div>
                <div>Risks Identified: {liveDetail.risk_count || 0}</div>
                <div>Tests Synthesized: {liveDetail.test_count || 0}</div>
                <div>Tests Completed: {(liveDetail.passed_count || 0) + (liveDetail.failed_count || 0)}</div>
                <div>Summary: {liveDetail.summary}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEPS 5, 6, 7, 8: EVALUATION REPORT, FINDINGS & ACTIONS */}
      {/* ========================================================= */}
      {mode === 'report' && reportData && (
        <div className="space-y-6">
          {/* STEP 6: EVALUATION REPORT SUMMARY */}
          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs font-mono text-status-success-text font-semibold uppercase">Step 6: Evaluation Report</span>
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Quality Audit Findings & Score</h2>
                <p className="text-xs text-text-secondary">
                  Target: <span className="text-text-primary font-medium">Enterprise IT Helpdesk AI</span> | Completed at: {reportData.evaluation.updated_at || 'Just now'}
                </p>
              </div>

              {/* Action Buttons: Adapt Policy & Start New */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAdaptationDrawer(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-[#6855A3] text-white text-xs font-semibold shadow-sm transition"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Update Policy & Re-evaluate</span>
                </button>
              </div>
            </div>

            {/* Score & Release Recommendation Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Overall Score */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Overall Quality Score</span>
                <span className={`text-4xl font-extrabold tabular-nums ${(reportData.evaluation.scores?.composite_score || 0) >= 90
                    ? 'text-status-success-text'
                    : (reportData.evaluation.scores?.composite_score || 0) >= 75
                      ? 'text-status-warning-text'
                      : 'text-status-error-text'
                  }`}>
                  {reportData.evaluation.scores?.composite_score?.toFixed(1) || 0}%
                </span>
                <span className="text-[11px] text-text-muted">7-Dimension Weighted</span>
              </div>

              {/* Release Recommendation */}
              <div className="md:col-span-2 p-4 rounded-xl bg-surface-subtle border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Automated Release Gate</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${reportData.evaluation.release_recommendation?.decision === 'RELEASE'
                      ? 'bg-status-success-bg text-status-success-text border border-status-success-text/20'
                      : reportData.evaluation.release_recommendation?.decision === 'CONDITIONAL RELEASE'
                        ? 'bg-status-warning-bg text-status-warning-text border border-status-warning-text/20'
                        : 'bg-status-error-bg text-status-error-text border border-status-error-text/20'
                    }`}>
                    {reportData.evaluation.release_recommendation?.decision || 'REJECT'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {reportData.evaluation.release_recommendation?.summary || reportData.evaluation.summary}
                </p>
                <div className="text-[11px] text-text-muted flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-status-warning-text" />
                  <span>Advisory only: Requires authorized human sign-off below.</span>
                </div>
              </div>

              {/* Test Counts */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border flex flex-col justify-between text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Tests Executed:</span>
                  <span className="font-bold text-text-primary tabular-nums">{reportData.test_cases?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tests Passed:</span>
                  <span className="font-bold text-status-success-text tabular-nums">
                    {reportData.findings?.filter((f: any) => f.status === 'PASS').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tests Failed:</span>
                  <span className="font-bold text-status-error-text tabular-nums">
                    {reportData.findings?.filter((f: any) => f.status !== 'PASS').length || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-text-muted">Critical Issues:</span>
                  <span className="font-bold text-status-warning-text tabular-nums">
                    {reportData.evaluation.release_recommendation?.critical_failures || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Dimensions Breakdown */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">7 Evaluated Quality Dimensions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                {[
                  { label: 'Accuracy', weight: '20%', score: reportData.evaluation.scores?.accuracy },
                  { label: 'Groundedness', weight: '20%', score: reportData.evaluation.scores?.groundedness },
                  { label: 'Safety', weight: '15%', score: reportData.evaluation.scores?.safety },
                  { label: 'Security', weight: '15%', score: reportData.evaluation.scores?.security },
                  { label: 'Completeness', weight: '10%', score: reportData.evaluation.scores?.completeness },
                  { label: 'Consistency', weight: '10%', score: reportData.evaluation.scores?.consistency },
                  { label: 'Citation Validity', weight: '10%', score: reportData.evaluation.scores?.citation_validity },
                ].map((dim) => (
                  <div key={dim.label} className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block font-medium">{dim.label} ({dim.weight})</span>
                    <span className={`text-base font-bold tabular-nums ${(dim.score || 0) >= 90
                        ? 'text-status-success-text'
                        : (dim.score || 0) >= 70
                          ? 'text-status-warning-text'
                          : 'text-status-error-text'
                      }`}>
                      {dim.score?.toFixed(0) || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 5: FINDINGS & EMPIRICAL EVIDENCE */}
          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono text-primary font-semibold uppercase">Step 5: Findings</span>
                <h3 className="text-base font-bold text-text-primary">Discovered Failures & Supporting Evidence</h3>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-text-muted" />
                {(['ALL', 'CRITICAL', 'FAIL', 'PASS'] as const).map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setFindingsFilter(flt)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${findingsFilter === flt
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border'
                      }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {reportData.findings
                ?.filter((f: any) => {
                  if (findingsFilter === 'FAIL') return f.status !== 'PASS';
                  if (findingsFilter === 'PASS') return f.status === 'PASS';
                  if (findingsFilter === 'CRITICAL') return f.severity === 'critical';
                  return true;
                })
                .map((finding: any) => {
                  const testCase = reportData.test_cases?.find((tc: any) => tc.test_id === finding.test_id);
                  const execResult = reportData.execution_results?.find((er: any) => er.test_id === finding.test_id);
                  const isExpanded = !!expandedFindings[finding.test_id];

                  return (
                    <div
                      key={finding.test_id}
                      className={`p-4 rounded-xl border shadow-sm transition ${finding.status === 'PASS'
                          ? 'bg-surface-subtle border-border'
                          : finding.severity === 'critical'
                            ? 'bg-status-error-bg/30 border-[#F5C2C2]'
                            : 'bg-status-warning-bg/30 border-[#F2D7A5]'
                        }`}
                    >
                      <div
                        onClick={() =>
                          setExpandedFindings((prev) => ({
                            ...prev,
                            [finding.test_id]: !prev[finding.test_id],
                          }))
                        }
                        className="flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-text-primary">
                              {finding.test_id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${finding.status === 'PASS'
                                ? 'bg-status-success-bg text-status-success-text'
                                : 'bg-status-error-bg text-status-error-text'
                              }`}>
                              {finding.status}
                            </span>
                            <span className="text-[10px] text-text-muted uppercase font-semibold">
                              Severity: {finding.severity}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-text-primary">
                            {testCase?.prompt || 'User test input'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            Failure Reason: <span className="text-text-primary font-medium">{finding.judge_reasoning}</span>
                          </p>
                        </div>

                        <button className="text-text-muted hover:text-text-primary p-1">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expanded Side-by-Side Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-border space-y-3 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-surface rounded-lg border border-border space-y-1">
                              <span className="text-[10px] uppercase font-bold text-text-muted">Actual Target Response:</span>
                              <p className="text-text-primary text-xs italic">
                                "{execResult?.actual_answer || 'No response captured'}"
                              </p>
                            </div>

                            <div className="p-3 bg-surface rounded-lg border border-border space-y-1">
                              <span className="text-[10px] uppercase font-bold text-text-muted">Expected Compliant Behavior:</span>
                              <p className="text-text-primary text-xs">
                                {testCase?.expected_behavior || 'Must adhere to policy'}
                              </p>
                            </div>
                          </div>

                          {/* Supporting Policy Evidence */}
                          {finding.evidence && finding.evidence.length > 0 && (
                            <div className="p-3 bg-surface-subtle rounded-lg border border-border space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-primary">Ground-Truth Policy Evidence:</span>
                              {finding.evidence.map((ev: any, evIdx: number) => (
                                <div key={evIdx} className="text-[11px] text-text-secondary space-y-0.5">
                                  <span className="font-mono text-primary font-semibold">[{ev.source_id}]</span>
                                  <p className="italic text-text-secondary bg-surface p-2 rounded border border-border">
                                    "{ev.excerpt || ev.requirement}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* STEP 8: HUMAN REVIEW & AUTHORIZATION */}
          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-xs font-mono text-secondary font-semibold uppercase">Step 8: Human Review & Release Governance</span>
              <h3 className="text-base font-bold text-text-primary">Authorized Release Decision</h3>
              <p className="text-xs text-text-secondary mt-1">
                AI recommendations are strictly advisory. Production releases require documented human authority sign-off.
              </p>
            </div>

            {approvalMessage && (
              <div className="p-3 rounded-lg bg-status-success-bg border border-status-success-text/20 text-status-success-text text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{approvalMessage}</span>
              </div>
            )}

            <form onSubmit={handleRecordHumanApproval} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-medium mb-1">Role / Authority</label>
                  <input
                    type="text"
                    required
                    value={reviewerRole}
                    onChange={(e) => setReviewerRole(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-2">Human Release Decision</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'APPROVED', label: 'Approve Release', color: 'text-status-success-text' },
                    { val: 'CONDITIONAL', label: 'Conditional Release', color: 'text-status-warning-text' },
                    { val: 'REJECTED', label: 'Reject Release', color: 'text-status-error-text' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`p-3 rounded-lg border flex items-center space-x-2 cursor-pointer transition ${humanDecision === opt.val
                          ? 'bg-primary-light border-primary/40 text-text-primary shadow-sm'
                          : 'bg-surface border-border text-text-secondary hover:bg-surface-subtle'
                        }`}
                    >
                      <input
                        type="radio"
                        name="human_decision"
                        checked={humanDecision === opt.val}
                        onChange={() => setHumanDecision(opt.val as any)}
                        className="text-primary focus:ring-0"
                      />
                      <span className={`font-semibold ${opt.color}`}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Auditor Comments & Justification</label>
                <textarea
                  rows={2}
                  placeholder="Record mandatory rationale, mitigation stipulations, or sign-off notes..."
                  value={humanComments}
                  onChange={(e) => setHumanComments(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingApproval}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{submittingApproval ? 'Submitting...' : 'Record Human Sign-Off'}</span>
                </button>
              </div>
            </form>

            {/* Audit History Log */}
            {reportData.approvals && reportData.approvals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Recorded Sign-Off History</span>
                <div className="space-y-1.5">
                  {reportData.approvals.map((appr: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-surface-subtle rounded border border-border text-[11px] text-text-secondary flex items-center justify-between">
                      <div>
                        <span className="font-bold text-text-primary">{appr.reviewer}</span>: decision <span className="font-bold uppercase text-primary">{appr.decision}</span>
                        <p className="text-text-muted text-[10px]">"{appr.comments}"</p>
                      </div>
                      <span className="text-text-muted text-[10px]">{appr.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 7: POLICY ADAPTATION MODAL / DRAWER */}
      {/* ========================================================= */}
      {showAdaptationDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono text-secondary font-semibold uppercase">Step 7: Policy Adaptation</span>
                <h3 className="text-base font-bold text-text-primary">Update Enterprise Policy & Re-evaluate</h3>
              </div>
              <button
                onClick={() => setShowAdaptationDrawer(false)}
                className="text-text-muted hover:text-text-primary text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              When company policies update, TrustForge dynamically diffs the policy text, identifies newly affected risks, synthesizes delta test vectors, and updates release scores without discarding historical context.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleLoadDemoAdaptation}
                className="text-xs text-secondary hover:underline flex items-center space-x-1 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Zero-Trust Policy (IT-001 v3.0)</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Target Policy ID</label>
                  <input
                    type="text"
                    value={adaptDocId}
                    onChange={(e) => setAdaptDocId(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">New Version Identifier</label>
                  <input
                    type="text"
                    value={adaptVersion}
                    onChange={(e) => setAdaptVersion(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Revised Policy Content</label>
                <textarea
                  rows={5}
                  value={adaptContent}
                  onChange={(e) => setAdaptContent(e.target.value)}
                  placeholder="Paste revised policy clauses..."
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary font-sans text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Key Requirements Summary</label>
                <textarea
                  rows={2}
                  value={adaptRequirements}
                  onChange={(e) => setAdaptRequirements(e.target.value)}
                  placeholder="- Zero-trust WebAuthn mandatory&#10;- Biometric photo verification required"
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-text-primary font-sans text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {adaptationResult && (
              <div className="p-3 rounded-lg bg-surface-subtle border border-secondary/30 text-xs space-y-1">
                <span className="font-bold text-secondary">Adaptation Executed:</span>
                <p className="text-text-primary">{adaptationResult.diff_summary}</p>
                <p className="text-text-muted text-[11px]">
                  Synthesized {adaptationResult.adaptive_tests_generated} delta tests. Updated score: {adaptationResult.updated_scores?.composite_score?.toFixed(1)}%.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAdaptationDrawer(false)}
                className="px-4 py-2 rounded-lg bg-surface-secondary hover:bg-border text-text-secondary text-xs font-semibold border border-border"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteAdaptation}
                disabled={isAdapting || !adaptContent.trim()}
                className="px-5 py-2 rounded-lg bg-secondary hover:bg-[#6855A3] disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <GitCompare className="w-4 h-4" />
                <span>{isAdapting ? 'Adapting & Testing...' : 'Trigger Adaptive Re-Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
