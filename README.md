# @condorhero/git-xray

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

> Diagnose a new codebase with 5 git commands before reading a single file.

`git-xray` runs the same 5 `git log` diagnostics described in
[The Git Commands I Run Before Reading Any Code](https://piechowski.io/post/git-commands-before-reading-code/)
and renders the result both as a colorful terminal summary and as a
self-contained HTML report (dark/light, i18n, font/line controls, all charts inline).

## Quick start

```bash
# Use directly via npx — no install needed
npx -y @condorhero/git-xray

# Or specify a path
npx -y @condorhero/git-xray ./path/to/repo

# Generate an HTML report and open it in your browser
npx -y @condorhero/git-xray . --html git-xray-report.html --open

# Chinese report, last 6 months only
npx -y @condorhero/git-xray . --since "6 months ago" --lang zh
```

## CLI

> globally with `npm i -g @condorhero/git-xray` and then call `git-xray`

```
Usage:
  git-xray [dir] [options]

Arguments:
  dir                  Path to the git repository (default: current directory)

Options:
  --html [path]        Generate an HTML report (default: ./git-xray-report.html)
  --no-html            Skip HTML report generation
  --since <duration>   Time window for analysis (default: "1 year ago")
  --top <n>            Number of files in churn/bug hotspots (default: 20)
  --no-color           Disable colored terminal output
  --lang <zh|en>       Language for the HTML report (default: auto)
  --open               Open the HTML report after generation
  -h, --help           Show this help message
  -v, --version        Show tool version
```

## What it analyzes

| # | Module | git command |
|---|--------|------------|
| 1 | Churn hotspots | `git log --format=format: --name-only --since="1 year ago"` |
| 2 | Who built this (bus factor) | `git shortlog -sn --no-merges` + 6-month window |
| 3 | Bug cluster | `git log -i -E --grep="fix\|bug\|broken" --name-only` |
| 4 | Accelerating or dying | `git log --format='%ad' --date=format:'%Y-%m'` |
| 5 | Firefighting frequency | `git log -i -E --grep="revert\|hotfix\|emergency\|rollback"` |

Plus a cross-reference between churn and bugs to flag the highest-risk files
(those appearing on **both** lists).

## HTML report features

- 🌒 Dark / ☀️ Light theme toggle
- 🌐 English / 中文 switch
- 🔠 Adjustable font scale (A− / A / A+)
- ↕ Adjustable line height (compact / standard / loose)
- 📊 Inline SVG charts — no external assets
- 🚨 Critical / Warning risk pills on overlapping files
- 🎯 File-type icons (📘 📜 ⚙️ …)

The generated `.html` file is fully self-contained and can be opened from disk,
emailed, or shared without a server.

## Programmatic API

```ts
// Or write HTML yourself:
import { writeFile } from 'node:fs/promises'

import { renderHtml, renderTerminal, runReport } from '@condorhero/git-xray'

const report = await runReport({
  cwd: './my-project',
  since: '1 year ago',
  toolVersion: '1.0.0',
})

console.log(renderTerminal(report))
await writeFile('git-xray-report.html', renderHtml(report, 'en'), 'utf8')
```

## License

[MIT](https://github.com/condorheroblog/git-xray/blob/main/LICENSE) License © [Condor Hero](https://github.com/condorheroblog)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@condorhero/git-xray?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/@condorhero/git-xray
[npm-downloads-src]: https://img.shields.io/npm/dm/@condorhero/git-xray?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/@condorhero/git-xray
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@condorhero/git-xray?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@condorhero/git-xray
[license-src]: https://img.shields.io/github/license/condorheroblog/git-xray.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/condorheroblog/git-xray/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/@condorhero/git-xray
