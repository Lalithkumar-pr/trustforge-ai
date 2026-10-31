const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<any>(res);
}

export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/policies`);
  return handleResponse<any[]>(res);
}

export async function createEvaluation(payload: {
  name: string;
  target_config: any;
}) {
  const res = await fetch(`${API_BASE}/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ id: string; status: string; message: string }>(res);
}

export async function fetchEvaluations() {
  const res = await fetch(`${API_BASE}/evaluations`);
  return handleResponse<any[]>(res);
}

export async function fetchEvaluationDetail(id: string) {
  const res = await fetch(`${API_BASE}/evaluations/${id}`);
  return handleResponse<any>(res);
}

export async function fetchEvaluationReport(id: string) {
  const res = await fetch(`${API_BASE}/evaluations/${id}/report`);
  return handleResponse<any>(res);
}

export async function postAdaptation(id: string, payload: {
  doc_id: string;
  title?: string;
  version?: string;
  new_policy_content: string;
  important_requirements?: string;
}) {
  const res = await fetch(`${API_BASE}/evaluations/${id}/adapt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function postHumanApproval(id: string, payload: {
  decision: string;
  reviewer: string;
  comments: string;
}) {
  const res = await fetch(`${API_BASE}/evaluations/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function fetchRegressionTests() {
  const res = await fetch(`${API_BASE}/regression`);
  return handleResponse<any[]>(res);
}

export async function postTargetChat(payload: {
  prompt: string;
  vulnerabilities?: any;
}) {
  const res = await fetch(`${API_BASE}/target/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function runBenchmarkSuite() {
  const res = await fetch(`${API_BASE}/validation-suite/run`, {
    method: 'POST',
  });
  return handleResponse<any>(res);
}

export async function fetchBenchmarkResults() {
  const res = await fetch(`${API_BASE}/validation-suite/results`);
  return handleResponse<any>(res);
}

