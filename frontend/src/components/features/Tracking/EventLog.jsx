import React, { useState } from 'react';
import Card from '../../ui/Card';
import StatusBadge from '../../ui/StatusBadge';
import { formatTimestamp, formatRelativeTime } from '../../../utils/time';
import { ChevronDown, ChevronUp, History, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EventLog = ({ eventLog = [] }) => {
  const [isOpen, setIsOpen] = useState(true);

  const sortedEvents = [...eventLog].reverse();

  return (
    <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-xl p-4 sm:p-5">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <History className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Session Telemetry Log ({eventLog.length})
            </h4>
            <p className="text-[10px] text-slate-400">Chronological lifecycle updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-4 pt-3 border-t border-white/[0.06]"
          >
            {sortedEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No telemetry events recorded yet.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {sortedEvents.map((event, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 pl-8 text-xs">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-red-500 transform -translate-x-1/2" />

                    <div className="flex-1 bg-slate-950/40 p-2.5 rounded-xl border border-white/[0.04] space-y-1">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={event.status} size="sm" />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTimestamp(event.timestamp, 'HH:mm:ss a')}
                        </span>
                      </div>

                      {event.meta && Object.keys(event.meta).length > 0 && (
                        <div className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-1.5 rounded border border-white/[0.02] mt-1">
                          {Object.entries(event.meta).map(([key, val]) => (
                            <div key={key} className="truncate">
                              <span className="text-slate-500">{key}:</span> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default EventLog;
