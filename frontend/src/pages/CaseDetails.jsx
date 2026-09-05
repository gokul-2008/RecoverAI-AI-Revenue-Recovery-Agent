import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BrainCircuit, 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  User,
  CreditCard,
  Zap,
  DollarSign,
  Check
} from 'lucide-react';
import api from '../services/api';

export default function CaseDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const resCase = await api.get(`/recovery-cases/${id}`);
      setData(resCase.data);

      const resAudit = await api.get(`/recovery-cases/${id}/audit`);
      setTimeline(resAudit.data);
    } catch (err) {
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const handleExecuteAction = async () => {
    try {
      setActionLoading(true);
      await api.post(`/recovery-cases/${id}/execute`);
      await fetchCaseDetails();
    } catch (err) {
      console.error('Error executing action:', err);
      alert(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setActionLoading(true);
      await api.post(`/recovery-cases/${id}/escalate`);
      await fetchCaseDetails();
    } catch (err) {
      console.error('Error escalating case:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-4 max-w-sm text-center glow-cyan">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div>
            <h3 className="text-base font-bold text-slate-100">Fetching Case Diagnostics</h3>
            <p className="text-xs text-slate-400 mt-1">Loading AI reasoning, policy rules, and audit timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  const { recoveryCase, actions } = data;
  const customer = recoveryCase.customerId || {};
  const payment = recoveryCase.paymentId || {};

  // Find payment link if generated
  let paymentLinkUrl = null;
  if (recoveryCase.currentAction && recoveryCase.currentAction.includes('PAYMENT_LINK_CREATED')) {
    paymentLinkUrl = recoveryCase.currentAction.split('PAYMENT_LINK_CREATED: ')[1];
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-fade-in">
      {/* Back button & Header */}
      <div>
        <Link to="/cases" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recovery Cases</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-100 font-mono">{recoveryCase.caseId}</h1>
                <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-extrabold ${
                  recoveryCase.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  recoveryCase.status === 'active' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                  recoveryCase.status === 'escalated' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {recoveryCase.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Customer: <strong className="text-slate-200">{customer.name}</strong> ({customer.email}) • Created {new Date(recoveryCase.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {recoveryCase.status === 'active' && (
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{actionLoading ? 'Executing...' : 'Execute Recovery Action'}</span>
              </button>
              <button
                onClick={handleEscalate}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Escalate to Merchant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Revenue At Risk + Customer History + Recovery Attempts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>Revenue At Risk</span>
          </div>
          <span className="text-3xl font-black text-slate-100 block">
            ₹{recoveryCase.amountAtRisk?.toLocaleString('en-IN')}
          </span>
          <p className="text-xs text-slate-400">Payment method: <span className="font-mono text-cyan-300">{payment.method || 'UPI/Card'}</span></p>
        </div>

        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Customer Behavior Profile</span>
          </div>
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Successful Payments:</span>
              <span className="text-emerald-400 font-black">{customer.totalSuccessfulPayments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Failed Payments:</span>
              <span className="text-rose-400 font-black">{customer.totalFailedPayments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Customer Risk Score:</span>
              <span className="text-amber-400 font-black">{customer.customerRiskScore || 0} / 100</span>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>Recovery Attempt Ceiling</span>
          </div>
          <span className="text-3xl font-black text-slate-100 block">
            {recoveryCase.attempts} <span className="text-slate-500 text-lg font-medium">/ {recoveryCase.maxAttempts}</span>
          </span>
          <p className="text-xs text-slate-400">Maximum policy ceiling: 2 attempts enforced</p>
        </div>
      </div>

      {/* Payment Link Card if available */}
      {paymentLinkUrl && (
        <div className="glass-panel glass-panel-cyan rounded-3xl p-6 border border-cyan-500/40 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/40">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold uppercase">
                TEST MODE PAYMENT CHECKOUT READY
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-1">Razorpay Payment Link Generated</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">{paymentLinkUrl}</p>
            </div>
          </div>
          <a
            href={paymentLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <span>Open Sandbox Checkout</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* AI DIAGNOSIS & POLICY ENGINE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: "Why did AI choose this?" */}
        <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30">
          <div className="flex items-center space-x-3 mb-5 border-b border-slate-800/80 pb-4">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-2xl">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Why did AI choose this action?</h2>
              <p className="text-xs text-slate-400">Gemini Autonomous Recovery Agent Diagnostic Reasoning</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Classification</span>
                <span className={`text-sm font-extrabold inline-block mt-1 ${
                  recoveryCase.riskLevel === 'LOW' ? 'text-emerald-400' :
                  recoveryCase.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {recoveryCase.riskLevel}
                </span>
              </div>
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery Probability</span>
                <span className="text-sm font-extrabold text-cyan-400 inline-block mt-1">
                  {((recoveryCase.recoveryProbability || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnosed Root Cause</span>
              <span className="text-xs font-mono font-bold text-cyan-300 inline-block mt-1">
                {recoveryCase.rootCause}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Action</span>
              <span className="text-xs font-mono font-bold text-amber-400 inline-block mt-1">
                {recoveryCase.recommendedAction}
              </span>
            </div>

            {/* Historical context explanation list */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/80 text-xs space-y-2">
              <span className="font-bold text-slate-200 block">Diagnostic Reasoning & Key Factors:</span>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Customer has <strong className="text-slate-200">{customer.totalSuccessfulPayments || 0} previous successful payments</strong></li>
                <li>Customer has <strong className="text-slate-200">{customer.totalFailedPayments || 0} failed payments</strong></li>
                <li>Failure reason: "<span className="text-slate-200 font-mono text-[11px]">{recoveryCase.failureReason}</span>"</li>
                <li>Transaction amount ₹{recoveryCase.amountAtRisk?.toLocaleString('en-IN')} evaluated against policy rules</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Panel 2: Policy & Safety Engine */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center space-x-3 mb-5 border-b border-slate-800/80 pb-4">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Policy & Safety Engine</h2>
              <p className="text-xs text-slate-400">Deterministic Rule Validation & Safety Guardrails</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Max Transaction Exposure Limit (₹50,000):</span>
              <span className={`font-bold font-mono ${recoveryCase.amountAtRisk <= 50000 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {recoveryCase.amountAtRisk <= 50000 ? `✓ PASSED (₹${recoveryCase.amountAtRisk?.toLocaleString('en-IN')})` : '✗ VIOLATION'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Max Retry Attempt Ceiling (2 attempts):</span>
              <span className={`font-bold font-mono ${recoveryCase.attempts < 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {recoveryCase.attempts < 2 ? `✓ PASSED (${recoveryCase.attempts}/2)` : `✗ ATTEMPTS EXCEEDED`}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">AI Confidence Threshold (≥ 50%):</span>
              <span className={`font-bold font-mono ${recoveryCase.recoveryProbability >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {recoveryCase.recoveryProbability >= 0.5 ? `✓ PASSED (${((recoveryCase.recoveryProbability || 0) * 100).toFixed(0)}%)` : `✗ LOW CONFIDENCE`}
              </span>
            </div>

            <div className="mt-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Policy Safety Status</span>
                <span className="text-xs font-bold text-slate-100 mt-0.5 block font-mono">
                  Approved Action: {recoveryCase.currentAction || recoveryCase.recommendedAction}
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-extrabold text-xs flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" /> APPROVED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL AUDIT TIMELINE */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-2xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Step-by-Step Audit Timeline</h2>
            <p className="text-xs text-slate-400">Immutable chronological audit nodes logged during recovery execution.</p>
          </div>
        </div>

        <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
          {timeline.map((event, idx) => (
            <div key={event._id || idx} className="relative pl-6">
              {/* Dot */}
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-1 shadow-md">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-cyan-400">{event.eventType}</span>
                  <span className="text-slate-500 text-[10px] font-mono">{new Date(event.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">{event.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

