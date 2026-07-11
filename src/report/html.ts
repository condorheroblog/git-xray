import type { ReportData } from '../core/types.ts'
import type { Dict, Locale } from './template.ts'
import {
  renderContributorsDonut,
  renderFirefightingChart,
  renderHBar,
  renderVelocityChart,
} from './charts.ts'
import { buildCss } from './styles.css.ts'
import { dict } from './template.ts'

const FILE_ICONS: Record<string, string> = {
  ts: '📘',
  tsx: '📘',
  js: '📜',
  jsx: '📜',
  mjs: '📜',
  cjs: '📜',
  json: '⚙️',
  yaml: '⚙️',
  yml: '⚙️',
  toml: '⚙️',
  md: '📝',
  mdx: '📝',
  txt: '📄',
  html: '🌐',
  css: '🎨',
  scss: '🎨',
  less: '🎨',
  vue: '💚',
  svelte: '🧡',
  py: '🐍',
  rb: '💎',
  go: '🐹',
  rs: '🦀',
  java: '☕',
  sh: '🐚',
  bash: '🐚',
  lock: '🔒',
  png: '🖼️',
  jpg: '🖼️',
  svg: '🖼️',
  gif: '🖼️',
}

export function fileIcon(file: string): string {
  const base = file.split('/').pop() ?? file
  if (/^package-lock\.json$|^pnpm-lock\.yaml$|^yarn\.lock$|^Cargo\.lock$/.test(base))
    return '🔒'
  const ext = base.includes('.') ? base.split('.').pop()!.toLowerCase() : ''
  return FILE_ICONS[ext] ?? '📄'
}

