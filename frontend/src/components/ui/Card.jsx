export default function Card({ children, className = '', variant = 'default', ...props }) {
  const base = variant === 'default' ? 'glass' :
    variant === 'red' ? 'glass-red' :
    variant === 'blue' ? 'glass-blue' :
    variant === 'green' ? 'glass-green' :
    variant === 'amber' ? 'glass-amber' :
    variant === 'purple' ? 'glass-purple' : 'glass';

  return (
    <div className={`${base} p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
