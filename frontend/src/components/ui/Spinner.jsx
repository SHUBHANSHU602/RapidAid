import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  }[size] || 'w-6 h-6 border-2';

  return (
    <div className={`inline-block ${sizeClasses} border-slate-600 border-t-red-500 rounded-full animate-spin ${className}`} />
  );
};

export const FullPageLoader = ({ text = 'Initializing RapidAid Real-Time Telemetry...' }) => {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" />
        <div className="absolute w-12 h-12 rounded-full bg-red-600/20 animate-ping" />
        <div className="absolute w-4 h-4 rounded-full bg-red-600 shadow-lg shadow-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 tracking-tight">{text}</h3>
      <p className="text-xs text-slate-500 mt-1">Connecting to dispatch cluster</p>
    </div>
  );
};

export default Spinner;
