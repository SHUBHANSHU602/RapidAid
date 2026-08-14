import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/80 rounded-xl ${className}`} />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-slate-800/90 rounded-xl animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-12 bg-slate-800/50 rounded-xl flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-[#1E293B]/70 border border-white/[0.06] rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-slate-700/80 rounded w-1/3" />
        <div className="h-5 bg-slate-700/80 rounded-full w-16" />
      </div>
      <div className="h-8 bg-slate-700/60 rounded w-1/2" />
      <div className="h-4 bg-slate-700/40 rounded w-full" />
    </div>
  );
};

export default Skeleton;
