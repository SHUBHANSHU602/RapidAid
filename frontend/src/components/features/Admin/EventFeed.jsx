import React from 'react';
import Card from '../../ui/Card';
import StatusBadge from '../../ui/StatusBadge';
import { Terminal, Activity, Zap, Info } from 'lucide-react';
import { formatTimestamp } from '../../../utils/time';

export const EventFeed = ({ events = [] }) => {
  return (
    <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-xl p-5 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              System Audit Event Stream
            </h4>
            <p className="text-[10px] text-slate-400">Real-time socket status broadcasts</p>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs pr-1">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">No system events logged yet.</p>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id || Math.random()}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04] space-y-1 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cyan-400">[{ev.type || 'EVENT'}]</span>
                  {ev.status && <StatusBadge status={ev.status} size="sm" />}
                </div>
                <span className="text-[10px] text-slate-500">
                  {formatTimestamp(ev.timestamp || new Date(), 'HH:mm:ss')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{ev.message}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default EventFeed;
