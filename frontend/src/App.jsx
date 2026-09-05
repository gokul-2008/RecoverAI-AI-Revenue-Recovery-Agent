import React, { useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecoveryCases from './pages/RecoveryCases';
import CaseDetails from './pages/CaseDetails';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import AIDecisions from './pages/AIDecisions';
import AuditLogs from './pages/AuditLogs';
import Evaluation from './pages/Evaluation';

// Error Boundary to prevent blank dark screens on unexpected UI exceptions
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RECOVERAI UI ERROR]', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('recoverai_token');
    localStorage.removeItem('recoverai_user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-100">RecoverAI Session Recovered</h2>
            <p className="text-xs text-slate-400">
              An unexpected interface error occurred. You can reset your session to return to the control center login.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              Reset Session & Return to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route wrapper leveraging AuthContext
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-bounce">
          <span className="text-slate-950 font-black text-sm">AI</span>
        </div>
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Loading RecoverAI Control Center...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const [activeMode, setActiveMode] = useState('demo'); // 'demo' or 'test'

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Dashboard Layout & Sub-Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout activeMode={activeMode} setActiveMode={setActiveMode} />}>
                  <Route path="/" element={<Dashboard activeMode={activeMode} />} />
                  <Route path="/cases" element={<RecoveryCases activeMode={activeMode} />} />
                  <Route path="/cases/:id" element={<CaseDetails />} />
                  <Route path="/payments" element={<Payments activeMode={activeMode} />} />
                  <Route path="/customers" element={<Customers activeMode={activeMode} />} />
                  <Route path="/ai-decisions" element={<AIDecisions activeMode={activeMode} />} />
                  <Route path="/audit-logs" element={<AuditLogs activeMode={activeMode} />} />
                  <Route path="/evaluation" element={<Evaluation />} />
                </Route>
              </Route>

              {/* Fallback Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
