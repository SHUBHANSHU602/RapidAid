import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, ShieldAlert } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/time';

export const DriverDisconnected = ({ disconnectData }) => {
  if (!disconnectData) return null;

  const { lastKnownLocation, locationPreservedUntil, disconnectedAt } = disconnectData;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-2xl text-slate-200"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
          <WifiOff className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Driver Telemetry Signal Interrupted
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Driver signal momentarily lost — last known location is preserved and displayed on the tracking map.
          </p>

          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Last Ping: {formatRelativeTime(disconnectedAt || new Date())}</span>
            <span>•</span>
            <span className="text-amber-400">Preserved for 5 min</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DriverDisconnected;
