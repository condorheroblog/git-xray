import type { ChurnReport } from '../types.ts'
import { isNoiseFile, relativize } from '../../utils/path.ts'
import { runGit } from '../git.ts'

const DEFAULT_TOP = 20
const DEFAULT_SINCE = '1 year ago'

/**
 * Module 1 — Churn hotspots.
 * Mirrors the blog's command:
 *   git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20
 */
export async function analyzeChurn(
  cwd: string,
  options: { since?: string, top?: number } = {},
): Promise<ChurnReport> {
  const since = options.since ?? DEFAULT_SINCE
  const top = options.top ?? DEFAULT_TOP

  const sinceArg = `--since=${since}`

  // Get file names per commit. Use a unique separator pattern so we can split commits.
  const SEP = '\x1F@@@GITXRAY_COMMIT@@@\x1F'
  const out = await runGit(
    ['log', '--format=format:%x1f@@@GITXRAY_COMMIT@@@%x1f', '--name-only', sinceArg],
    { cwd },
  )

  const repoRoot = (await runGit(['rev-parse', '--show-toplevel'], { cwd })).trim()
  const counts = new Map<string, number>()
  let totalCommits = 0
  const commits = out.split(SEP).filter(Boolean)
  for (const block of commits) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0)
      continue
    totalCommits++
    for (const file of lines) {
      const rel = relativize(file, repoRoot)
      if (isNoiseFile(rel))
        continue
      counts.set(rel, (counts.get(rel) ?? 0) + 1)
    }
  }

  const files = [...counts.entries()]
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top)

  return {
    files,
    totalFiles: counts.size,
    totalCommits,
    since,
  }
}
