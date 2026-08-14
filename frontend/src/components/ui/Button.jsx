import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 border border-red-500/50',
  secondary: 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 border border-slate-700/60 backdrop-blur-md',
  outline: 'bg-transparent hover:bg-white/5 text-slate-200 border border-slate-500/50 hover:border-slate-300',
  ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
  danger: 'bg-red-700 hover:bg-red-600 text-white shadow-md shadow-red-900/40',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base font-bold rounded-xl gap-2.5',
  xl: 'px-8 py-4 text-lg font-bold rounded-2xl gap-3',
  icon: 'p-2.5 rounded-xl',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  pulse = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'relative inline-flex items-center justify-center select-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  const pulseClasses = pulse ? 'animate-pulse' : '';

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${pulseClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
