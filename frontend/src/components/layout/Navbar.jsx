import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { Shield, Activity, LogOut, Radio, User, ChevronDown, Ambulance } from 'lucide-react';
import Badge from '../ui/Badge';

export const Navbar = () => {
  const { user, role, logout, isAuthenticated } = useAuthStore();
  const { isConnected, status } = useSocketStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'DRIVER') return '/driver';
    if (role === 'ADMIN') return '/admin';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0F172A]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
            <Ambulance className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white bg-clip-text">
                Rapid<span className="text-red-500">Aid</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-red-950/70 text-red-400 border border-red-800/40">
                AI DISPATCH
              </span>
            </div>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          
          {/* Socket Connection Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 relative group cursor-help">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : status === 'reconnecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-medium tracking-wide">
              {isConnected ? 'Socket Live' : status === 'reconnecting' ? 'Reconnecting' : 'Offline'}
            </span>
            
            {/* Tooltip on hover */}
            <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50 w-56 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-xs text-slate-300 shadow-xl backdrop-blur-md">
              <p className="font-semibold text-slate-100 mb-1">Socket.io Telemetry</p>
              <p>Status: <span className="text-emerald-400 font-mono">{status}</span></p>
              <p>Channel: <span className="text-slate-400 font-mono">Real-time GPS + Triage</span></p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <Badge
                variant={role === 'ADMIN' ? 'purple' : role === 'DRIVER' ? 'cyan' : 'blue'}
                size="sm"
              >
                {role || 'USER'}
              </Badge>

              {/* User Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-sm text-white border border-slate-500/30">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm font-semibold text-slate-200">
                    {user?.name || user?.email?.split('@')[0] || 'My Account'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden md:inline" />
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-bold text-slate-100 truncate">{user?.email || 'User'}</p>
                        <p className="text-xs text-red-400 font-mono mt-0.5">Role: {role}</p>
                      </div>

                      <Link
                        to={getDashboardPath()}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <Activity className="w-4 h-4 text-red-400" />
                        Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/40 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-105"
              >
                Get Help
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
