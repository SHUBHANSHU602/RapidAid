import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatTime(date) {
  return format(new Date(date), 'HH:mm:ss');
}

export function formatDateTime(date) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}
