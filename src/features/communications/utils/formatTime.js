export function formatTime(timestamp) {
  if (!timestamp) return '';
  if (timestamp.includes('AM') || timestamp.includes('PM')) return timestamp;

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}