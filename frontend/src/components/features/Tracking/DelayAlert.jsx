import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const DelayAlert = ({ delayData }) => {
  if (!delayData) return null;

  const { drift = 3, currentEta, message = 'Ambulance is experiencing traffic delay. Evaluating alternatives.' } = delayData;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-2xl bg-red-950/80 backdrop-blur-xl border border-red-500/50 shadow-2xl shadow-red-950/50 text-slate-100 relative overflow-hidden"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-red-900/80 border border-red-500/40 flex items-center justify-center text-red-300 shrink-0 shadow-lg shadow-red-950">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              Route Delay Detected
            </h4>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-900 text-red-200 border border-red-600/40 font-mono">
              +{drift}m Drift
            </span>
          </div>

          <p className="text-xs text-red-200 mt-1 leading-relaxed">
            {message}
          </p>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-red-300/80 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>AI Dynamic Rerouting Engine is active</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DelayAlert;
