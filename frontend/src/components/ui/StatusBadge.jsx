const statusColors = {
  INITIATED: 'bg-[#1E3A8A] text-[#93C5FD]',
  ASSIGNED: 'bg-[#92400E] text-[#FCD34D]',
  EN_ROUTE: 'bg-[#065F46] text-[#6EE7B7]',
  DELAYED: 'bg-[#7F1D1D] text-[#FCA5A5]',
  RESOLVED: 'bg-[#14532D] text-[#86EFAC]',
  CANCELLED: 'bg-[#374151] text-[#9CA3AF]',
};

export default function StatusBadge({ status, className = '' }) {
  const upper = status?.toUpperCase() || 'INITIATED';
  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide
      ${statusColors[upper] || statusColors.INITIATED} ${className}
    `}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {upper.replace('_', ' ')}
    </span>
  );
}
