import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';
import api from '../services/api';

export default function Customers({ activeMode }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?mode=${activeMode || 'all'}`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeMode]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Customer Risk & Recovery Profiles</h1>
          <p className="text-xs text-slate-400 mt-1">Payment history, loyalty metrics, and calculated risk scores per customer.</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Customers</span>
        </button>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            Loading customer profiles...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Customer Profile</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Successful Payments</th>
                  <th className="p-4">Failed Payments</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Calculated Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-4 font-bold text-slate-100 text-sm">{c.name}</td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      <div className="text-slate-200">{c.email}</div>
                      <div className="text-[10px] text-slate-500">{c.phone}</div>
                    </td>
                    <td className="p-4 text-emerald-400 font-black text-sm">{c.totalSuccessfulPayments || 0}</td>
                    <td className="p-4 text-rose-400 font-black text-sm">{c.totalFailedPayments || 0}</td>
                    <td className="p-4 font-black text-slate-100 text-sm">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          c.customerRiskScore < 30 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          c.customerRiskScore < 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {c.customerRiskScore} / 100
                        </span>
                        <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full rounded-full ${
                              c.customerRiskScore < 30 ? 'bg-emerald-400' :
                              c.customerRiskScore < 70 ? 'bg-amber-400' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${Math.min(c.customerRiskScore, 100)}%` }}
                          />
                        </div>
                      </div>
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

