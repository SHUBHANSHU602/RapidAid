import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-accent-red hover:bg-accent-red-hover text-white',
  secondary: 'bg-bg-elevated hover:bg-bg-card text-text-primary border border-border-light',
  outline: 'bg-transparent border border-border-light text-text-primary hover:bg-bg-elevated',
  ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-elevated',
  danger: 'bg-red-900/50 border border-red-500/30 text-red-300 hover:bg-red-900/70',
  success: 'bg-accent-green/20 border border-accent-green/30 text-green-300 hover:bg-accent-green/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

export default function Button({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', fullWidth = false, ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
