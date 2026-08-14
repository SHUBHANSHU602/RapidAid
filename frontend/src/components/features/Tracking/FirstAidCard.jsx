import React, { useState } from 'react';
import Card from '../../ui/Card';
import { CheckSquare, Square, AlertOctagon, Timer, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const FirstAidCard = ({ firstAidData }) => {
  if (!firstAidData) return null;

  const { steps = [], warnings = [], estimatedTimeMin = 4 } = firstAidData;
  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStep = (index) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <Card className="border-emerald-500/20 bg-[#1E293B]/80 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-white/[0.08]">
        <div>
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            First-Aid Checklist
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Follow these life-saving steps while the paramedic crew is en route
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span>~{estimatedTimeMin} mins</span>
        </div>
      </div>

      {/* Progress pill */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-300">
        <span>Completion Progress</span>
        <span className="font-bold text-emerald-400">{completedCount} of {steps.length} Completed ({progress}%)</span>
      </div>

      {/* Numbered Checkable Steps */}
      <div className="space-y-2.5 mb-5">
        {steps.map((step, idx) => {
          const isDone = !!completedSteps[idx];

          return (
            <motion.div
              key={idx}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleStep(idx)}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-slate-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-200 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-slate-400 hover:text-emerald-400 focus:outline-none shrink-0"
              >
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <div className="text-xs leading-relaxed">
                <span className={`font-bold mr-1.5 ${isDone ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {idx + 1}.
                </span>
                <span className={isDone ? 'line-through text-slate-400' : 'text-slate-100'}>
                  {step}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Red Warnings Banner */}
      {warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/40 space-y-1.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            Critical Precautions & Warnings
          </p>
          <ul className="list-disc list-inside text-xs text-red-200 space-y-1">
            {warnings.map((warning, wIdx) => (
              <li key={wIdx} className="leading-relaxed font-medium">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default FirstAidCard;
