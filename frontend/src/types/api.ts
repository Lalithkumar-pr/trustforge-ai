export interface TargetVulnerabilitiesConfig {
  mfa_bypass: boolean;
  unsupported_claims: boolean;
  citation_mismatch: boolean;
  prompt_injection_weakness: boolean;
  outdated_policy: boolean;
}

export interface DimensionScores {
  accuracy: number;
  groundedness: number;
  safety: number;
  security: number;
  completeness: number;
  consistency: number;
  citation_validity: number;
  composite_score: number;
}

export interface ReleaseRecommendation {
  decision: 'RELEASE' | 'CONDITIONAL RELEASE' | 'REJECT';
  composite_score: number;
  critical_failures: number;
  high_failures: number;
  remediation_conditions: string[];
  summary: string;
}

export interface RiskItem {
  risk_id: string;
  category: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source_ids: string[];
  reasoning: string;
  recommended_tests: number;
}

export interface TestCaseItem {
  test_id: string;
  risk_id?: string;
  category: string;
  prompt: string;
  expected_behavior: string;
  severity: string;
  source_ids: string[];
  generation_reason: string;
  is_regression: boolean;
}

export interface EvidenceItem {
  source_id: string;
  claim: string;
  supporting_excerpt: string;
  verification_status: 'supported' | 'contradicted' | 'ungrounded' | 'leaked';
}

export interface VerificationFindingItem {
  test_id: string;
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  failure_type?: string;
  severity: string;
  evidence: EvidenceItem[];
  judge_reasoning: string;
}

export interface ExecutionResultItem {
  test_id: string;
  raw_prompt: string;
  actual_answer: string;
  sources_cited: { source_id: string; excerpt: string }[];
  retrieved_context: { source_id: string; title: string; excerpt: string; relevance_score: number }[];
  latency_ms: number;
  status_code: number;
  tool_calls: any[];
}

export interface EvaluationSummary {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  current_stage: string;
  progress: number;
  composite_score: number;
  release_decision: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationDetail {
  id: string;
  status: string;
  current_stage: string;
  progress: number;
  target_config: TargetVulnerabilitiesConfig;
  scores: DimensionScores;
  release_recommendation: ReleaseRecommendation;
  summary: string;
  error_message?: string;
  risk_count: number;
  test_count: number;
  passed_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface EvaluationReport {
  evaluation: EvaluationDetail;
  risks: RiskItem[];
  test_cases: TestCaseItem[];
  findings: VerificationFindingItem[];
  execution_results: ExecutionResultItem[];
  approvals: {
    id: number;
    decision: string;
    reviewer: string;
    comments: string;
    previous_recommendation: string;
    timestamp: string;
  }[];
  audit_events: {
    event_type: string;
    details: any;
    timestamp: string;
  }[];
}

export interface RegressionTestItem {
  id: number;
  original_evaluation_id: string;
  test_id: string;
  category: string;
  prompt: string;
  expected_behavior: string;
  severity: string;
  previous_result: string;
  current_result: string;
  status: string;
  last_run_at: string;
  created_at: string;
}

export interface PolicyDocument {
  doc_id: string;
  title: string;
  version: string;
  last_updated: string;
  content: string;
  important_requirements: string;
}

export interface BenchmarkMetrics {
  precision_percent: number;
  recall_percent: number;
  false_positive_rate_percent: number;
  grounding_classification_accuracy_percent: number;
  test_pass_rate_percent: number;
  risk_coverage_percent: number;
  average_latency_ms: number;
}

export interface ValidationReport {
  timestamp: string;
  total_tests: number;
  successful_validations: number;
  metrics: BenchmarkMetrics;
  confusion_matrix: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
  };
  limitations: string[];
  test_cases: {
    test_name: string;
    expected: string;
    actual_status: string;
    latency_ms: number;
    reasoning: string;
    success: boolean;
  }[];
}

