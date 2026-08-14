import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Ambulance, Zap } from 'lucide-react';

export const AmbulanceSwapped = ({ swapData }) => {
  if (!swapData) return null;

  const { newAmbulanceId, newEta, message = 'A closer ambulance has been dynamically reassigned to minimize response time.' } = swapData;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-amber-950/80 backdrop-blur-xl border border-amber-500/50 shadow-2xl shadow-amber-950/50 text-slate-100"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-900/80 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
          <Zap className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Ambulance Reassigned (4-Level Fallback)
            </h4>
            {newEta && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-900 text-amber-200 border border-amber-600/40">
                New ETA: {newEta} min
              </span>
            )}
          </div>

          <p className="text-xs text-amber-200 mt-1 leading-relaxed">
            {message}
          </p>

          <p className="text-[10px] text-amber-300/80 font-mono mt-2 flex items-center gap-1">
            <Ambulance className="w-3 h-3" />
            Active Unit: {newAmbulanceId || 'Closer Unit Assigned'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AmbulanceSwapped;
