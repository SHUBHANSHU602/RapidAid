import React from 'react';
import Card from '../../ui/Card';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AICard = ({ aiData }) => {
  if (!aiData) return null;

  const { patientMessage, firstAidAction } = aiData;

  return (
    <Card className="border-blue-500/30 bg-[#1E293B]/80 shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/20">
        <div className="flex items-center gap-2 text-blue-400">
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-500/40">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AI Triage Intelligence
            </h4>
            <span className="text-[10px] text-blue-400 font-mono">Powered by Groq LLaMA 3</span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />
          Real-time
        </span>
      </div>

      {/* Patient Message */}
      {patientMessage && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Patient Guidance
          </p>
          <p className="text-sm font-medium text-slate-100 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/[0.04]">
            "{patientMessage}"
          </p>
        </div>
      )}

      {/* First Aid Action Highlight */}
      {firstAidAction && (
        <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/40 shadow-inner">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
            Immediate Action Required
          </p>
          <p className="text-xs text-blue-100 font-semibold leading-relaxed">
            {firstAidAction}
          </p>
        </div>
      )}
    </Card>
  );
};

export default AICard;
