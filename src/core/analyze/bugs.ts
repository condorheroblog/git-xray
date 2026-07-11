import type { BugsReport } from '../types.ts'
import { isNoiseFile, relativize } from '../../utils/path.ts'
import { runGit } from '../git.ts'

const DEFAULT_TOP = 20
const DEFAULT_SINCE = '1 year ago'
const BUG_PATTERN = 'fix|bug|broken'

/**
 * Module 3 — Where do bugs cluster.
 * Mirrors the blog's command:
 *   git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20
 */
export async function analyzeBugs(
  cwd: string,
  options: { since?: string, top?: number } = {},
): Promise<BugsReport> {
  const since = options.since ?? DEFAULT_SINCE
  const top = options.top ?? DEFAULT_TOP

  // The blog uses --grep with extended regex; --name-only with empty format prints file names per matched commit.
  const out = await runGit(
    [
      'log',
      '-i',
      '-E',
      `--grep=${BUG_PATTERN}`,
      '--name-only',
      '--format=',
      `--since=${since}`,
    ],
    { cwd },
  )

  const repoRoot = (await runGit(['rev-parse', '--show-toplevel'], { cwd })).trim()
  const counts = new Map<string, number>()
  const commits = new Set<string>()
  const blocks = out.split(/\n{2,}/)
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0)
      continue
    commits.add(lines.join('\n'))
    for (const file of lines) {
      if (!file.includes('/') && !file.includes('.'))
        continue
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
    totalCommits: commits.size,
    since,
  }
}
