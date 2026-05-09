/**
 * Formats a UUID as a short display ID: last 6 hex chars, uppercase, prefixed with #.
 * e.g. "6182ade8-b09c-4c0c-a59d-102b5cc38aff" → "#C38AFF"
 */
export function formatId(id: string): string {
  const clean = id.replace(/-/g, '');
  return '#' + clean.slice(-6).toUpperCase();
}
