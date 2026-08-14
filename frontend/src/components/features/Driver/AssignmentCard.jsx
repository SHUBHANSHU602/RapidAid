import React, { useEffect } from 'react';
import Card from '../../ui/Card';
import { SeverityBadge } from '../../ui/Badge';
import { ShieldAlert, MapPin, Clock, Navigation, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AssignmentCard = ({ assignment }) => {
  if (!assignment) return null;

  const {
    sessionId,
    emergencyType = 'CARDIAC',
    severityLevel = 4,
    location,
    etaMinutes = 6,
    address = 'Near Varanasi Ghat / Godowlia Junction',
  } = assignment;

  // Sound/vibration notification on assignment mount
  useEffect(() => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="p-5 rounded-2xl bg-gradient-to-br from-red-950/90 to-[#1E293B] border-2 border-red-500/60 shadow-2xl shadow-red-950/60 text-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header alert */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-red-500/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-600 shadow-md shadow-red-600/50">
            <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-red-100">
              🚨 Urgent Emergency Dispatched
            </h3>
            <p className="text-[10px] text-red-300 font-mono">Session: #{sessionId?.slice(-8) || 'Active'}</p>
          </div>
        </div>

        <SeverityBadge level={severityLevel} size="md" />
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.04] space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Category</span>
          <p className="font-extrabold text-base text-white">{emergencyType}</p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.04] space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Transit ETA</span>
          <p className="font-extrabold text-base text-amber-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            ~{etaMinutes} minutes
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.04] flex items-start gap-2 text-xs mb-1">
        <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-200">{address}</p>
          {location && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Coordinates: {location.lat?.toFixed(5) || 25.3176}, {location.lng?.toFixed(5) || 82.9739}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AssignmentCard;
