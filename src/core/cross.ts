import type { BugsReport, ChurnReport, CrossRiskReport, RiskFile } from './types.ts'

const CRITICAL_LOOKBACK = 5

/**
 * Cross-reference churn and bug hotspots to flag risk files.
 *  - critical: appears in BOTH churn Top 5 AND bugs Top 5
 *  - warning: appears in churn Top 20 but NOT in bugs Top 5
 */
export function crossReference(churn: ChurnReport, bugs: BugsReport): CrossRiskReport {
  const churnCriticalSet = new Set(churn.files.slice(0, CRITICAL_LOOKBACK).map(f => f.file))
  const churnTop = new Set(churn.files.slice(0, 20).map(f => f.file))
  const bugCriticalSet = new Set(bugs.files.slice(0, CRITICAL_LOOKBACK).map(f => f.file))
  const bugTop = new Set(bugs.files.map(f => f.file))

  const churnMap = new Map(churn.files.map(f => [f.file, f.count]))
  const bugMap = new Map(bugs.files.map(f => [f.file, f.count]))

  const critical: RiskFile[] = []
  for (const file of churnCriticalSet) {
    if (bugTop.has(file)) {
      critical.push({
        file,
        churnCount: churnMap.get(file) ?? 0,
        bugCount: bugMap.get(file) ?? 0,
        risk: 'critical',
      })
    }
  }

  const warning: RiskFile[] = []
  for (const file of churnTop) {
    if (churnCriticalSet.has(file))
      continue // already in critical
    if (bugCriticalSet.has(file)) {
      warning.push({
        file,
        churnCount: churnMap.get(file) ?? 0,
        bugCount: bugMap.get(file) ?? 0,
        risk: 'warning',
      })
    }
  }

  critical.sort((a, b) => (b.churnCount + b.bugCount) - (a.churnCount + a.bugCount))
  warning.sort((a, b) => b.churnCount - a.churnCount)

  return { critical, warning }
}
