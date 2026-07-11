/**
 * Inline CSS for the HTML report. CSS variables drive:
 *  - theme (dark default, light opt-in)
 *  - font scale (compact / default / large)
 *  - line height (compact / standard / loose)
 */

export function buildCss(): string {
  return `
:root {
  --bg: #0f1419;
  --bg-elev: #161c24;
  --bg-soft: #1d242d;
  --fg: #e6edf3;
  --fg-muted: #8b96a4;
  --border: #2a333e;
  --accent: #1fa669;
  --accent-soft: #1fa66922;
  --warn: #d29922;
  --warn-soft: #d2992222;
  --danger: #f85149;
  --danger-soft: #f8514922;
  --chart-1: #1fa669;
  --chart-2: #58a6ff;
  --chart-3: #d29922;
  --chart-4: #f85149;
  --chart-5: #bc8cff;
  --chart-grid: #2a333e;
  --shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  --radius: 12px;
  --font-scale: 1;
  --line-height: 1.6;
}

:root[data-theme="light"] {
  --bg: #fafbfc;
  --bg-elev: #ffffff;
  --bg-soft: #f3f5f8;
  --fg: #1f2328;
  --fg-muted: #59636e;
  --border: #d1d9e0;
  --accent: #1a7f37;
  --accent-soft: #1a7f3722;
  --warn: #9a6700;
  --warn-soft: #9a670022;
  --danger: #cf222e;
  --danger-soft: #cf222e22;
  --chart-grid: #d1d9e0;
  --shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

:root[data-font="small"]  { --font-scale: 0.9; }
:root[data-font="default"]{ --font-scale: 1; }
:root[data-font="large"]  { --font-scale: 1.15; }

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  font-size: calc(14px * var(--font-scale));
  line-height: var(--line-height);
  -webkit-font-smoothing: antialiased;
  transition: background-color .2s ease, color .2s ease;
}

a { color: var(--accent); }

.toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}

.toolbar .brand {
  font-weight: 700;
}

.toolbar button {
  background: var(--bg-soft);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9em;
  font-family: inherit;
  transition: all .15s ease;
}
.toolbar button:hover { border-color: var(--accent); color: var(--accent); }
.toolbar button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.toolbar .group { display: flex; gap: 4px; align-items: center; padding: 2px; background: var(--bg); border-radius: 10px; }
.toolbar .group span { color: var(--fg-muted); font-size: 0.85em; margin: 0 6px; }

main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.hero {
  margin-bottom: 32px;
}
.hero h1 {
  margin: 0 0 8px;
  font-size: 2em;
}
.hero p {
  margin: 0;
  color: var(--fg-muted);
}
.hero .meta {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.hero .meta .cell {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
}
.hero .meta .cell .k { color: var(--fg-muted); font-size: 0.8em; }
.hero .meta .cell .v { font-weight: 600; margin-top: 2px; word-break: break-all; }
.hero .meta .cell .v code {
  background: var(--bg-soft);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
  animation: slide-in .35s ease both;
}
@keyframes slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.card:hover { border-color: var(--accent); }

.card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.card header h2 { margin: 0; font-size: 1.4em; }
.card .desc { color: var(--fg-muted); margin: 0 0 16px; }
.card .grade {
  font-weight: 700;
  font-size: 1.1em;
  padding: 4px 10px;
  border-radius: 999px;
}
.grade.a { background: var(--accent-soft); color: var(--accent); }
.grade.b { background: var(--warn-soft);   color: var(--warn); }
.grade.c { background: var(--danger-soft); color: var(--danger); }

.bars { width: 100%; }
.bar-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.bar-row .file {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.bar-row .file .icon { flex-shrink: 0; }
.bar-row .file .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.92em;
}
.bar-row .count { text-align: right; font-variant-numeric: tabular-nums; color: var(--fg-muted); }

.bar-track {
  grid-column: 1 / -1;
  background: var(--bg-soft);
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  animation: fill-in .8s ease;
}
@keyframes fill-in { from { width: 0 !important; } }
.bar-row.risk-warning .bar-fill { background: var(--warn); }
.bar-row.risk-critical .bar-fill { background: var(--danger); }
.bar-row.risk-warning .count { color: var(--warn); }
.bar-row.risk-critical .count { color: var(--danger); }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75em;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.pill.critical { background: var(--danger-soft); color: var(--danger); }
.pill.warning  { background: var(--warn-soft);   color: var(--warn); }
.pill.ok       { background: var(--accent-soft); color: var(--accent); }

.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.summary-row .stat {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9em;
}
.summary-row .stat .k { color: var(--fg-muted); margin-right: 6px; }
.summary-row .stat .v { font-weight: 700; }

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table-wrap > table {
  min-width: 480px;
}
th, td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 0.95em;
}
th { color: var(--fg-muted); font-weight: 600; }
tr:hover td { background: var(--bg-soft); }
td code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.donut-wrap {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 24px;
  align-items: center;
}
.donut-legend { font-size: 0.9em; }
.donut-legend .item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
.donut-legend .swatch { width: 12px; height: 12px; border-radius: 3px; }

.contributor-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 80px 60px;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}
.contributor-row .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--fg-muted); }
.contributor-row.active .dot { background: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
.contributor-row .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.contributor-row .count { text-align: right; font-variant-numeric: tabular-nums; color: var(--fg-muted); }
.contributor-row .share { text-align: right; color: var(--fg-muted); font-size: 0.9em; }
.contributor-row .bar-mini {
  grid-column: 1 / -1;
  background: var(--bg-soft);
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}
.contributor-row .bar-mini > div {
  height: 100%;
  background: var(--accent);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.timeline .ev {
  display: grid;
  grid-template-columns: 80px 60px 1fr;
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg-soft);
  border-radius: 6px;
  border-left: 3px solid var(--danger);
}
.timeline .ev .hash { font-family: ui-monospace, monospace; color: var(--danger); }
.timeline .ev .date { color: var(--fg-muted); font-size: 0.9em; }
.timeline .ev .subject { word-break: break-word; }

.chart {
  width: 100%;
  height: auto;
  max-height: 600px;
  display: block;
}
.chart-wrap {
  width: 100%;
  overflow-x: auto;
}

footer {
  text-align: center;
  color: var(--fg-muted);
  font-size: 0.85em;
  padding: 24px;
}

@media (max-width: 720px) {
  .donut-wrap { grid-template-columns: 1fr; }
  .toolbar { flex-wrap: wrap; gap: 8px; padding: 10px 14px; }
  .hero .meta { grid-template-columns: 1fr 1fr; }
  main { padding: 20px 14px 48px; }
  .card { padding: 18px; }
  .contributor-row { grid-template-columns: 18px minmax(0, 1fr) 60px 56px; gap: 8px; }
  .timeline .ev { grid-template-columns: 70px 50px 1fr; gap: 8px; padding: 6px 8px; }
}
`.trim()
}
