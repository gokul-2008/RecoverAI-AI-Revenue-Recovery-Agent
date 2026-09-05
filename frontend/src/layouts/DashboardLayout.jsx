import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  CreditCard, 
  Users, 
  BrainCircuit, 
  History, 
  BarChart3, 
  LogOut, 
  Zap,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    groupLabel: 'Core Engine',
    items: [
      { path: '/', label: 'Control Center', icon: LayoutDashboard },
      { path: '/cases', label: 'Recovery Cases', icon: ShieldAlert },
      { path: '/payments', label: 'Payments Sandbox', icon: CreditCard },
      { path: '/customers', label: 'Customer Risk', icon: Users }
    ]
  },
  {
    groupLabel: 'Intelligence & Audit',
    items: [
      { path: '/ai-decisions', label: 'AI Decision Engine', icon: BrainCircuit },
      { path: '/audit-logs', label: 'Audit Trail', icon: History },
      { path: '/evaluation', label: 'Model Evaluation', icon: BarChart3 }
    ]
  }
];

export default function DashboardLayout({ children, activeMode, setActiveMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const authUser = user || { name: 'Gokul B', email: 'demo@recoverai.com', role: 'Admin' };

  const safeName = (authUser && typeof authUser.name === 'string' && authUser.name.trim()) 
    ? authUser.name.trim() 
    : 'Gokul B';

  const userInitials = safeName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'GB';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col backdrop-blur-2xl border-r transition-all duration-300 shrink-0
        ${isDark ? 'bg-slate-950/90 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-md'}
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <Link to="/" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="truncate">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  RecoverAI
                </span>
                <span className="block text-[9px] text-cyan-500 font-mono tracking-widest uppercase font-bold">
                  AI Revenue Recovery
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className={`lg:hidden p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector in Sidebar */}
        <div className={`p-3 border-b ${isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50/80'}`}>
          {(!collapsed || mobileOpen) && (
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Environment Mode</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
          )}
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border text-xs ${isDark ? 'bg-slate-950 border-slate-800/90' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setActiveMode('demo')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all text-[11px] flex items-center justify-center space-x-1 cursor-pointer ${
                activeMode === 'demo'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm shadow-amber-500/10 font-extrabold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Demo Mode (Simulated Sandbox)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-status-pulse shrink-0"></span>
              {(!collapsed || mobileOpen) && <span>Demo Mode</span>}
            </button>

            <button
              onClick={() => setActiveMode('test')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all text-[11px] flex items-center justify-center space-x-1 cursor-pointer ${
                activeMode === 'test'
                  ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40 shadow-sm shadow-cyan-500/10 font-extrabold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Razorpay Test Mode (Official API)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-status-pulse shrink-0"></span>
              {(!collapsed || mobileOpen) && <span>Razorpay Test</span>}
            </button>
          </div>
        </div>

        {/* Nav Links Grouped */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {(!collapsed || mobileOpen) && (
                <div className={`px-3 text-[10px] font-bold tracking-widest uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {group.groupLabel}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? isDark
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 font-extrabold'
                          : 'bg-cyan-50 text-cyan-600 border border-cyan-200 shadow-sm font-extrabold'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-500"></span>
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-500' : isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900'}`} />
                    {(!collapsed || mobileOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / User Profile & Logout */}
        <div className={`p-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2 px-1">
            {(!collapsed || mobileOpen) && (
              <div className="truncate">
                <span className={`block text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {authUser.name || 'Gokul B'}
                </span>
                <span className="text-[10px] text-cyan-500 font-mono font-bold">
                  {authUser.role || 'Admin'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border border-transparent cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20' 
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className={`h-16 border-b backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors duration-300 ${
          isDark 
            ? 'border-slate-800/80 bg-slate-950/80' 
            : 'border-slate-200 bg-white/90 shadow-sm'
        }`}>
          {/* Left Title & Mobile Menu Trigger */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-xl border cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-base font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>RecoverAI</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  BUILDATHON TRACK 03
                </span>
              </div>
              <p className={`text-[11px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Autonomous AI Revenue Recovery Agent
              </p>
            </div>
          </div>

          {/* Right Header Status Indicators & Theme Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live System Online Dot */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1 border rounded-full text-xs font-mono ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-emerald-50 border-emerald-200 text-slate-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse"></span>
              <span className="text-[11px] font-semibold text-emerald-500">SYSTEM ONLINE</span>
            </div>

            {/* Global Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Light and Dark Theme"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-400'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-600" />
                  <span className="text-[11px] font-bold text-slate-700 hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Environment Badge */}
            {activeMode === 'demo' ? (
              <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-[11px] font-bold">DEMO ENVIRONMENT</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-500 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold">RAZORPAY TEST ENVIRONMENT</span>
              </div>
            )}

            {/* Authenticated User Profile Badge & Avatar */}
            <div className={`flex items-center space-x-2 pl-2 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="hidden sm:block text-right">
                <span className={`block text-xs font-extrabold leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {authUser.name || 'Gokul B'}
                </span>
                <span className="text-[10px] text-cyan-500 font-mono font-bold">
                  {authUser.role || 'Admin'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/10">
                <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-extrabold ${isDark ? 'bg-slate-950 text-cyan-300' : 'bg-white text-cyan-600'}`}>
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}



