import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Formats ISO date or Date object into human-readable timestamp.
 */
export const formatTimestamp = (dateInput, pattern = 'MMM d, yyyy h:mm:ss a') => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return 'Invalid date';
    return format(date, pattern);
  } catch (err) {
    return String(dateInput);
  }
};

/**
 * Formats timestamp as relative time from now (e.g. "2 minutes ago").
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return 'Invalid date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (err) {
    return 'just now';
  }
};

/**
 * Formats minutes or seconds into clean MM:SS or mm minutes format.
 */
export const formatMinutesToDisplay = (minutes) => {
  if (minutes === null || minutes === undefined) return '--';
  const mins = Math.max(0, Number(minutes));
  if (mins < 1) {
    const secs = Math.round(mins * 60);
    return `${secs} sec`;
  }
  return `${Math.round(mins)} min`;
};

/**
 * Calculates session duration between start and end.
 */
export const calculateDuration = (startDate, endDate) => {
  if (!startDate) return '--';
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};
