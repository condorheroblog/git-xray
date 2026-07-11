import type { ReportData } from '../core/types.ts'
import process from 'node:process'

/**
 * Tiny zero-dep ANSI color helpers. Auto-disabled when stdout is not a TTY
 * or when NO_COLOR env var is set.
 */
const useColor
  = process.stdout.isTTY === true
    && !process.env.NO_COLOR
    && process.env.TERM !== 'dumb'

function wrap(open: number, close: number) {
  return (s: string) =>
    useColor ? `\u001B[${open}m${s}\u001B[${close}m` : s
}

const c = {
  reset: wrap(0, 0),
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
}

function bar(value: number, max: number, width = 30): string {
  if (max <= 0)
    return ''
  const filled = Math.max(0, Math.round((value / max) * width))
  return '█'.repeat(filled) + '·'.repeat(width - filled)
}

function gradeBadge(g: 'A' | 'B' | 'C'): string {
  if (g === 'A')
    return c.green(`[${g}]`)
  if (g === 'B')
    return c.yellow(`[${g}]`)
  return c.red(`[${g}]`)
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function heading(emoji: string, title: string): string {
  return `\n${c.bold(c.cyan(`${emoji}  ${title}`))}\n${c.gray('─'.repeat(60))}`
}

export function renderTerminal(data: ReportData): string {
  const lines: string[] = []

  lines.push('')
  lines.push(c.bold(c.magenta('🩻  git-xray report')))
  lines.push(c.gray('─'.repeat(60)))
  lines.push(`${c.bold('Repository:')}     ${data.meta.name}`)
  lines.push(`${c.bold('Path:')}           ${data.meta.path}`)
  lines.push(`${c.bold('HEAD:')}           ${data.meta.headShort}`)
  lines.push(`${c.bold('Generated:')}      ${data.meta.generatedAtLocal}`)
  lines.push(`${c.bold('Elapsed:')}        ${data.meta.elapsedMs} ms`)
  lines.push(`${c.bold('Tool version:')}   ${data.meta.toolVersion}`)

  // Churn
  lines.push(heading('📁', '1. Churn Hotspots (most-changed files)'))
  if (data.churn.files.length === 0) {
    lines.push(c.gray('  (no churn in window)'))
  }
  else {
    const max = data.churn.files[0].count
    for (const f of data.churn.files.slice(0, 10)) {
      lines.push(`  ${c.yellow(String(f.count).padStart(4))}  ${c.cyan(bar(f.count, max, 24))}  ${f.file}`)
    }
  }

  // Contributors
  lines.push(heading('👥', '2. Who Built This (Bus Factor)'))
  lines.push(`  ${c.bold('Grade:')} ${gradeBadge(data.contributors.grade)}  ${c.dim(`top share: ${pct(data.contributors.topShare)} · active (6mo): ${data.contributors.activeCount}/${data.contributors.totalCount}`)}`)
  for (const c0 of data.contributors.contributors.slice(0, 10)) {
    const mark = c0.active ? c.green('●') : c.gray('○')
    lines.push(`  ${mark} ${c0.name.padEnd(28)} ${String(c0.commits).padStart(5)}  ${c.dim(pct(c0.share))}`)
  }

  // Bugs
  lines.push(heading('🐛', '3. Where Do Bugs Cluster'))
  if (data.bugs.files.length === 0) {
    lines.push(c.gray('  (no bug-keyword commits in window)'))
  }
  else {
    const max = data.bugs.files[0].count
    for (const f of data.bugs.files.slice(0, 10)) {
      lines.push(`  ${c.red(String(f.count).padStart(4))}  ${c.cyan(bar(f.count, max, 24))}  ${f.file}`)
    }
  }

  // Velocity
  lines.push(heading('📈', '4. Accelerating or Dying'))
  lines.push(`  ${c.bold('Grade:')} ${gradeBadge(data.velocity.grade)}  ${c.dim(`recent avg: ${data.velocity.recentAvg.toFixed(1)}/mo · previous avg: ${data.velocity.previousAvg.toFixed(1)}/mo`)}`)
  const hist = data.velocity.history.slice(-12)
  const histMax = Math.max(1, ...hist.map(h => h.count))
  for (const h of hist) {
    lines.push(`  ${c.dim(h.month)}  ${c.cyan(bar(h.count, histMax, 24))}  ${h.count}`)
  }

  // Firefighting
  lines.push(heading('🚨', '5. Firefighting Frequency'))
  lines.push(`  ${c.bold('Grade:')} ${gradeBadge(data.firefighting.grade)}  ${c.dim(`events: ${data.firefighting.events.length} · avg: ${data.firefighting.perMonthAvg.toFixed(2)}/mo`)}`)
  for (const e of data.firefighting.events.slice(0, 8)) {
    lines.push(`  ${c.red(e.hash)} ${c.dim(e.date.slice(0, 10))}  ${e.subject}`)
  }
  if (data.firefighting.events.length > 8)
    lines.push(c.gray(`  … and ${data.firefighting.events.length - 8} more`))

  // Cross risk
  lines.push(heading('🔥', 'Cross-Risk Files'))
  if (data.cross.critical.length === 0 && data.cross.warning.length === 0) {
    lines.push(c.gray('  (no overlapping churn × bug hotspots)'))
  }
  else {
    for (const r of data.cross.critical) {
      lines.push(`  ${c.red('CRITICAL')} ${r.file}  ${c.dim(`(churn ${r.churnCount}, bugs ${r.bugCount})`)}`)
    }
    for (const r of data.cross.warning) {
      lines.push(`  ${c.yellow('WARNING ')} ${r.file}  ${c.dim(`(churn ${r.churnCount}, bugs ${r.bugCount})`)}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}
