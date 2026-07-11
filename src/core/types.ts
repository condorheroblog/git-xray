/**
 * Data schema for a single git-xray report.
 * Used by both terminal renderer and HTML renderer.
 */

export type Grade = 'A' | 'B' | 'C'

export interface RepoMeta {
  /** Absolute path to the analyzed repository. */
  path: string
  /** Repository folder name (basename of `path`). */
  name: string
  /** Short HEAD commit hash, 7 chars. */
  headShort: string
  /** Full HEAD commit hash. */
  headFull: string
  /** ISO timestamp of when the report was generated. */
  generatedAt: string
  /** Localized timestamp string (e.g. "2026-07-11 14:32"). */
  generatedAtLocal: string
  /** Tool version (`xray` package version). */
  toolVersion: string
  /** Total elapsed milliseconds spent on analysis. */
  elapsedMs: number
}

export interface ChurnEntry {
  file: string
  count: number
}

export interface ChurnReport {
  /** All detected churn hotspots, sorted descending by count. */
  files: ChurnEntry[]
  /** Total number of changed files in the analyzed window. */
  totalFiles: number
  /** Total number of commits scanned. */
  totalCommits: number
  /** Analyzed window string, e.g. "1 year ago". */
  since: string
}

export interface ContributorEntry {
  name: string
  email: string
  commits: number
  /** Commit share 0..1 of all-time commits. */
  share: number
  /** Whether this contributor appears in the recent 6-month window. */
  active: boolean
}

export interface ContributorsReport {
  contributors: ContributorEntry[]
  totalCommits: number
  /** Commit share of the top contributor, 0..1. */
  topShare: number
  /** Number of contributors active in the last 6 months. */
  activeCount: number
  /** Total contributors in the all-time list. */
  totalCount: number
  grade: Grade
}

export interface BugEntry {
  file: string
  count: number
}

export interface BugsReport {
  files: BugEntry[]
  /** Total commits matched by fix/bug/broken grep. */
  totalCommits: number
  since: string
}

export interface VelocityMonth {
  /** YYYY-MM. */
  month: string
  count: number
}

export interface VelocityReport {
  history: VelocityMonth[]
  /** Average of the most recent 6 months. */
  recentAvg: number
  /** Average of the 6 months before that. */
  previousAvg: number
  /** recentAvg / previousAvg; undefined when previousAvg is 0. */
  ratio: number | undefined
  grade: Grade
}

export interface FirefightingEvent {
  hash: string
  /** First line of the commit subject. */
  subject: string
  /** ISO date. */
  date: string
  /** YYYY-MM bucket. */
  month: string
}

export interface FirefightingReport {
  events: FirefightingEvent[]
  byMonth: VelocityMonth[]
  /** Average events per month over the analyzed window. */
  perMonthAvg: number
  grade: Grade
}

export type RiskLevel = 'critical' | 'warning' | 'normal'

export interface RiskFile {
  file: string
  churnCount: number
  bugCount: number
  risk: RiskLevel
}

export interface CrossRiskReport {
  /** Files present in BOTH top churn and top bugs lists. */
  critical: RiskFile[]
  /** Files present only in top churn (top 20) but not in top bugs. */
  warning: RiskFile[]
}

export interface ReportData {
  meta: RepoMeta
  churn: ChurnReport
  contributors: ContributorsReport
  bugs: BugsReport
  velocity: VelocityReport
  firefighting: FirefightingReport
  cross: CrossRiskReport
}
