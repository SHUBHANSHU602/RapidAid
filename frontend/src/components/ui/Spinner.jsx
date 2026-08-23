const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-12 h-12' };

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`${sizeMap[size]} ${className}`}>
      <div className={`${sizeMap[size]} border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin`} />
    </div>
  );
}
