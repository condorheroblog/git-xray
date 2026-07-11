import type { FirefightingEvent, FirefightingReport, Grade, VelocityMonth } from '../types.ts'
import { monthKeyFromIso } from '../../utils/date.ts'
import { runGit } from '../git.ts'

const DEFAULT_SINCE = '1 year ago'
const PATTERN = 'revert|hotfix|emergency|rollback'

function gradeFirefighting(perMonthAvg: number): Grade {
  if (perMonthAvg > 1)
    return 'C'
  if (perMonthAvg > 0.25) // ~ once per quarter
    return 'B'
  return 'A'
}

/**
 * Module 5 — How often is the team firefighting.
 * Mirrors:
 *   git log --oneline --since="1 year ago" | grep -iE 'revert|hotfix|emergency|rollback'
 * We use `git log -i -E --grep` so matching is done by git (more reliable than post-parse).
 */
export async function analyzeFirefighting(
  cwd: string,
  options: { since?: string } = {},
): Promise<FirefightingReport> {
  const since = options.since ?? DEFAULT_SINCE

  // We ask git for matching commits and split lines ourselves.
  const sep = '__XRAY_SEP__'
  const raw = await runGit(
    [
      'log',
      '-i',
      '-E',
      `--grep=${PATTERN}`,
      `--since=${since}`,
      `--format=%H%x1f%aI%x1f%s`,
    ],
    { cwd },
  )

  const events: FirefightingEvent[] = raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(sep)
      const subject = idx >= 0 ? line.slice(idx + sep.length).trim() : line
      // We don't actually have the sep from format because git uses \x1f; use position fallback.
      return subject
    })
    .filter(Boolean)
    // The output format may produce %H%x1f%aI%x1f%s on a single line.
    .map((line) => {
      const parts = line.split('\x1F')
      if (parts.length >= 3) {
        return {
          hash: parts[0].slice(0, 7),
          subject: parts.slice(2).join('\x1F').trim(),
          date: parts[1],
          month: monthKeyFromIso(parts[1]),
        }
      }
      return null
    })
    .filter((e): e is FirefightingEvent => e !== null)

  // Aggregate by month
  const byMonthMap = new Map<string, number>()
  for (const e of events) {
    byMonthMap.set(e.month, (byMonthMap.get(e.month) ?? 0) + 1)
  }
  const byMonth: VelocityMonth[] = [...byMonthMap.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Compute months in window for average
  const months = monthsInWindow(since)
  const perMonthAvg = months > 0 ? events.length / months : 0

  return {
    events,
    byMonth,
    perMonthAvg,
    grade: gradeFirefighting(perMonthAvg),
  }
}

function monthsInWindow(since: string): number {
  const m = /^(\d+)\s+(year|month|week|day)s?\s+ago$/i.exec(since.trim())
  if (!m)
    return 12
  const n = Number(m[1])
  const unit = m[2].toLowerCase()
  if (unit === 'year')
    return n * 12
  if (unit === 'month')
    return n
  if (unit === 'week')
    return Math.max(1, Math.round(n * 7 / 30))
  if (unit === 'day')
    return Math.max(1, Math.round(n / 30))
  return 12
}
