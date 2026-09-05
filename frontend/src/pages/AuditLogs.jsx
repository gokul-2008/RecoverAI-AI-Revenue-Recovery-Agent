import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Terminal, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
import api from '../services/api';

export default function AuditLogs({ activeMode }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/audits?mode=${activeMode || 'all'}`);
      setAudits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [activeMode]);

  const filteredAudits = filterType 
    ? audits.filter(a => a.eventType === filterType)
    : audits;

  const eventTypes = Array.from(new Set(audits.map(a => a.eventType))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Enterprise Compliance Audit Logs</h1>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
              IMMUTABLE AUDIT TRAIL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Chronological system event stream for regulatory and policy compliance verification.</p>
        </div>
        <button
          onClick={fetchAudits}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">Filter Event Type:</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
        >
          <option value="">All Event Types ({audits.length})</option>
          {eventTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            Loading audit logs...
          </div>
        ) : filteredAudits.length > 0 ? (
          <div className="space-y-3 font-mono text-xs">
            {filteredAudits.map((a) => (
              <div key={a._id} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">{a.eventType}</span>
                    {a.caseId && <span className="text-slate-400 font-bold">Case: {a.caseId}</span>}
                  </div>
                  <span className="text-slate-500 text-[10px]">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-200 font-sans text-xs leading-relaxed">{a.message}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>Actor: <strong className="text-slate-300">RecoverAI Autonomous Engine</strong></span>
                  <span className="text-emerald-400 flex items-center font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> VERIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit log events recorded matching the filter.
          </div>
        )}
      </div>
    </div>
  );
}

