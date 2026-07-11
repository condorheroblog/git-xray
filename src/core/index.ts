import type { RepoMeta, ReportData } from './types.ts'
import { analyzeBugs } from './analyze/bugs.ts'
import { analyzeChurn } from './analyze/churn.ts'
import { analyzeContributors } from './analyze/contributors.ts'
import { analyzeFirefighting } from './analyze/firefighting.ts'
import { analyzeVelocity } from './analyze/velocity.ts'
import { crossReference } from './cross.ts'
import { collectRepoMeta } from './repo.ts'

export interface RunOptions {
  cwd: string
  since?: string
  top?: number
  toolVersion: string
  locale?: string
}

/**
 * Run all 5 analyses sequentially and return a complete ReportData object.
 */
export async function runReport(options: RunOptions): Promise<ReportData> {
  const t0 = Date.now()
  const locale = options.locale ?? 'en'

  const meta = await collectRepoMeta(options.cwd, options.toolVersion, locale)

  const [churn, contributors, bugs, velocity, firefighting] = await Promise.all([
    analyzeChurn(options.cwd, { since: options.since, top: options.top }),
    analyzeContributors(options.cwd),
    analyzeBugs(options.cwd, { since: options.since, top: options.top }),
    analyzeVelocity(options.cwd),
    analyzeFirefighting(options.cwd, { since: options.since }),
  ])

  const cross = crossReference(churn, bugs)

  const metaWithTiming: RepoMeta = {
    path: meta.path,
    name: meta.name,
    headShort: meta.headShort,
    headFull: meta.headFull,
    generatedAt: meta.generatedAt,
    generatedAtLocal: meta.generatedAtLocal,
    toolVersion: meta.toolVersion,
    elapsedMs: Date.now() - t0,
  }

  return {
    meta: metaWithTiming,
    churn,
    contributors,
    bugs,
    velocity,
    firefighting,
    cross,
  }
}

export type { RepoInfo } from './repo.ts'
export type { RepoMeta, ReportData } from './types.ts'
export type {
  BugsReport,
  ChurnReport,
  ContributorsReport,
  CrossRiskReport,
  FirefightingReport,
  Grade,
  RiskFile,
  RiskLevel,
  VelocityReport,
} from './types.ts'