function gradeClass(g: 'A' | 'B' | 'C'): string {
  return `grade ${g.toLowerCase()}`
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildToolbar(t: Dict): string {
  return `
<div class="toolbar">
  <div class="brand">🩻 git-xray</div>
  <div style="display: flex; gap: 12px; align-items: center;">
    <div class="group" role="group" aria-label="Font size">
      <button data-font="small">${t.fontSmall}</button>
      <button data-font="default" class="active">${t.fontDefault}</button>
      <button data-font="large">${t.fontLarge}</button>
    </div>
    <span>·</span>
    <button id="lang-toggle">${t.langToggle}</button>
    <button id="theme-toggle">☀️</button>
  </div>
</div>
`
}

function buildHero(d: ReportData, t: Dict): string {
  return `
<section class="hero">
  <h1 data-t="title">${escapeHtml(t.title)}</h1>
  <p data-t="subtitle">${escapeHtml(t.subtitle)}</p>
  <div class="meta">
    <div class="cell"><div class="k" data-t="repo">${escapeHtml(t.repo)}</div><div class="v">${escapeHtml(d.meta.name)}</div></div>
    <div class="cell"><div class="k" data-t="head">${escapeHtml(t.head)}</div><div class="v"><code>${escapeHtml(d.meta.headShort)}</code></div></div>
    <div class="cell"><div class="k" data-t="generatedAt">${escapeHtml(t.generatedAt)}</div><div class="v">${escapeHtml(d.meta.generatedAtLocal)}</div></div>
    <div class="cell"><div class="k" data-t="elapsed">${escapeHtml(t.elapsed)}</div><div class="v">${d.meta.elapsedMs} ms</div></div>
    <div class="cell"><div class="k" data-t="version">${escapeHtml(t.version)}</div><div class="v"><code>v${escapeHtml(d.meta.toolVersion)}</code></div></div>
  </div>
</section>
`
}

function buildChurnCard(d: ReportData, t: Dict): string {
  if (d.churn.files.length === 0) {
    return card('churnTitle', 'churnDesc', '', `<p data-t="noData">${t.noData}</p>`, t)
  }
  const rows = d.churn.files.slice(0, 20).map(f => ({ label: f.file, value: f.count }))
  const criticalSet = new Set(d.cross.critical.map(c => c.file))
  const warningSet = new Set(d.cross.warning.map(c => c.file))
  const tableBody = d.churn.files.slice(0, 20).map((f) => {
    const risk = criticalSet.has(f.file) ? 'critical' : warningSet.has(f.file) ? 'warning' : 'ok'
    const pill = risk === 'critical'
      ? `<span class="pill critical" data-t="riskCritical">${t.riskCritical}</span>`
      : risk === 'warning'
        ? `<span class="pill warning" data-t="riskWarning">${t.riskWarning}</span>`
        : `<span class="pill ok" data-t="riskNormal">${t.riskNormal}</span>`
    return `
      <tr>
        <td>${fileIcon(f.file)} <code>${escapeHtml(f.file)}</code></td>
        <td style="text-align:right">${f.count}</td>
        <td>${pill}</td>
      </tr>`
  }).join('')
  const chart = `<div class="chart-wrap">${renderHBar(rows, { criticalSet, warningSet })}</div>`
  const table = `
    <div class="table-wrap">
      <table>
        <thead><tr><th data-t="fileLabel">${escapeHtml(t.fileLabel)}</th><th style="text-align:right" data-t="countLabel">${escapeHtml(t.countLabel)}</th><th data-t="riskLabel">Risk</th></tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  `
  return card('churnTitle', 'churnDesc', '', `${chart}${table}`, t)
}

function buildContributorsCard(d: ReportData, t: Dict): string {
  const g = d.contributors.grade
  const list = d.contributors.contributors.slice(0, 15).map((c) => {
    const max = d.contributors.contributors[0]?.commits ?? 1
    const w = Math.max(2, (c.commits / max) * 100)
    return `
      <div class="contributor-row ${c.active ? 'active' : ''}">
        <div class="dot"></div>
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="count">${c.commits}</div>
        <div class="share">${pct(c.share)}</div>
        <div class="bar-mini"><div style="width:${w.toFixed(1)}%"></div></div>
      </div>`
  }).join('')
  const donut = renderContributorsDonut(d.contributors.contributors)
  const stats = `
    <div class="summary-row">
      <div class="stat"><span class="k" data-t="topShare">${escapeHtml(t.topShare)}</span><span class="v">${pct(d.contributors.topShare)}</span></div>
      <div class="stat"><span class="k" data-t="activeRatio">${escapeHtml(t.activeRatio)}</span><span class="v">${d.contributors.activeCount}/${d.contributors.totalCount}</span></div>
      <div class="stat"><span class="k" data-t="commitsLabel">${escapeHtml(t.commitsLabel)}</span><span class="v">${d.contributors.totalCommits}</span></div>
    </div>
  `
  return card(
    'contributorsTitle',
    'contributorsDesc',
    `<span class="${gradeClass(g)}">${g}</span>`,
    `${stats}<div class="donut-wrap"><div>${list}</div><div class="donut-legend">${donut}<div class="item"><span class="swatch" style="background:var(--accent)"></span> <span data-t="legendActive">🟢 Active (last 6 mo)</span></div><div class="item"><span class="swatch" style="background:var(--fg-muted);opacity:.4"></span> <span data-t="legendInactive">⚫ Inactive</span></div></div></div>`,
    t,
  )
}

function buildBugsCard(d: ReportData, t: Dict): string {
  if (d.bugs.files.length === 0) {
    return card('bugsTitle', 'bugsDesc', '', `<p data-t="noData">${t.noData}</p>`, t)
  }
  const rows = d.bugs.files.slice(0, 20).map(f => ({ label: f.file, value: f.count }))
  const criticalSet = new Set(d.cross.critical.map(c => c.file))
  const warningSet = new Set(d.cross.warning.map(c => c.file))
  const chart = `<div class="chart-wrap">${renderHBar(rows, { criticalSet, warningSet })}</div>`
  const tableBody = d.bugs.files.slice(0, 20).map((f) => {
    const risk = criticalSet.has(f.file) ? 'critical' : warningSet.has(f.file) ? 'warning' : 'ok'
    const pill = risk === 'critical'
      ? `<span class="pill critical" data-t="riskCritical">${t.riskCritical}</span>`
      : risk === 'warning'
        ? `<span class="pill warning" data-t="riskWarning">${t.riskWarning}</span>`
        : `<span class="pill ok" data-t="riskNormal">${t.riskNormal}</span>`
    return `
      <tr>
        <td>${fileIcon(f.file)} <code>${escapeHtml(f.file)}</code></td>
        <td style="text-align:right">${f.count}</td>
        <td>${pill}</td>
      </tr>`
  }).join('')
  const table = `
    <div class="table-wrap">
      <table>
        <thead><tr><th data-t="fileLabel">${escapeHtml(t.fileLabel)}</th><th style="text-align:right" data-t="countLabel">${escapeHtml(t.countLabel)}</th><th data-t="riskLabel">Risk</th></tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  `
  return card('bugsTitle', 'bugsDesc', '', `${chart}${table}`, t)
}

function buildVelocityCard(d: ReportData, t: Dict): string {
  const g = d.velocity.grade
  const chart = `<div class="chart-wrap">${renderVelocityChart(d.velocity.history)}</div>`
  const ratio = d.velocity.ratio !== undefined ? `${pct(d.velocity.ratio)}` : '—'
  const stats = `
    <div class="summary-row">
      <div class="stat"><span class="k" data-t="recentAvg">${escapeHtml(t.recentAvg)}</span><span class="v">${d.velocity.recentAvg.toFixed(1)}</span></div>
      <div class="stat"><span class="k" data-t="previousAvg">${escapeHtml(t.previousAvg)}</span><span class="v">${d.velocity.previousAvg.toFixed(1)}</span></div>
      <div class="stat"><span class="k" data-t="ratio">Ratio</span><span class="v">${ratio}</span></div>
    </div>
  `
  return card('velocityTitle', 'velocityDesc', `<span class="${gradeClass(g)}">${g}</span>`, `${stats}${chart}`, t)
}

function buildFirefightingCard(d: ReportData, t: Dict): string {
  const g = d.firefighting.grade
  const list = d.firefighting.events.slice(0, 30).map(e => `
    <div class="ev">
      <span class="hash">${escapeHtml(e.hash)}</span>
      <span class="date">${escapeHtml(e.date.slice(0, 10))}</span>
      <span class="subject">${escapeHtml(e.subject)}</span>
    </div>`).join('')
  const timeline = d.firefighting.events.length === 0
    ? `<p data-t="noData">${t.noData}</p>`
    : `<div class="timeline">${list}</div>`
  const chart = d.firefighting.byMonth.length > 0 ? `<div class="chart-wrap">${renderFirefightingChart(d.firefighting.byMonth)}</div>` : ''
  const stats = `
    <div class="summary-row">
      <div class="stat"><span class="k" data-t="totalEvents">${escapeHtml(t.totalEvents)}</span><span class="v">${d.firefighting.events.length}</span></div>
      <div class="stat"><span class="k" data-t="perMonth">${escapeHtml(t.perMonth)}</span><span class="v">${d.firefighting.perMonthAvg.toFixed(2)}</span></div>
    </div>
  `
  return card('firefightingTitle', 'firefightingDesc', `<span class="${gradeClass(g)}">${g}</span>`, `${stats}${chart}${timeline}`, t)
}

function buildCrossCard(d: ReportData, t: Dict): string {
  const rows = [...d.cross.critical, ...d.cross.warning]
  if (rows.length === 0) {
    return card('crossTitle', 'crossDesc', '', `<p data-t="noIssues">${escapeHtml(t.noIssues)}</p>`, t)
  }
  const body = rows.map((r) => {
    const pill = r.risk === 'critical'
      ? `<span class="pill critical" data-t="riskCritical">${t.riskCritical}</span>`
      : `<span class="pill warning" data-t="riskWarning">${t.riskWarning}</span>`
    return `
    <tr>
      <td>${fileIcon(r.file)} <code>${escapeHtml(r.file)}</code></td>
      <td style="text-align:right">${r.churnCount}</td>
      <td style="text-align:right">${r.bugCount}</td>
      <td>${pill}</td>
    </tr>`
  }).join('')
  const table = `
    <div class="table-wrap">
      <table>
        <thead><tr><th data-t="fileLabel">${escapeHtml(t.fileLabel)}</th><th style="text-align:right" data-t="churn">Churn</th><th style="text-align:right" data-t="bugs">Bugs</th><th data-t="riskLabel">Risk</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `
  return card('crossTitle', 'crossDesc', '', table, t)
}

function card(titleKey: keyof Dict, descKey: keyof Dict, badge: string, body: string, t: Dict): string {
  return `
<article class="card">
  <header>
    <h2 data-t="${titleKey}">${escapeHtml(t[titleKey] as string)}</h2>
    ${badge}
  </header>
  <p class="desc" data-t="${descKey}">${escapeHtml(t[descKey] as string)}</p>
  ${body}
</article>
`
}

/**
 * Build a complete self-contained HTML document string for the report.
 */
export function renderHtml(d: ReportData, locale: Locale = 'en'): string {
  const t = dict[locale]
  const css = buildCss()
  const body = [
    buildHero(d, t),
    buildChurnCard(d, t),
    buildContributorsCard(d, t),
    buildBugsCard(d, t),
    buildVelocityCard(d, t),
    buildFirefightingCard(d, t),
    buildCrossCard(d, t),
  ].join('\n')

  return `<!DOCTYPE html>
<html lang="${locale}" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(t.title)} — ${escapeHtml(d.meta.name)}</title>
<style>${css}</style>
</head>
<body>
${buildToolbar(t)}
<main>
${body}
</main>
<footer>${escapeHtml(t.footerNote)}</footer>
<script>
(function() {
  var root = document.documentElement;
  // Initialize root font attribute. We can't put data-font on <html> in the
  // static markup because querySelectorAll('[data-font]') would also match
  // <html> and clobber its textContent (turning the page into raw text).
  root.setAttribute('data-font', 'default');
  var data = ${JSON.stringify(d)};
  var dict = ${JSON.stringify(dict)};
  var currentLang = '${locale}';

  // Inline translations for items rendered with literal text in markup.
  var inline = {
    en: { riskLabel: 'Risk', legendActive: '🟢 Active (last 6 mo)', legendInactive: '⚫ Inactive', ratio: 'Ratio', churn: 'Churn', bugs: 'Bugs' },
    zh: { riskLabel: '风险', legendActive: '🟢 近 6 个月活跃', legendInactive: '⚫ 不活跃', ratio: '比值', churn: '变更频次', bugs: 'Bug 次数' }
  };

  function setLang(lang) {
    currentLang = lang;
    root.setAttribute('lang', lang);
    var t = dict[lang];
    document.title = t.title + ' — ' + data.meta.name;
    var fontMap = { small: t.fontSmall, 'default': t.fontDefault, large: t.fontLarge };
    document.querySelectorAll('button[data-font]').forEach(function(b){
      b.textContent = fontMap[b.getAttribute('data-font')];
    });
    var langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = t.langToggle;
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    // Update every translatable text node marked with data-t.
    document.querySelectorAll('[data-t]').forEach(function(el){
      var key = el.getAttribute('data-t');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      } else if (inline[lang] && inline[lang][key] !== undefined) {
        el.textContent = inline[lang][key];
      }
    });
  }

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  themeBtn.addEventListener('click', function(){
    var cur = root.getAttribute('data-theme');
    root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    themeBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  });

  // Lang toggle
  document.getElementById('lang-toggle').addEventListener('click', function(){
    setLang(currentLang === 'en' ? 'zh' : 'en');
  });

  // Font group: set the matching data-* attribute on <html>, which the
  // CSS attribute selectors use to drive the font-scale variable.
  document.querySelectorAll('button[data-font]').forEach(function(btn){
    btn.addEventListener('click', function(){
      root.setAttribute('data-font', btn.getAttribute('data-font'));
      document.querySelectorAll('button[data-font]').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
})();
</script>
</body>
</html>
`
}
