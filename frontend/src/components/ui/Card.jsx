import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  pulseBorder = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-[#1E293B]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-6 relative overflow-hidden transition-all duration-300';
  const hoverClasses = hoverEffect ? 'hover:border-red-500/30 hover:shadow-red-950/20 hover:-translate-y-1' : '';
  const glowClasses = glow ? 'shadow-[0_0_30px_rgba(220,38,38,0.15)] border-red-500/30' : '';
  const pulseClasses = pulseBorder ? 'border-red-500 animate-pulse' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${pulseClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`flex items-start justify-between mb-4 pb-3 border-b border-white/[0.06] ${className}`}>
      <div>
        {title && <h3 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between ${className}`}>{children}</div>;
};

export default Card;
