import React from 'react';
import Card from '../../ui/Card';
import { Radio, Gauge, Database, Activity, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { formatCoordinates } from '../../../utils/geo';
import { formatTimestamp } from '../../../utils/time';

export const LocationEmitter = ({
  isEmitting,
  lastEmission,
  speed = 42,
  broadcastCount = 0,
  deltaSkippedCount = 0,
}) => {
  return (
    <Card className="border-slate-700/80 bg-[#1E293B]/70 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className={`w-3 h-3 rounded-full ${isEmitting ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isEmitting && <span className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-ping" />}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live GPS Telemetry Emitter
            </h4>
            <p className="text-[10px] text-slate-400">
              {isEmitting ? 'Continuous watchPosition active (3-4s throttle)' : 'Telemetry idle'}
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          isEmitting
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {isEmitting ? 'BROADCASTING' : 'STANDBY'}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04]">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold">
            <Gauge className="w-3 h-3 text-cyan-400" />
            Speed
          </div>
          <p className="text-lg font-black text-white mt-0.5">{speed} <span className="text-xs font-normal text-slate-400">km/h</span></p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04]">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            Sent
          </div>
          <p className="text-lg font-black text-emerald-400 mt-0.5">{broadcastCount}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04]">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold">
            <Database className="w-3 h-3 text-amber-400" />
            Delta Saved
          </div>
          <p className="text-lg font-black text-amber-400 mt-0.5">{deltaSkippedCount}</p>
        </div>
      </div>

      {/* Last Emission Status Box */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px]">
          <span>Last Telemetry Packet</span>
          <span className="font-mono">{formatTimestamp(lastEmission?.timestamp || new Date(), 'HH:mm:ss')}</span>
        </div>

        {lastEmission ? (
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${lastEmission.isDeltaSkipped ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className={`font-semibold ${lastEmission.isDeltaSkipped ? 'text-amber-300' : 'text-emerald-300'}`}>
                {lastEmission.message}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Lat: {lastEmission.latitude?.toFixed(5)} · Lng: {lastEmission.longitude?.toFixed(5)}
            </p>
          </div>
        ) : (
          <p className="text-slate-500 italic text-[11px]">Waiting for first GPS coordinate...</p>
        )}
      </div>
    </Card>
  );
};

export default LocationEmitter;
