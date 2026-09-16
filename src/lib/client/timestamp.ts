/** Formats a date as DD-MM-YY HH:MM (local time), used as the default name for a saved session. */
export function formatSessionTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = pad(date.getFullYear() % 100);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
