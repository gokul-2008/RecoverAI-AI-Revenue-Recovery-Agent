import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Zap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sun, 
  Moon,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { isDark, toggleTheme } = useTheme();
  const { login: authLogin, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Client-side validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: trimmedEmail,
        username: trimmedEmail,
        password: password
      });

      if (res.data && res.data.token) {
        authLogin(res.data.token, res.data.user);
        setSuccessMsg('Login successful! Welcome back.');

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 400);
      } else {
        setError('Unexpected server response. Please try again.');
      }
    } catch (err) {
      console.error('[FRONTEND LOGIN ERROR]', err);
      if (!err.response) {
        setError('Unable to connect to RecoverAI server. Please try again.');
      } else if (err.response.status === 401) {
        setError(err.response.data?.error || 'Invalid email or password');
      } else {
        setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Right Header Actions */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-400' 
              : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-600'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
          <span className="text-xs font-bold">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Glassmorphic Login Card */}
      <div className={`max-w-md w-full glass-panel rounded-3xl p-8 border relative z-10 shadow-2xl transition-all ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 text-slate-950 font-bold mb-4 shadow-lg shadow-cyan-500/20">
            <Zap className="w-8 h-8 fill-slate-950" />
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            RecoverAI Portal
          </h1>
          <p className="text-xs font-medium text-cyan-500 mt-1 uppercase tracking-wider font-mono">
            AI REVENUE RECOVERY PLATFORM
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-xs text-rose-400 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800 text-slate-100 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-cyan-500 hover:underline font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full border rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800 text-slate-100 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900 w-4 h-4"
              />
              <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                Remember my login session
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Create Account Link Footer */}
        <div className={`mt-6 pt-5 border-t text-center ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`max-w-sm w-full rounded-2xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Password resets are managed by your System Administrator. Contact <span className="text-cyan-500 font-mono">admin@recoverai.com</span> for support.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-cyan-500 text-slate-950 font-bold py-2 rounded-xl text-xs hover:bg-cyan-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
