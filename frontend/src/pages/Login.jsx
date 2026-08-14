import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, Ambulance, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate role route
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'DRIVER') navigate('/driver', { replace: true });
      else if (role === 'ADMIN') navigate('/admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  // If role=driver is passed in query params, pre-fill demo
  useEffect(() => {
    const queryRole = searchParams.get('role');
    if (queryRole === 'driver') {
      setEmail('driver1@rapidaid.com');
      setPassword('driver123');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);

      if (result.success) {
        const userRole = (result.role || 'USER').toUpperCase();
        if (userRole === 'DRIVER') {
          navigate('/driver');
        } else if (userRole === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (type) => {
    if (type === 'patient') {
      setEmail('user@rapidaid.com');
      setPassword('user123');
    } else if (type === 'driver') {
      setEmail('driver1@rapidaid.com');
      setPassword('driver123');
    } else if (type === 'admin') {
      setEmail('admin@rapidaid.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col lg:flex-row">
      
      {/* LEFT HALF: Hero branding & visual */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between relative bg-gradient-to-br from-slate-900 via-[#0F172A] to-red-950/40 border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Rapid<span className="text-red-500">Aid</span>
          </span>
        </Link>

        {/* Center illustration & copy */}
        <div className="my-12 lg:my-auto relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-xs font-bold text-red-300">
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span>Autonomous Geohash Dispatch</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Real-time ambulance telemetry and AI triage at your fingertips.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Sign in to access your patient emergency dashboard, driver telemetry transmitter, or administrative dispatch command center.
          </p>

          {/* Quick Demo Pre-fill Pills */}
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick Test Profiles:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('patient')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition-colors"
              >
                👤 Patient Demo
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('driver')}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-xs font-bold text-cyan-200 transition-colors"
              >
                🚑 Driver Demo
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-xs font-bold text-purple-200 transition-colors"
              >
                ⚡ Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted JWT Sessions & TLS Sockets</span>
        </div>
      </div>

      {/* RIGHT HALF: Centered Glassmorphism Login Card */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-[#1E293B]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-8 space-y-6 relative"
        >
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access the dispatch system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@rapidaid.com"
                  className="w-full glass-input pl-10 pr-3.5 py-3 rounded-xl text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input pl-10 pr-10 py-3 rounded-xl text-sm placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              icon={ArrowRight}
              className="w-full font-bold uppercase tracking-wider text-xs py-3.5 mt-2 shadow-xl shadow-red-900/40"
            >
              Sign In to RapidAid
            </Button>
          </form>

          {/* Bottom link */}
          <div className="pt-2 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-red-400 hover:text-red-300 underline">
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
