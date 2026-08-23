const colorMap = {
  red: 'bg-red-900/50 text-red-300 border border-red-500/30',
  blue: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
  green: 'bg-green-900/50 text-green-300 border border-green-500/30',
  amber: 'bg-amber-900/50 text-amber-300 border border-amber-500/30',
  purple: 'bg-purple-900/50 text-purple-300 border border-purple-500/30',
  gray: 'bg-gray-700/50 text-gray-300 border border-gray-500/30',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${colorMap[color] || colorMap.gray} ${className}
    `}>
      {children}
    </span>
  );
}
