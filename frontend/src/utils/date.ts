/**
 * Utility functions for date and time formatting across LabTrack.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns formatted date string: e.g. "Sep 18, 2026 — 14:32"
 */
export function formatDateTimeDisplay(date: Date = new Date()): string {
  const month = MONTHS_SHORT[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} — ${hours}:${minutes}`;
}

/**
 * Formats ISO date string (YYYY-MM-DD) into readable format: "Sep 18, 2026"
 */
export function formatDateDisplay(isoDateStr?: string | null): string {
  if (!isoDateStr) return '—';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    const month = MONTHS_SHORT[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return isoDateStr;
  }
}

/**
 * Returns current ISO date string: "YYYY-MM-DD"
 */
export function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}
