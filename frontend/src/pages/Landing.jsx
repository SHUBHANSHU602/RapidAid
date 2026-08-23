import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ambulance, Zap, MapPin, Hospital, Shield, Brain, Clock, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
};

const features = [
  { icon: Zap, title: 'Sub-300ms Assignment', desc: 'AI instantly matches the nearest available ambulance using geohash proximity and real-time Redis cache.' },
  { icon: MapPin, title: 'Real-time GPS Tracking', desc: 'Watch your ambulance approach in real time on a live map with smooth marker movement.' },
  { icon: Brain, title: 'AI Severity Triage', desc: 'LLaMA 3 AI analyzes your description to assess severity and provide specialised first aid.' },
  { icon: Clock, title: 'Proactive Delay Detection', desc: 'Background jobs monitor ETA drift every 60 seconds and trigger fallback chains when delays hit.' },
  { icon: Shield, title: '4-Level Fallback Chain', desc: 'Automatic escalation: reassign → expand radius → AI message patient → alert admin.' },
  { icon: AlertTriangle, title: 'First Aid Instructions', desc: 'Immediate hardcoded first aid for 14 emergency types, plus AI-generated specialised guidance.' },
];

const steps = [
  { emoji: '🆘', title: 'Trigger', desc: 'One tap. AI classifies severity instantly.' },
  { emoji: '📍', title: 'Track', desc: 'Watch the ambulance move in real time.' },
  { emoji: '🏥', title: 'Arrive', desc: 'Driver confirms arrival. Hospital pre-selected.' },
];

const stats = [
  '< 300ms Assignment',
  'Live GPS Tracking',
  '4-Level Fallback',
  'LLaMA 3 AI',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-red/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-blue/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial="hidden" animate="visible" className="space-y-8 max-w-3xl">
          <motion.div variants={fadeUp} custom={0} className="flex justify-center">
            <div className="w-24 h-24 bg-accent-red rounded-2xl flex items-center justify-center shadow-lg shadow-accent-red/30">
              <Ambulance className="w-14 h-14 text-white" />
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-bold tracking-tight">
            Emergency Help.{' '}
            <span className="text-accent-red">Under 300ms.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            AI-powered dispatch that assigns, tracks, and adapts — before you even notice a delay.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="xl" className="relative overflow-hidden">
                <span className="absolute inset-0 bg-accent-red animate-pulse opacity-20 rounded-xl" />
                Get Help Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl">I'm a Driver</Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 animate-bounce"
        >
          <div className="w-6 h-10 border-2 border-text-muted/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-text-muted/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-5xl mx-auto px-6 -mt-20 mb-24"
      >
        <div className="glass p-6 flex flex-wrap justify-center gap-8">
          {stats.map((stat) => (
            <div key={stat} className="flex items-center gap-2 text-text-primary">
              <div className="w-2 h-2 rounded-full bg-accent-red" />
              <span className="text-sm font-medium">{stat}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-32">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16"
        >
          How it <span className="text-accent-red">works</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center space-y-4"
            >
              <div className="text-5xl">{step.emoji}</div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-8 h-8 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <h3 className="text-xl font-bold">{step.title}</h3>
              </div>
              <p className="text-text-muted">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 mb-32">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16"
        >
          Built for <span className="text-accent-red">emergencies</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass p-6 hover:border-accent-red/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center mb-4 group-hover:bg-accent-red/20 transition-colors">
                <f.icon className="w-5 h-5 text-accent-red" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-light py-8 text-center text-text-muted text-sm">
        <p>RapidAid © 2026 — AI-Powered Emergency Dispatch</p>
      </footer>
    </div>
  );
}
