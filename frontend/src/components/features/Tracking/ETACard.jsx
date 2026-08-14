import React from 'react';
import Card from '../../ui/Card';
import StatusBadge from '../../ui/StatusBadge';
import { Clock, Navigation, Shield, User, Ambulance } from 'lucide-react';
import { motion } from 'framer-motion';

export const ETACard = ({
  driverName = 'En Route Officer',
  vehicleNumber = 'Unit UP-65',
  etaMinutes = 5,
  initialEta = 8,
  status = 'EN_ROUTE',
  hospitalName = 'Sir Sunderlal Hospital (BHU)',
}) => {
  const currentEta = Math.max(0, Number(etaMinutes) || 0);
  const totalEta = Math.max(initialEta, currentEta, 1);
  const progressPercent = Math.min(100, Math.max(5, Math.round(((totalEta - currentEta) / totalEta) * 100)));

  return (
    <Card className="border-red-500/20 bg-[#1E293B]/80 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Dispatched Ambulance
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Ambulance className="w-5 h-5 text-red-500" />
              {vehicleNumber}
            </h3>
          </div>
        </div>
        <StatusBadge status={status} size="md" />
      </div>

      {/* Large ETA Countdown Display */}
      <div className="my-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            Estimated Arrival
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <motion.span
              key={currentEta}
              initial={{ scale: 1.1, color: '#DC2626' }}
              animate={{ scale: 1, color: '#FFFFFF' }}
              className="text-4xl sm:text-5xl font-black tracking-tight"
            >
              {currentEta < 1 ? '< 1' : currentEta}
            </motion.span>
            <span className="text-base font-bold text-slate-300">
              {currentEta <= 1 ? 'min away' : 'minutes away'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-800/50 text-xs font-bold animate-pulse">
            Live GPS Sync
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Dispatch</span>
          <span>{progressPercent}% Complete</span>
          <span>Arrival</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full shadow-[0_0_10px_#dc2626]"
          />
        </div>
      </div>

      {/* Driver & Hospital Details */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px]">Driver / Paramedic</p>
            <p className="font-semibold text-slate-200 truncate">{driverName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px]">Destination Hospital</p>
            <p className="font-semibold text-slate-200 truncate">{hospitalName}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ETACard;
