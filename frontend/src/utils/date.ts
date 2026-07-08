/** Format an ISO date string as an Arabic-locale date. */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('ar', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Format an ISO date string as an Arabic-locale time. */
export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit',
  });
