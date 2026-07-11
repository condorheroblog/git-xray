import type { ContributorEntry, VelocityMonth } from '../core/types.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(width: number, height: number, body: string): string {
  // Use xMidYMid meet so text/lines don't stretch on narrow viewports.
  return `<svg class="chart" xmlns="${SVG_NS}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${body}</svg>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Horizontal bar chart for file churn / bugs.
 * Highlights `criticalFiles` (in red) and `warningFiles` (in yellow).
 */
export function renderHBar(
  rows: { label: string, value: number }[],
  opts: { criticalSet?: Set<string>, warningSet?: Set<string>, height?: number } = {},
): string {
  if (rows.length === 0)
    return ''
  const barH = 18
  const gap = 6
  const labelW = 220
  const valueW = 40
  const padding = 12
  const width = 720
  const height = padding * 2 + rows.length * (barH + gap)
  const trackX = labelW + padding
  const trackW = width - labelW - valueW - padding * 2
  const max = Math.max(...rows.map(r => r.value), 1)

  const bars = rows.map((r, i) => {
    const y = padding + i * (barH + gap)
    const fillW = Math.max(2, (r.value / max) * trackW)
    const risk = opts.criticalSet?.has(r.label)
      ? 'critical'
      : opts.warningSet?.has(r.label) ? 'warning' : 'normal'
    const color = risk === 'critical' ? 'var(--danger)' : risk === 'warning' ? 'var(--warn)' : 'var(--accent)'
    return `
      <text x="${padding}" y="${y + barH * 0.65}" font-size="12" font-family="ui-monospace,monospace" fill="var(--fg)">${escapeXml(truncate(r.label, 28))}</text>
      <rect x="${trackX}" y="${y}" width="${trackW}" height="${barH}" fill="var(--bg-soft)" rx="3" />
      <rect x="${trackX}" y="${y}" width="${fillW}" height="${barH}" fill="${color}" rx="3">
        <title>${escapeXml(r.label)} — ${r.value}</title>
      </rect>
      <text x="${width - padding}" y="${y + barH * 0.65}" font-size="12" text-anchor="end" fill="var(--fg-muted)">${r.value}</text>
    `
  }).join('')

  return svg(width, Math.min(height, opts.height ?? 600), bars)
}

/**
 * Combined bar + line chart for monthly commit velocity.
 */
export function renderVelocityChart(history: VelocityMonth[]): string {
  if (history.length === 0)
    return ''
  const width = 720
  const height = 240
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const max = Math.max(...history.map(h => h.count), 1)
  const stepX = innerW / Math.max(1, history.length - 1)

  const bars = history.map((h, i) => {
    const x = padL + i * stepX - 4
    const barH = (h.count / max) * innerH
    const y = padT + innerH - barH
    return `<rect x="${x}" y="${y}" width="8" height="${barH}" fill="var(--accent)" rx="2"><title>${h.month}: ${h.count}</title></rect>`
  }).join('')

  const linePts = history.map((h, i) => {
    const x = padL + i * stepX
    const y = padT + innerH - (h.count / max) * innerH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  // x-axis labels (every Nth to avoid clutter)
  const labelStep = Math.max(1, Math.ceil(history.length / 8))
  const labels = history.map((h, i) => {
    if (i % labelStep !== 0 && i !== history.length - 1)
      return ''
    const x = padL + i * stepX
    return `<text x="${x.toFixed(1)}" y="${height - 8}" font-size="10" text-anchor="middle" fill="var(--fg-muted)">${h.month}</text>`
  }).join('')

  // y grid
  const gridLines = [0.25, 0.5, 0.75, 1].map((p) => {
    const y = padT + innerH * (1 - p)
    const v = Math.round(max * p)
    return `<line x1="${padL}" x2="${width - padR}" y1="${y}" y2="${y}" stroke="var(--chart-grid)" stroke-dasharray="2 4"/>
            <text x="${padL - 6}" y="${y + 3}" font-size="10" text-anchor="end" fill="var(--fg-muted)">${v}</text>`
  }).join('')

  return svg(width, height, `
    ${gridLines}
    ${bars}
    <polyline points="${linePts}" fill="none" stroke="var(--chart-2)" stroke-width="2" opacity="0.85"/>
    ${history.map((h, i) => {
      const x = padL + i * stepX
      const y = padT + innerH - (h.count / max) * innerH
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="var(--chart-2)"><title>${h.month}: ${h.count}</title></circle>`
    }).join('')}
    ${labels}
  `)
}

/**
 * Donut chart for active vs inactive contributors.
 */
export function renderContributorsDonut(contributors: ContributorEntry[]): string {
  const totalCommits = contributors.reduce((a, c) => a + c.commits, 0)
  const activeCommits = contributors.filter(c => c.active).reduce((a, c) => a + c.commits, 0)
  const inactiveCommits = totalCommits - activeCommits
  if (totalCommits === 0)
    return ''

  const cx = 90
  const cy = 90
  const r = 70
  const inner = 42

  const activeAngle = (activeCommits / totalCommits) * Math.PI * 2
  const inactiveAngle = (inactiveCommits / totalCommits) * Math.PI * 2

  const polar = (angle: number): { x: number, y: number } => ({ x: cx + r * Math.cos(angle - Math.PI / 2), y: cy + r * Math.sin(angle - Math.PI / 2) })
  const a1 = polar(activeAngle)
  const innerA1 = polar(activeAngle)
  const largeArc = activeAngle > Math.PI ? 1 : 0

  const activePath = `M ${cx} ${cy} L ${a1.x.toFixed(2)} ${a1.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${innerA1.x.toFixed(2)} ${innerA1.y.toFixed(2)} Z`

  const a2 = polar(activeAngle + inactiveAngle)
  const largeArc2 = inactiveAngle > Math.PI ? 1 : 0
  const inactivePath = `M ${cx} ${cy} L ${innerA1.x.toFixed(2)} ${innerA1.y.toFixed(2)} A ${r} ${r} 0 ${largeArc2} 1 ${a2.x.toFixed(2)} ${a2.y.toFixed(2)} Z`

  return svg(180, 180, `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--bg-soft)" />
    <path d="${activePath}" fill="var(--accent)"><title>Active: ${activeCommits} commits</title></path>
    <path d="${inactivePath}" fill="var(--fg-muted)" opacity="0.4"><title>Inactive: ${inactiveCommits} commits</title></path>
    <circle cx="${cx}" cy="${cy}" r="${inner}" fill="var(--bg-elev)" />
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" fill="var(--fg-muted)">Active</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--fg)">${Math.round((activeCommits / totalCommits) * 100)}%</text>
  `)
}

/**
 * Bar chart for firefighting events by month.
 */
export function renderFirefightingChart(byMonth: VelocityMonth[]): string {
  if (byMonth.length === 0)
    return ''
  const width = 720
  const height = 200
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const max = Math.max(...byMonth.map(b => b.count), 1)
  const slot = innerW / byMonth.length
  const barW = Math.max(4, slot * 0.7)

  const bars = byMonth.map((b, i) => {
    const x = padL + i * slot + (slot - barW) / 2
    const h = (b.count / max) * innerH
    const y = padT + innerH - h
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="var(--danger)" rx="2"><title>${b.month}: ${b.count}</title></rect>`
  }).join('')

  const labels = byMonth.map((b, i) => {
    const x = padL + i * slot + slot / 2
    return `<text x="${x.toFixed(1)}" y="${height - 8}" font-size="10" text-anchor="middle" fill="var(--fg-muted)">${b.month}</text>`
  }).join('')

  return svg(width, height, `${bars}${labels}`)
}

function truncate(s: string, n: number): string {
  return s.length > n ? `…${s.slice(-(n - 1))}` : s
}
