import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Navigation,
  Brain,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Radio,
  Clock,
  ArrowRight,
  Shield,
  Heart,
  Ambulance,
  Sparkles,
  Github,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Navbar from '../components/layout/Navbar';

export const Landing = () => {
  const stats = [
    { label: '< 300ms Assignment', desc: 'Sub-second Redis geohash matching' },
    { label: 'Real-Time GPS', desc: 'Delta compressed 4s telemetry' },
    { label: '4-Level Fallback', desc: 'Autonomous dynamic reassignment' },
    { label: 'LLaMA 3 AI', desc: 'Real-time triage & first-aid steps' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Trigger',
      desc: 'One tap SOS shares high-precision GPS coordinates & AI-assessed emergency triage categories instantly.',
      icon: Radio,
      color: 'from-red-600 to-red-800',
    },
    {
      num: '02',
      title: 'Track',
      desc: 'Watch your ambulance move in real-time with smooth LERP interpolation, live ETA countdown, and AI guidance.',
      icon: Navigation,
      color: 'from-blue-600 to-indigo-800',
    },
    {
      num: '03',
      title: 'Arrive',
      desc: 'Paramedic team arrives fully prepped with hospital ER bed reservations and pre-arrival telemetry sync.',
      icon: ShieldCheck,
      color: 'from-emerald-600 to-teal-800',
    },
  ];

  const features = [
    {
      title: 'Sub-300ms Assignment',
      desc: 'Geohash Level-7 spatial indexing matches the optimal vehicle from Redis candidates in under 300 milliseconds.',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-500/30',
    },
    {
      title: 'Live GPS Tracking',
      desc: 'Full-duplex Socket.io streams continuous driver coordinates with intelligent delta compression.',
      icon: Navigation,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-500/30',
    },
    {
      title: 'AI Severity Triage',
      desc: 'Groq LLaMA 3 analyzes symptoms and assigns clinical severity from Level 1 (Minor) to Level 5 (Resuscitation).',
      icon: Brain,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-500/30',
    },
    {
      title: 'Delay Auto-Detection',
      desc: 'Bull queue workers continuously monitor traffic drift. If ETA drifts >3 mins, re-routing triggers immediately.',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-950/40 border-red-500/30',
    },
    {
      title: '4-Level Fallback Engine',
      desc: 'Guaranteed dispatch resilience across nearest vehicle, multi-neighborhood search, and hospital reserve fleet.',
      icon: Layers,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/30',
    },
    {
      title: 'First-Aid Instructions',
      desc: 'Interactive step-by-step emergency checklist guides bystanders through critical life-saving care.',
      icon: Heart,
      color: 'text-rose-400',
      bg: 'bg-rose-950/40 border-rose-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Hero Ambient Background Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[100px] right-1/4 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[250px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center relative">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-500/30 text-xs font-bold text-red-300 mb-6 shadow-lg shadow-red-950/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400 animate-spin" />
            <span>Next-Generation Autonomous Emergency Dispatch</span>
          </motion.div>

          {/* Centered Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]"
          >
            Emergency Help.{' '}
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
              Under 300ms.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered ambulance dispatch that assigns, tracks, and adapts — before you even notice a delay.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button
                variant="primary"
                size="xl"
                pulse={true}
                icon={Radio}
                className="w-full sm:w-auto font-black tracking-wider uppercase shadow-2xl shadow-red-600/40 px-8 py-4"
              >
                Get Help Now
              </Button>
            </Link>

            <Link to="/login?role=driver">
              <Button
                variant="outline"
                size="xl"
                icon={Ambulance}
                className="w-full sm:w-auto font-bold border-slate-400 text-white hover:border-white px-8 py-4"
              >
                Driver Login
              </Button>
            </Link>
          </motion.div>

          {/* STATS BAR (Glassmorphism card, horizontal) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto p-4 sm:p-6 rounded-2xl bg-[#1E293B]/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
              {stats.map((stat, idx) => (
                <div key={idx} className="pt-3 sm:pt-0 sm:px-4 text-center first:pt-0">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight text-red-400">
                    {stat.label}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS SECTION (3 Steps with Animated Line) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">Tactical Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              How RapidAid Dispatches
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From the instant you tap SOS to emergency hospital arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Animated Dashed Line connecting steps */}
            <div className="hidden md:block absolute top-1/2 left-[18%] right-[18%] -translate-y-6 h-0.5 border-t-2 border-dashed border-red-500/40 -z-0 pointer-events-none" />

            {steps.map((step, idx) => {
              const Icon = step.icon;

              return (
                <Card
                  key={idx}
                  hoverEffect={true}
                  className="p-6 bg-[#1E293B]/70 border-white/[0.08] relative z-10 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-xl shadow-red-950/60 border border-white/10">
                    <Icon className="w-7 h-7" />
                  </div>

                  <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-800/40">
                    Step {step.num}
                  </span>

                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FEATURE GRID (2x3 or 3x2) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">Enterprise Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              Built for Critical Response Seconds
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Every component engineered to prevent bottleneck delays during life-threatening crises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;

              return (
                <Card
                  key={idx}
                  hoverEffect={true}
                  className="p-6 bg-[#1E293B]/70 border-white/[0.08] space-y-3.5"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${feat.bg} ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-red-950/80 via-[#1E293B] to-slate-900 border border-red-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Ready to Experience Instant Medical Dispatch?
              </h3>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                Create a patient account or log in as a certified ambulance paramedic driver.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link to="/register">
                <Button variant="primary" size="lg" icon={Radio} className="uppercase font-bold tracking-wider">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="font-bold">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#0B1120] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-red-500" />
            <span className="font-bold text-slate-300">RapidAid</span>
            <span>— Real-Time AI Emergency Dispatch System</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub Repository
            </a>
            <span>© {new Date().getFullYear()} RapidAid Technologies</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
