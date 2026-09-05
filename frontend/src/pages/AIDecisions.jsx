import React, { useState, useEffect } from 'react';
import { BrainCircuit, RefreshCw, Terminal, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function AIDecisions({ activeMode }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recovery-cases?mode=${activeMode || 'all'}`);
      setCases(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [activeMode]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">AI DECISION ENGINE</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>GEMINI RECOVERY AGENT</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Transparent reasoning and structured diagnostic output behind every autonomous recovery decision.</p>
        </div>
        <button
          onClick={fetchCases}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Decisions</span>
        </button>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm glass-panel rounded-3xl">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            Loading AI decision outputs...
          </div>
        ) : cases.length > 0 ? (
          cases.map((c) => (
            <div key={c._id} className="glass-panel glass-panel-interactive p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-base text-slate-100">{c.caseId}</span>
                      <span className="text-xs text-slate-400 font-mono">({c.customerId?.name || 'Customer'})</span>
                    </div>
                    <p className="text-xs text-slate-400">Transaction Amount: <strong className="text-slate-200">₹{c.amountAtRisk?.toLocaleString('en-IN')}</strong></p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono ${
                    c.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    c.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    RISK: {c.riskLevel} ({((c.recoveryProbability || 0) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Summary Decision Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Diagnosed Root Cause</span>
                  <span className="font-mono font-bold text-cyan-400 block mt-0.5">{c.rootCause || 'AUTHENTICATION_FAILED'}</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Action</span>
                  <span className="font-mono font-bold text-amber-400 block mt-0.5">{c.recommendedAction || 'CREATE_PAYMENT_LINK'}</span>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Policy Decision</span>
                  <span className="font-mono font-bold text-emerald-400 block mt-0.5 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
                  </span>
                </div>
              </div>

              {/* JSON Payload Inspector */}
              <div className="p-4 bg-slate-950 font-mono text-xs text-cyan-300 rounded-2xl border border-slate-800/90 overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 pb-2 border-b border-slate-900 font-semibold">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Structured Decision JSON Payload</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Provider: {c.aiProvider || 'RULE_BASED'}</span>
                </div>
                <pre className="leading-relaxed">{JSON.stringify({
                  caseId: c.caseId,
                  riskLevel: c.riskLevel,
                  recoveryProbability: c.recoveryProbability,
                  rootCause: c.rootCause,
                  recommendedAction: c.recommendedAction,
                  maxAttempts: c.maxAttempts,
                  amountAtRisk: c.amountAtRisk,
                  failureReason: c.failureReason,
                  aiProvider: c.aiProvider || 'RULE_BASED'
                }, null, 2)}</pre>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs glass-panel rounded-3xl">
            No AI decision payloads logged yet. Run a recovery scenario to generate diagnostic data.
          </div>
        )}
      </div>
    </div>
  );
}

