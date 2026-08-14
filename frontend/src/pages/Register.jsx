import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import { User, Mail, Lock, Eye, EyeOff, Ambulance, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({ name, email, password, role });
      if (result.success) {
        if (role === 'DRIVER') {
          navigate('/driver');
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col lg:flex-row">
      
      {/* LEFT HALF: Hero visual */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between relative bg-gradient-to-br from-slate-900 via-[#0F172A] to-red-950/40 border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Rapid<span className="text-red-500">Aid</span>
          </span>
        </Link>

        <div className="my-12 lg:my-auto relative z-10 max-w-lg space-y-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Join the smart emergency dispatch network.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Register as a patient to request instant ambulance assistance with AI triage, or register as a driver to receive real-time dispatches.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Patient Protection Guarantee
            </div>
            <p className="text-slate-400">
              Your location is only shared during active emergency triggers and encrypted under strict healthcare data protocols.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="text-red-400 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>

      {/* RIGHT HALF: Register Card */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-[#1E293B]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-8 space-y-5"
        >
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your system role to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector Pill */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    role === 'USER'
                      ? 'bg-red-950/70 border-red-500 text-white shadow-md shadow-red-950/40'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Patient (Citizen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DRIVER')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    role === 'DRIVER'
                      ? 'bg-red-950/70 border-red-500 text-white shadow-md shadow-red-950/40'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Ambulance className="w-4 h-4" />
                  <span>Ambulance Driver</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

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
                  className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input pl-10 pr-10 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
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

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              icon={ArrowRight}
              className="w-full font-bold uppercase tracking-wider text-xs py-3.5 mt-2 shadow-xl shadow-red-900/40"
            >
              Create {role === 'DRIVER' ? 'Driver' : 'Patient'} Account
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-red-400 hover:text-red-300 underline">
              Log In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
