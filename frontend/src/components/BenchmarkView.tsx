'use client';
import React, { useEffect, useState } from 'react';
import { Play, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Activity, BarChart, Target, AlertCircle } from 'lucide-react';
import { runBenchmarkSuite, fetchBenchmarkResults } from '@/lib/api';
import { ValidationReport } from '@/types/api';

export default function BenchmarkView() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBenchmark = async () => {
    setLoading(true);
    try {
      const data = await fetchBenchmarkResults();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const data = await runBenchmarkSuite();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenchmark();
  }, []);

  const m = report?.metrics;
  const cm = report?.confusion_matrix;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-850 via-indigo-950/30 to-navy-850 border border-indigo-500/30 shadow-xl">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Empirical Validation & Benchmark Suite (Section 15)
          </span>
          <h1 className="text-xl font-bold text-white mt-0.5">Evaluator Quantitative Performance Benchmarking</h1>
          <p className="text-xs text-gray-300 mt-0.5 max-w-2xl">
            Executes the 8 mandatory test cases defined in the project specification to empirically measure precision,
            recall, false-positive rate, grounding accuracy, risk coverage, and response latency.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex-shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{loading ? 'Running Benchmark...' : 'Execute 8-Test Benchmark'}</span>
        </button>
      </div>

      {loading && !report && (
        <div className="p-12 text-center text-gray-400 bg-navy-850 rounded-2xl border border-navy-700">
          <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin mb-3" />
          <p className="text-sm font-semibold">Executing 8 validation scenarios...</p>
        </div>
      )}

      {report && (
        <>
          {/* Quantitative Performance Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            {/* Precision */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Precision</span>
              <div className="text-2xl font-extrabold text-blue-400 mt-1">{m?.precision_percent}%</div>
              <span className="text-[10px] text-gray-500">True Pos / Positives</span>
            </div>

            {/* Recall */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Recall</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{m?.recall_percent}%</div>
              <span className="text-[10px] text-gray-500">Sensitivity / Capture</span>
            </div>

            {/* False Positive Rate */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">False Pos. Rate</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">{m?.false_positive_rate_percent}%</div>
              <span className="text-[10px] text-gray-500">Spurious alarms</span>
            </div>

            {/* Grounding Accuracy */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Grounding Acc.</span>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1">{m?.grounding_classification_accuracy_percent}%</div>
              <span className="text-[10px] text-gray-500">Source alignment</span>
            </div>

            {/* Test Pass Rate */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Pass Rate</span>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">{m?.test_pass_rate_percent}%</div>
              <span className="text-[10px] text-gray-500">Benchmark pass</span>
            </div>

            {/* Risk Coverage */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Risk Coverage</span>
              <div className="text-2xl font-extrabold text-indigo-400 mt-1">{m?.risk_coverage_percent}%</div>
              <span className="text-[10px] text-gray-500">6 core categories</span>
            </div>

            {/* Avg Latency */}
            <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Avg Latency</span>
              <div className="text-2xl font-extrabold text-white mt-1">{m?.average_latency_ms}ms</div>
              <span className="text-[10px] text-gray-500">Per execution</span>
            </div>
          </div>

          {/* Confusion Matrix Card */}
          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Evaluator Confusion Matrix (Failure Detection Classification)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-navy-900 border border-emerald-500/30">
                <span className="text-gray-400 font-semibold text-[11px]">True Positives (TP)</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">{cm?.true_positives}</div>
                <p className="text-[10px] text-gray-500 mt-0.5">Vulnerabilities correctly detected</p>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-900 border border-amber-500/30">
                <span className="text-gray-400 font-semibold text-[11px]">False Positives (FP)</span>
                <div className="text-xl font-bold text-amber-400 mt-1">{cm?.false_positives}</div>
                <p className="text-[10px] text-gray-500 mt-0.5">Benign responses incorrectly flagged</p>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-900 border border-rose-500/30">
                <span className="text-gray-400 font-semibold text-[11px]">False Negatives (FN)</span>
                <div className="text-xl font-bold text-rose-400 mt-1">{cm?.false_negatives}</div>
                <p className="text-[10px] text-gray-500 mt-0.5">Missed policy/security violations</p>
              </div>

              <div className="p-3.5 rounded-xl bg-navy-900 border border-blue-500/30">
                <span className="text-gray-400 font-semibold text-[11px]">True Negatives (TN)</span>
                <div className="text-xl font-bold text-blue-400 mt-1">{cm?.true_negatives}</div>
                <p className="text-[10px] text-gray-500 mt-0.5">Benign responses verified clean</p>
              </div>
            </div>
          </div>

          {/* The 8 Specific Benchmark Test Cases Table */}
          <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Mandatory Section 15 Workflow Test Cases
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  End-to-end results for TEST 1 through TEST 8.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {report.successful_validations} / {report.total_tests} Passed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-semibold text-gray-400 uppercase bg-navy-800/80 border-b border-navy-700">
                  <tr>
                    <th className="px-3 py-2.5">Test Scenario</th>
                    <th className="px-3 py-2.5">Expected Behavior</th>
                    <th className="px-3 py-2.5">Actual Status</th>
                    <th className="px-3 py-2.5">Latency</th>
                    <th className="px-3 py-2.5">Detailed Verification Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/60 text-gray-300">
                  {report.test_cases.map((t, idx) => (
                    <tr key={idx} className="hover:bg-navy-800/40">
                      <td className="px-3 py-3 font-semibold text-white">{t.test_name}</td>
                      <td className="px-3 py-3 text-gray-400">{t.expected}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {t.actual_status}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-400">{t.latency_ms}ms</td>
                      <td className="px-3 py-3 text-gray-300 max-w-sm leading-relaxed">{t.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Identified Limitations Card */}
          <div className="p-6 rounded-2xl bg-navy-850 border border-amber-500/30 shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Identified Scientific & Engineering Limitations</h2>
            </div>
            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1.5 pl-1 leading-relaxed">
              {report.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

