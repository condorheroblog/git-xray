import type { Grade, VelocityMonth, VelocityReport } from '../types.ts'
import { monthKey } from '../../utils/date.ts'
import { runGit } from '../git.ts'

function gradeVelocity(recentAvg: number, previousAvg: number): Grade {
  if (previousAvg === 0)
    return recentAvg > 0 ? 'A' : 'B'
  const ratio = recentAvg / previousAvg
  if (ratio < 0.5)
    return 'C'
  if (ratio < 0.8)
    return 'B'
  return 'A'
}

/**
 * Module 4 — Accelerating or dying.
 * Mirrors:
 *   git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c
 * Aggregates commits per month across the entire history.
 */
export async function analyzeVelocity(cwd: string): Promise<VelocityReport> {
  const out = await runGit(
    ['log', '--format=%ad', '--date=format:%Y-%m'],
    { cwd },
  )

  const counts = new Map<string, number>()
  for (const line of out.split('\n')) {
    const m = line.trim().match(/^(\d{4})-(\d{2})$/)
    if (!m)
      continue
    const key = `${m[1]}-${m[2]}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // Build a continuous month timeline so the chart is not sparse.
  const keys = [...counts.keys()].sort()
  let start: string | undefined
  let end: string | undefined
  if (keys.length > 0) {
    start = keys[0]
    end = keys[keys.length - 1]
  }
  else {
    const now = new Date()
    end = monthKey(now)
    start = end
  }

  const history: VelocityMonth[] = []
  const [sy, sm] = start.split('-').map(Number) as [number, number]
  const [ey, em] = end.split('-').map(Number) as [number, number]
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    const key = `${y}-${m < 10 ? `0${m}` : m}`
    history.push({ month: key, count: counts.get(key) ?? 0 })
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }

  const recent = history.slice(-6)
  const previous = history.slice(-12, -6)
  const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b.count, 0) / recent.length : 0
  const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b.count, 0) / previous.length : 0
  const ratio = previousAvg > 0 ? recentAvg / previousAvg : undefined

  return {
    history,
    recentAvg,
    previousAvg,
    ratio,
    grade: gradeVelocity(recentAvg, previousAvg),
  }
}
