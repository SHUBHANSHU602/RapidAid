import React from 'react';
import { Badge } from './Badge';

const statusConfig = {
  INITIATED: {
    variant: 'blue',
    label: 'Initiated',
    dot: true,
    pulse: false,
  },
  ASSIGNED: {
    variant: 'amber',
    label: 'Assigned',
    dot: true,
    pulse: false,
  },
  EN_ROUTE: {
    variant: 'cyan',
    label: 'En Route',
    dot: true,
    pulse: true,
  },
  DELAYED: {
    variant: 'red',
    label: 'Delayed',
    dot: true,
    pulse: true,
  },
  RESOLVED: {
    variant: 'green',
    label: 'Resolved',
    dot: false,
    pulse: false,
  },
  CANCELLED: {
    variant: 'default',
    label: 'Cancelled',
    dot: false,
    pulse: false,
  },
};

export const StatusBadge = ({ status = 'INITIATED', size = 'md', className = '' }) => {
  const normStatus = (status || 'INITIATED').toUpperCase();
  const config = statusConfig[normStatus] || statusConfig.INITIATED;

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      pulse={config.pulse}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
