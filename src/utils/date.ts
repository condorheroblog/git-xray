/**
 * Format an ISO timestamp for display in the report header.
 *
 * Uses an ISO-style `YYYY-MM-DD HH:mm` (24h) format. It is unambiguous
 * across locales (no MM/DD vs DD/MM ambiguity) and aligns with the
 * convention commonly used in Chinese and other international contexts.
 */
export function formatLocal(iso: string, _locale: string = 'en'): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

/** Pad a number to 2 digits. */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Produce YYYY-MM key from a Date. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

/** Produce a YYYY-MM key from an ISO date string. */
export function monthKeyFromIso(iso: string): string {
  return monthKey(new Date(iso))
}