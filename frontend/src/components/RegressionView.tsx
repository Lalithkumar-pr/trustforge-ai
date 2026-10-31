'use client';
import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, CheckCircle2, AlertOctagon, ShieldCheck, History, Filter } from 'lucide-react';
import { fetchRegressionTests } from '@/lib/api';
import { RegressionTestItem } from '@/types/api';

export default function RegressionView() {
  const [tests, setTests] = useState<RegressionTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const loadRegs = async () => {
    setLoading(true);
    try {
      const data = await fetchRegressionTests();
      setTests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegs();
  }, []);

  const filtered = tests.filter(t => {
    if (filter === 'ACTIVE') return t.status === 'ACTIVE';
    if (filter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  const activeCount = tests.filter(t => t.status === 'ACTIVE').length;
  const resolvedCount = tests.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-xl">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Continuous Quality Assurance</span>
          <h1 className="text-xl font-bold text-white mt-0.5">Automated Regression Test Suite</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Every discovered failure is automatically converted into a persistent regression test case to prevent quality regressions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadRegs}
            className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-gray-300"
            title="Refresh regression suite"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700">
          <span className="text-xs font-semibold text-gray-400 uppercase">Total Regression Tests</span>
          <div className="text-3xl font-extrabold text-white mt-1">{tests.length}</div>
          <p className="text-[11px] text-gray-500 mt-1">Accumulated across evaluations</p>
        </div>

        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700">
          <span className="text-xs font-semibold text-rose-400 uppercase">Active / Unresolved</span>
          <div className="text-3xl font-extrabold text-rose-400 mt-1">{activeCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Requires target remediation</p>
        </div>

        <div className="p-5 rounded-2xl bg-navy-850 border border-navy-700">
          <span className="text-xs font-semibold text-emerald-400 uppercase">Resolved In Subsequent Runs</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{resolvedCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Fixed and verified compliant</p>
        </div>
      </div>

      {/* Regression Tests Table */}
      <div className="p-6 rounded-2xl bg-navy-850 border border-navy-700 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Regression Dataset ({filtered.length} Cases)
          </h2>

          <div className="flex items-center space-x-1.5 text-xs bg-navy-900 p-1 rounded-xl border border-navy-800">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium ${
                filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({tests.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-medium ${
                filter === 'ACTIVE' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-3 py-1 rounded-lg font-medium ${
                filter === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-navy-900/40 rounded-xl border border-dashed border-navy-700">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-semibold">No regressions recorded.</p>
            <p className="text-xs text-gray-500 mt-1">
              When an evaluation discovers a policy violation or security weakness, it is automatically cataloged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-gray-400 uppercase bg-navy-800/80 border-b border-navy-700">
                <tr>
                  <th className="px-3 py-2.5">Test ID</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Prompt</th>
                  <th className="px-3 py-2.5">Expected Behavior</th>
                  <th className="px-3 py-2.5">Severity</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Orig. Eval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60 text-gray-300">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-navy-800/40">
                    <td className="px-3 py-3 font-mono font-bold text-blue-400">{t.test_id}</td>
                    <td className="px-3 py-3 font-semibold uppercase text-gray-400 text-[10px]">{t.category}</td>
                    <td className="px-3 py-3 font-mono text-gray-200 max-w-xs truncate">{t.prompt}</td>
                    <td className="px-3 py-3 text-gray-400 max-w-xs truncate">{t.expected_behavior}</td>
                    <td className="px-3 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        t.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        t.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-500 text-[11px]">
                      {t.original_evaluation_id.slice(0, 8)}...
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

