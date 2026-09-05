import React, { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, CheckCircle2, XCircle, DollarSign, Activity } from 'lucide-react';
import api from '../services/api';

export default function Payments({ activeMode }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments?mode=${activeMode || 'all'}`);
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeMode]);

  const capturedVolume = payments.filter(p => p.status === 'captured').reduce((sum, p) => sum + (p.amount || 0), 0);
  const failedVolume = payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Payment Transactions Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">Full immutable ledger of failed payment attempts and recovered transactions.</p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Ledger Items</span>
            <span className="text-2xl font-black text-slate-100 mt-1 block">{payments.length}</span>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Captured Recovered Volume</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">₹{capturedVolume.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Failed Exposure Volume</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">₹{failedVolume.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            Loading transaction ledger...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Failure Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-200">{p.razorpayPaymentId}</td>
                    <td className="p-4 font-medium text-slate-300">{p.customerId?.name || 'Customer'}</td>
                    <td className="p-4 font-black text-slate-100 text-sm">₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono uppercase text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-bold text-cyan-400">
                        {p.method || 'UPI/Card'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate font-mono text-[11px]">{p.failureReason || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        p.status === 'captured' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {p.status === 'captured' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                        <span>{p.status?.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-500 font-mono text-[11px]">{new Date(p.createdAt).toLocaleString()}</td>
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

