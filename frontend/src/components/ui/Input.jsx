import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Input({
  label, icon: Icon, type = 'text', error, className = '', ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-muted">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        )}
        <input
          type={inputType}
          className={`
            w-full bg-bg-elevated border border-border-light rounded-xl
            text-text-primary placeholder-text-muted/50
            focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:border-accent-red/50
            transition-all duration-200
            ${Icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-10' : 'pr-4'} py-2.5 text-sm
            ${error ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
