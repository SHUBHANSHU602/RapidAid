import React from 'react';

const badgeVariants = {
  default: 'bg-slate-800/80 text-slate-300 border-slate-700',
  red: 'bg-red-950/60 text-red-400 border-red-500/30 shadow-sm shadow-red-950/40',
  amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
  green: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
  blue: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
  purple: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
  cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
};

const severityStyles = {
  1: { variant: 'green', label: 'L1 · Non-Urgent' },
  2: { variant: 'blue', label: 'L2 · Minor' },
  3: { variant: 'amber', label: 'L3 · Moderate' },
  4: { variant: 'red', label: 'L4 · Urgent' },
  5: { variant: 'red', label: 'L5 · Critical' },
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-bold',
  }[size] || 'px-2.5 py-1 text-xs';

  const variantClass = badgeVariants[variant] || badgeVariants.default;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md font-medium uppercase tracking-wider ${sizeClasses} ${variantClass} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${pulse ? 'animate-ping' : ''} ${
          variant === 'red' ? 'bg-red-400' :
          variant === 'green' ? 'bg-emerald-400' :
          variant === 'amber' ? 'bg-amber-400' :
          variant === 'cyan' ? 'bg-cyan-400' :
          variant === 'blue' ? 'bg-blue-400' : 'bg-slate-400'
        }`} />
      )}
      {children}
    </span>
  );
};

export const SeverityBadge = ({ level = 3, size = 'md' }) => {
  const config = severityStyles[level] || severityStyles[3];
  return (
    <Badge variant={config.variant} size={size} dot={level >= 4} pulse={level === 5}>
      {config.label}
    </Badge>
  );
};

export default Badge;
