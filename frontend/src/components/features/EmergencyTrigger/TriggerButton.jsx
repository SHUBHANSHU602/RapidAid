import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Radio } from 'lucide-react';

export const TriggerButton = ({ onClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center relative">
      {/* Radar Pulse Rings */}
      <div className="relative flex items-center justify-center">
        <div className="sos-radar-ring" />
        <div className="sos-radar-ring" />
        <div className="sos-radar-ring" />

        {/* 120px Circular SOS Button */}
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-red-500 border-4 border-white/20 shadow-[0_0_50px_rgba(220,38,38,0.7)] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-red-500/50"
          aria-label="Trigger Emergency Dispatch"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <span className="text-white font-black text-xs md:text-sm tracking-wider uppercase drop-shadow-md">
            TRIGGER
          </span>
          <span className="text-red-100 font-extrabold text-[10px] md:text-xs tracking-widest uppercase">
            EMERGENCY
          </span>
        </motion.button>
      </div>

      {/* Subtext info */}
      <div className="mt-8 max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-800/30 text-xs text-red-300 mb-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>Sub-300ms Autonomous Assignment</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your live GPS coordinates will be instantly matched with the nearest paramedic team and hospital ER.
        </p>
      </div>
    </div>
  );
};

export default TriggerButton;
