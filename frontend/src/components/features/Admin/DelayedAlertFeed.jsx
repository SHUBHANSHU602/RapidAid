import React from 'react';
import Card from '../../ui/Card';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/time';

export const DelayedAlertFeed = ({ delayedAlerts = [] }) => {
  const alerts = delayedAlerts.length > 0
    ? delayedAlerts
    : [
        {
          sessionId: 'sess-88912',
          drift: 4,
          currentEta: 9,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          message: 'Heavy traffic at Sigra Crossing — auto fallback engaged',
        },
      ];

  return (
    <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-xl p-5 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950 text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Delay Detection Stream
            </h4>
            <p className="text-[10px] text-slate-400">Real-time ETA drift anomalies</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-300">
          {alerts.length} Flagged
        </span>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {alerts.map((alert, idx) => (
          <a
            key={idx}
            href={`/emergency/${alert.sessionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-red-500/20 hover:border-red-500/50 transition-all text-xs group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-red-400">
                #{alert.sessionId?.slice(-6) || '88912'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                +{alert.drift}m Drift
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              {alert.message || 'ETA drifted beyond 3-minute threshold.'}
            </p>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>{formatRelativeTime(alert.timestamp || new Date())}</span>
              <span className="flex items-center gap-1 text-red-400 group-hover:translate-x-0.5 transition-transform">
                View Telemetry <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
};

export default DelayedAlertFeed;
