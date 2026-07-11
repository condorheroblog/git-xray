/**
 * @condorhero/git-xray — programmatic API.
 *
 * For the CLI entry point, see the `git-xray` binary
 * (run via `npx -y @condorhero/git-xray`).
 * For lower-level access (custom reporters, embedders), use:
 *
 *   import { runReport } from '@condorhero/git-xray'
 *   import { renderTerminal } from '@condorhero/git-xray'
 *   import { renderHtml } from '@condorhero/git-xray'
 */

export { analyzeBugs } from './core/analyze/bugs.ts'
export { analyzeChurn } from './core/analyze/churn.ts'
export { analyzeContributors } from './core/analyze/contributors.ts'
export { analyzeFirefighting } from './core/analyze/firefighting.ts'
export { analyzeVelocity } from './core/analyze/velocity.ts'
export { crossReference } from './core/cross.ts'
export { getRepoRoot, GitError, runGit } from './core/git.ts'
export { runReport } from './core/index.ts'
export { collectRepoMeta } from './core/repo.ts'
export type {
  BugEntry,
  BugsReport,
  ChurnEntry,
  ChurnReport,
  ContributorEntry,
  ContributorsReport,
  CrossRiskReport,
  FirefightingEvent,
  FirefightingReport,
  Grade,
  RepoMeta,
  ReportData,
  RiskFile,
  RiskLevel,
  VelocityMonth,
  VelocityReport,
} from './core/types.ts'
export { renderHtml } from './report/html.ts'
export { fileIcon } from './report/html.ts'
export { dict } from './report/template.ts'

export type { Dict, Locale } from './report/template.ts'
export { renderTerminal } from './report/terminal.ts'
