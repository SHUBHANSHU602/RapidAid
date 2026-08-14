import React from 'react';
import Card from '../../ui/Card';
import { Activity, Ambulance, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const StatsRow = ({ stats }) => {
  const {
    activeSessions = 0,
    availableAmbulances = 16,
    delayedSessions = 0,
    resolvedToday = 14,
  } = stats || {};

  const statItems = [
    {
      id: 'active',
      title: 'Active Incidents',
      value: activeSessions,
      label: 'Live telemetry tracking',
      icon: Activity,
      color: 'text-red-500',
      bg: 'bg-red-950/60 border-red-500/30',
      glow: 'shadow-red-950/30',
      badge: 'Live',
    },
    {
      id: 'available',
      title: 'Available Fleet',
      value: availableAmbulances,
      label: 'Sub-300ms ready in Redis',
      icon: Ambulance,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-500/30',
      glow: 'shadow-emerald-950/30',
      badge: 'Standby',
    },
    {
      id: 'delayed',
      title: 'Delayed Incidents',
      value: delayedSessions,
      label: 'Auto-rerouting active',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-950/60 border-amber-500/30',
      glow: 'shadow-amber-950/30',
      badge: 'Monitored',
    },
    {
      id: 'resolved',
      title: 'Resolved Today',
      value: resolvedToday,
      label: 'Avg response 4.8 mins',
      icon: CheckCircle2,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-500/30',
      glow: 'shadow-cyan-950/30',
      badge: '+12% vs avg',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.id}
            hoverEffect={true}
            className="p-5 bg-[#1E293B]/70 border-white/[0.08]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl border ${item.bg} ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                {item.badge}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {item.title}
              </h3>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {item.value}
              </div>
              <p className="text-[11px] text-slate-400">{item.label}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsRow;
