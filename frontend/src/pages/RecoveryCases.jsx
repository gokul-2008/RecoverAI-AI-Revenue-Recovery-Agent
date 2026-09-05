import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShieldAlert, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Zap } from 'lucide-react';
import api from '../services/api';

export default function RecoveryCases({ activeMode }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      let query = `/recovery-cases?mode=${activeMode}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (riskFilter) query += `&riskLevel=${riskFilter}`;
      if (searchTerm) query += `&q=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(query);
      setCases(res.data);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [activeMode, statusFilter, riskFilter, searchTerm]);

  const activeCount = cases.filter(c => c.status === 'active').length;
  const recoveredCount = cases.filter(c => c.status === 'recovered').length;
  const escalatedCount = cases.filter(c => c.status === 'escalated').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Recovery Cases Console</h1>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold">
              {cases.length} TOTAL CASES
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitor, inspect, and intervene on active autonomous AI revenue recovery workflows.
          </p>
        </div>
        <button
          onClick={fetchCases}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Cases</span>
        </button>
      </div>

      {/* Summary Pills Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Loaded</span>
          <span className="text-lg font-black text-slate-100">{cases.length}</span>
        </div>
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-400 uppercase">Recovered</span>
          <span className="text-lg font-black text-emerald-400">{recoveredCount}</span>
        </div>
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-bold text-cyan-400 uppercase">Active Workflows</span>
          <span className="text-lg font-black text-cyan-400">{activeCount}</span>
        </div>
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-400 uppercase">Escalated</span>
          <span className="text-lg font-black text-amber-400">{escalatedCount}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Case ID, Customer, Failure..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Filter Select Dropdowns */}
        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="recovered">Recovered</option>
            <option value="escalated">Escalated</option>
            <option value="stopped">Stopped</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            Loading recovery cases...
          </div>
        ) : cases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Case ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Failure Reason</th>
                  <th className="p-4">AI Risk & Prob</th>
                  <th className="p-4">Attempts</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/60 transition-colors group">
                    <td className="p-4 font-mono font-bold text-slate-200">{c.caseId}</td>
                    <td className="p-4 font-medium text-slate-300">
                      <div className="font-bold text-slate-100">{c.customerId?.name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.customerId?.email}</div>
                    </td>
                    <td className="p-4 font-black text-slate-100 text-sm">
                      ₹{c.amountAtRisk?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                      {c.failureReason || 'Payment failed'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                        c.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        c.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {c.riskLevel} ({((c.recoveryProbability || 0) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {c.attempts} / {c.maxAttempts}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        c.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        c.status === 'active' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        c.status === 'escalated' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {c.status === 'recovered' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {c.status === 'escalated' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {c.status === 'stopped' && <XCircle className="w-3 h-3 text-rose-400" />}
                        <span>{c.status?.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/cases/${c.caseId}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 rounded-xl font-bold transition-all text-xs"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            No recovery cases match the selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}

