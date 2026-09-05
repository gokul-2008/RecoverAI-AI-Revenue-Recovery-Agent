import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  Play, 
  RefreshCw, 
  ArrowRight,
  ArrowUpRight,
  Zap,
  Activity,
  Cpu,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard({ activeMode }) {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState(null);
  const [executionStep, setExecutionStep] = useState(0);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/stats?mode=${activeMode}`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeMode]);

  const handleRunScenario = async (scenarioId) => {
    try {
      setScenarioLoading(scenarioId);
      setExecutionStep(1);

      // Simulate visible step transitions for interactive hackathon demo experience
      const stepTimer1 = setTimeout(() => setExecutionStep(2), 300);
      const stepTimer2 = setTimeout(() => setExecutionStep(3), 600);
      const stepTimer3 = setTimeout(() => setExecutionStep(4), 900);

      const res = await api.post('/demo/run', { scenarioId, mode: activeMode });
      
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setExecutionStep(5);

      setTimeout(async () => {
        await fetchStats();
        setScenarioLoading(null);
        setExecutionStep(0);
      }, 1000);
    } catch (err) {
      console.error('Error running scenario:', err);
      alert('Error executing scenario: ' + (err.response?.data?.error || err.message));
      setScenarioLoading(null);
      setExecutionStep(0);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center space-y-4 max-w-sm text-center glow-cyan">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Initializing Control Center</h3>
            <p className="text-xs text-slate-400 mt-1">Fetching real-time revenue exposure & database metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  const riskColors = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#EF4444'
  };

  const riskChartData = stats ? [
    { name: 'Low Risk', value: stats.riskDistribution?.LOW || 0, color: riskColors.LOW },
    { name: 'Medium Risk', value: stats.riskDistribution?.MEDIUM || 0, color: riskColors.MEDIUM },
    { name: 'High Risk', value: stats.riskDistribution?.HIGH || 0, color: riskColors.HIGH }
  ] : [];

  // Determine latest activity pipeline item if recent audit exists
  const latestAudit = stats?.recentAudits && stats.recentAudits.length > 0 ? stats.recentAudits[0] : null;
  const latestCase = stats?.recentCases && stats.recentCases.length > 0 ? stats.recentCases[0] : null;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-pulse"></span>
                <span>AI AGENT ACTIVE</span>
              </span>
              <span className="text-xs text-slate-400">Monitoring payment failures autonomously</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
              AI Revenue Recovery <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Control Center</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Autonomous detection, diagnosis, decisioning and recovery for failed payments. Recover revenue before it becomes permanently lost.
            </p>
          </div>

          {/* Right Side Compact "Agent Status" Card */}
          <div className="glass-panel glass-panel-cyan rounded-2xl p-4 sm:p-5 border border-cyan-500/30 w-full lg:w-72 shrink-0 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">AI Agent Status</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold rounded-md border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Detection Engine</span>
                <span className="flex items-center text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">AI Diagnosis (Gemini)</span>
                <span className="flex items-center text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Policy Guardrails</span>
                <span className="flex items-center text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Razorpay Execution</span>
                <span className="flex items-center text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Audit Compliance</span>
                <span className="flex items-center text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue at Risk */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenue At Risk</span>
              <p className="text-[10px] text-slate-500">Capital currently exposed</p>
            </div>
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black tracking-tight text-slate-100">
              ₹{(stats?.revenueAtRisk || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span>Evaluated Failures</span>
            <span className="font-semibold text-rose-400">{stats?.totalCases || 0} Events</span>
          </div>
        </div>

        {/* Card 2: Revenue Recovered */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenue Recovered</span>
              <p className="text-[10px] text-slate-500">Verified recovered capital</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black tracking-tight text-emerald-400">
              ₹{(stats?.revenueRecovered || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center text-xs text-emerald-400 font-medium relative z-10">
            <ArrowUpRight className="w-4 h-4 mr-1 shrink-0" />
            <span>Actual verified recovered capital</span>
          </div>
        </div>

        {/* Card 3: Recovery Rate */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recovery Rate</span>
              <p className="text-[10px] text-slate-500">Recovered / At Risk</p>
            </div>
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 shadow-sm">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black tracking-tight text-cyan-400">
              {stats?.recoveryRate || 0}%
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span>Conversion Ratio</span>
            <span className="font-mono text-cyan-300 font-semibold">{stats?.successfulRecoveries || 0} / {stats?.totalCases || 0} Cases</span>
          </div>
        </div>

        {/* Card 4: Active Cases */}
        <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cases</span>
              <p className="text-[10px] text-slate-500">Resolved / Escalated</p>
            </div>
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black tracking-tight text-slate-100">
              {stats?.totalCases || 0}
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span className="text-emerald-400 font-bold">{stats?.successfulRecoveries || 0} Resolved</span>
            <span className="text-amber-400 font-bold">{stats?.escalatedCases || 0} Escalated</span>
          </div>
        </div>
      </div>

      {/* 3. AI AGENT ACTIVITY PIPELINE */}
      <div className="glass-panel rounded-3xl p-6 border border-purple-500/20 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">AI AGENT ACTIVITY PIPELINE</h2>
              <p className="text-xs text-slate-400">Autonomous revenue recovery workflow pipeline in real-time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>PIPELINE ACTIVE</span>
          </div>
        </div>

        {latestCase ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {/* Step 1: Detected */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <span>1. DETECTED</span>
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-extrabold text-slate-100">₹{latestCase.amountAtRisk?.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-400 truncate">{latestCase.failureReason || 'Bank Failure'}</p>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">{latestCase.caseId}</span>
            </div>

            {/* Step 2: Diagnosed */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                <span>2. DIAGNOSED</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-cyan-300 font-mono">{latestCase.rootCause || 'AUTHENTICATION_FAILED'}</p>
              <p className="text-[11px] text-slate-400">Confidence: <span className="text-cyan-400 font-bold">{((latestCase.recoveryProbability || 0.7) * 100).toFixed(0)}%</span></p>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">Risk: {latestCase.riskLevel}</span>
            </div>

            {/* Step 3: Policy Check */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                <span>3. POLICY CHECK</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-emerald-400 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" /> Approved
              </p>
              <p className="text-[11px] text-slate-400">Attempts: {latestCase.attempts} / {latestCase.maxAttempts}</p>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">Bound Limits Verified</span>
            </div>

            {/* Step 4: Action */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <span>4. ACTION</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-amber-300 font-mono truncate">{latestCase.recommendedAction || 'CREATE_PAYMENT_LINK'}</p>
              <p className="text-[11px] text-slate-400">Execution Complete</p>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">Razorpay SDK Call</span>
            </div>

            {/* Step 5: Status / Audit */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span>5. OUTCOME</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                latestCase.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-300' :
                latestCase.status === 'active' ? 'bg-cyan-500/20 text-cyan-300' :
                latestCase.status === 'escalated' ? 'bg-amber-500/20 text-amber-300' :
                'bg-slate-800 text-slate-400'
              }`}>
                {latestCase.status}
              </span>
              <p className="text-[11px] text-slate-400">Audit Trail Written</p>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">Immutable Logged</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800/80 space-y-2">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <h3 className="text-sm font-bold text-slate-300">No active recovery pipeline activity yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run a recovery scenario below to activate the end-to-end autonomous AI agent pipeline.
            </p>
          </div>
        )}
      </div>

      {/* 4. LIVE RECOVERY SCENARIOS CONTROLLER */}
      <div className="glass-panel glass-panel-cyan rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">LIVE RECOVERY SCENARIOS</h2>
              <p className="text-xs text-slate-400">
                Run real end-to-end recovery workflows in a controlled environment.
              </p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-semibold text-slate-300 transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {/* Interactive execution animation overlay */}
        {scenarioLoading && (
          <div className="mb-6 p-4 glass-panel rounded-2xl border border-cyan-500/40 bg-slate-950/90 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-b border-slate-800 pb-2">
              <span className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
                <span>RUNNING RECOVERY AGENT (Scenario {scenarioLoading})</span>
              </span>
              <span className="font-mono text-[10px]">Processing Pipeline...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className={`p-2 rounded border ${executionStep >= 1 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                [1] Failure Detected {executionStep >= 1 ? '✓' : ''}
              </div>
              <div className={`p-2 rounded border ${executionStep >= 2 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                [2] AI Diagnosis {executionStep >= 2 ? '✓' : ''}
              </div>
              <div className={`p-2 rounded border ${executionStep >= 3 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                [3] Policy Check {executionStep >= 3 ? '✓' : ''}
              </div>
              <div className={`p-2 rounded border ${executionStep >= 4 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                [4] Action Execution {executionStep >= 4 ? '✓' : ''}
              </div>
              <div className={`p-2 rounded border ${executionStep >= 5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                [5] Audit Logged {executionStep >= 5 ? '✓' : ''}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Scenario 1 */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-cyan-500/40">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 font-mono">SCENARIO 1</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  RECOVERABLE
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">PAYMENT FAILURE</h3>
              <p className="text-lg font-black text-slate-100 mt-1">₹2,499</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Bank authentication failure. Customer has 8 successful payments. Generates Razorpay payment link.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario(1)}
              disabled={Boolean(scenarioLoading)}
              className="w-full py-2.5 px-3 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{scenarioLoading === 1 ? 'Running...' : 'Run Scenario 1'}</span>
            </button>
          </div>

          {/* Scenario 2 */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-400 font-mono">SCENARIO 2</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
                  ESCALATION
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">HIGH-RISK PAYMENT</h3>
              <p className="text-lg font-black text-slate-100 mt-1">₹42,000</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Repeated payment failures (4 failed, 0 success). AI & Policy trigger merchant escalation.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario(2)}
              disabled={Boolean(scenarioLoading)}
              className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{scenarioLoading === 2 ? 'Running...' : 'Run Scenario 2'}</span>
            </button>
          </div>

          {/* Scenario 3 */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 font-mono">SCENARIO 3</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  AUTO-RETRY
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">BANK DEGRADATION</h3>
              <p className="text-lg font-black text-slate-100 mt-1">₹999</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Temporary bank degradation. Customer has 5 successful payments. AI executes instant automated retry.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario(3)}
              disabled={Boolean(scenarioLoading)}
              className="w-full py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{scenarioLoading === 3 ? 'Running...' : 'Run Scenario 3'}</span>
            </button>
          </div>

          {/* Scenario 4 */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-extrabold tracking-widest text-purple-400 font-mono">SCENARIO 4</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                  STOP RULE
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">EXHAUSTED ATTEMPTS</h3>
              <p className="text-lg font-black text-slate-100 mt-1">₹10,000</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Retry ceiling reached (2 attempts). Safety Policy Engine enforces STOP rule to prevent spam.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario(4)}
              disabled={Boolean(scenarioLoading)}
              className="w-full py-2.5 px-3 bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-slate-950 border border-purple-500/40 font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{scenarioLoading === 4 ? 'Running...' : 'Run Scenario 4'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. DYNAMIC CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">REVENUE RECOVERY PERFORMANCE</h3>
              <p className="text-xs text-slate-400">Revenue exposure vs verified recovered capital (₹)</p>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#475569'} fontSize={11} />
                <YAxis stroke={isDark ? '#64748b' : '#475569'} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#030712' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#e2e8f0', 
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '1rem', 
                    fontSize: '12px',
                    boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.08)'
                  }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="risk" stroke="#EF4444" fillOpacity={1} fill="url(#colorRisk)" name="Revenue At Risk" />
                <Area type="monotone" dataKey="recovered" stroke="#10B981" fillOpacity={1} fill="url(#colorRecovered)" name="Revenue Recovered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100">AI RISK DISTRIBUTION</h3>
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Risk is determined from payment behavior, failure patterns and AI diagnosis.
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#475569'} fontSize={11} />
                  <YAxis stroke={isDark ? '#64748b' : '#475569'} fontSize={11} />
                  <Tooltip contentStyle={{ 
                    backgroundColor: isDark ? '#030712' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#e2e8f0', 
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '1rem', 
                    fontSize: '12px' 
                  }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-around text-center">
            <div>
              <span className="block text-emerald-400 font-black text-lg">{stats?.riskDistribution?.LOW || 0}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Low Risk</span>
            </div>
            <div>
              <span className="block text-amber-400 font-black text-lg">{stats?.riskDistribution?.MEDIUM || 0}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Medium Risk</span>
            </div>
            <div>
              <span className="block text-rose-400 font-black text-lg">{stats?.riskDistribution?.HIGH || 0}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">High Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. RECENT CASES & LIVE AUDIT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Recent Recovery Cases</h3>
              <p className="text-xs text-slate-400">Live cases managed by autonomous agent</p>
            </div>
            <Link to="/cases" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
              <span>View All Cases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Case ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Risk Level</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.recentCases && stats.recentCases.length > 0 ? (
                  stats.recentCases.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-200">{c.caseId}</td>
                      <td className="p-3.5 font-medium text-slate-300">
                        {c.customerId?.name || 'Customer'}
                      </td>
                      <td className="p-3.5 font-black text-slate-100">₹{c.amountAtRisk?.toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          c.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          c.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {c.riskLevel}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          c.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-300' :
                          c.status === 'active' ? 'bg-cyan-500/20 text-cyan-300' :
                          c.status === 'escalated' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={`/cases/${c.caseId}`}
                          className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500 text-xs">
                      No recovery cases logged yet. Run a scenario above to test!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Log Feed */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Live Audit Timeline</h3>
              <p className="text-xs text-slate-400">System compliance event log stream</p>
            </div>
            <Link to="/audit-logs" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              Full Logs
            </Link>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {stats?.recentAudits && stats.recentAudits.length > 0 ? (
              stats.recentAudits.map((a) => (
                <div key={a._id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center font-mono text-[10px] text-slate-400">
                    <span className="text-cyan-400 font-bold">{a.eventType}</span>
                    <span>{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-snug">{a.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No audit timeline records logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
