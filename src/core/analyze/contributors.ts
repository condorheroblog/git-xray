import type { ContributorEntry, ContributorsReport, Grade } from '../types.ts'
import { runGit } from '../git.ts'

const RECENT_WINDOW = '6 months ago'

function gradeBusFactor(topShare: number, activeCount: number, totalCount: number): Grade {
  if (topShare > 0.6)
    return 'C'
  if (topShare > 0.4)
    return 'B'
  if (totalCount >= 5 && activeCount <= 1)
    return 'C'
  if (totalCount >= 5 && activeCount <= 2)
    return 'B'
  return 'A'
}

/** Parse `git shortlog -sn --no-merges` output. */
function parseShortlog(raw: string): Map<string, { commits: number, email: string, name: string }> {
  const map = new Map<string, { commits: number, email: string, name: string }>()
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.replace(/[ \t]+$/, '')
    if (!line)
      continue
    // Split into "<count>" and "<rest>" at the first non-digit boundary.
    let i = 0
    while (i < line.length && (line[i] === ' ' || line[i] === '\t'))
      i++
    const countStart = i
    while (i < line.length && line[i] >= '0' && line[i] <= '9')
      i++
    if (i === countStart)
      continue
    const commits = Number(line.slice(countStart, i))
    if (!Number.isFinite(commits))
      continue
    while (i < line.length && (line[i] === ' ' || line[i] === '\t'))
      i++
    let rest = line.slice(i)
    let email = ''
    // Peel off a trailing "<email>" if present.
    const lastLt = rest.lastIndexOf('<')
    const lastGt = rest.lastIndexOf('>')
    if (lastLt > 0 && lastGt > lastLt) {
      email = rest.slice(lastLt + 1, lastGt).trim()
      rest = rest.slice(0, lastLt).replace(/[ \t]+$/, '')
    }
    const name = rest
    const key = email || name
    if (!key)
      continue
    map.set(key, { commits, email, name })
  }
  return map
}

/**
 * Module 2 — Who built this (bus factor).
 * Combines the all-time `shortlog` with a 6-month activity window.
 */
export async function analyzeContributors(cwd: string): Promise<ContributorsReport> {
  const [allRaw, recentRaw] = await Promise.all([
    runGit(['shortlog', '-sn', '--no-merges', '-e', 'HEAD'], { cwd }),
    runGit(['shortlog', '--since', RECENT_WINDOW, '-sn', '--no-merges', '-e', 'HEAD'], { cwd }),
  ])

  const all = parseShortlog(allRaw)
  const recent = parseShortlog(recentRaw)
  const totalCommits = [...all.values()].reduce((acc, v) => acc + v.commits, 0)

  const contributors: ContributorEntry[] = [...all.entries()]
    .map(([key, v]) => ({
      name: v.name,
      email: v.email,
      commits: v.commits,
      share: totalCommits > 0 ? v.commits / totalCommits : 0,
      active: recent.has(key),
    }))
    .sort((a, b) => b.commits - a.commits)

  const topShare = contributors[0]?.share ?? 0
  const activeCount = contributors.filter(c => c.active).length

  return {
    contributors,
    totalCommits,
    topShare,
    activeCount,
    totalCount: contributors.length,
    grade: gradeBusFactor(topShare, activeCount, contributors.length),
  }
}
