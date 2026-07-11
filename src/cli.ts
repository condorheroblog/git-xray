#!/usr/bin/env node
import type { Locale } from './report/template.ts'
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { runReport } from './core/index.ts'
import { renderHtml } from './report/html.ts'
import { renderTerminal } from './report/terminal.ts'

const VERSION = await readToolVersion()

async function readToolVersion(): Promise<string> {
  try {
    // Resolve the current file's location and walk up to the package.json.
    // Works for both `src/cli.ts` (dev) and `dist/cli.mjs` (built) since both
    // share the project root.
    const here = path.dirname(fileURLToPath(import.meta.url))
    const pkgPath = path.resolve(here, '..', 'package.json')
    const raw = await readFile(pkgPath, 'utf8')
    const pkg = JSON.parse(raw) as { version?: unknown }
    if (typeof pkg.version === 'string' && pkg.version)
      return pkg.version
  }
  catch {
    // fall through to fallback
  }
  return '0.0.0'
}

interface CliArgs {
  cwd: string
  html: string | null
  noHtml: boolean
  since: string
  top: number
  noColor: boolean
  lang: Locale
  open: boolean
  help: boolean
  version: boolean
}

function printHelp(): void {
  const help = `
🩻  git-xray — diagnose a codebase before reading it

Usage:
  git-xray [dir] [options]

Arguments:
  dir                  Path to the git repository (default: current directory)

Options:
  --html [path]        Generate an HTML report. Optional path (default: ./git-xray-report.html)
  --no-html            Skip HTML report generation, only print to terminal
  --since <duration>   Time window for analysis (default: "1 year ago")
  --top <n>            Number of files in churn/bug hotspots (default: 20)
  --no-color           Disable colored terminal output
  --lang <zh|en>       Language for the HTML report (default: auto-detect)
  --open               Open the HTML report in the default browser after generation
  -h, --help           Show this help message
  -v, --version        Show tool version

Examples:
  git-xray
  git-xray . --html git-xray-report.html
  git-xray ~/projects/foo --since "6 months ago" --lang zh --open
`.trim()
  process.stdout.write(`${help}\n`)
}

function detectLocale(): Locale {
  const l = (process.env.LANG || process.env.LC_ALL || '').toLowerCase()
  if (l.startsWith('zh'))
    return 'zh'
  return 'en'
}

function parseArgs(argv: string[]): { args: CliArgs, positional: string[] } {
  const args: CliArgs = {
    cwd: process.cwd(),
    html: null,
    noHtml: false,
    since: '1 year ago',
    top: 20,
    noColor: false,
    lang: detectLocale(),
    open: false,
    help: false,
    version: false,
  }
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-h' || a === '--help') {
      args.help = true
    }
    else if (a === '-v' || a === '--version') {
      args.version = true
    }
    else if (a === '--no-color') {
      args.noColor = true
    }
    else if (a === '--no-html') {
      args.noHtml = true
    }
    else if (a === '--open') {
      args.open = true
    }
    else if (a === '--html') {
      // either --html path or --html (defaults to ./git-xray-report.html)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        args.html = next
        i++
      }
      else {
        args.html = './git-xray-report.html'
      }
    }
    else if (a.startsWith('--html=')) {
      args.html = a.slice('--html='.length)
    }
    else if (a === '--since') {
      const next = argv[++i]
      if (next)
        args.since = next
    }
    else if (a.startsWith('--since=')) {
      args.since = a.slice('--since='.length)
    }
    else if (a === '--top') {
      const next = argv[++i]
      if (next)
        args.top = Number(next) || args.top
    }
    else if (a.startsWith('--top=')) {
      args.top = Number(a.slice('--top='.length)) || args.top
    }
    else if (a === '--lang') {
      const next = argv[++i]
      if (next === 'zh' || next === 'en')
        args.lang = next
    }
    else if (a.startsWith('--lang=')) {
      const v = a.slice('--lang='.length)
      if (v === 'zh' || v === 'en')
        args.lang = v
    }
    else if (a.startsWith('--')) {
      process.stderr.write(`⚠️  Unknown option: ${a}\n`)
    }
    else {
      positional.push(a)
    }
  }

  if (positional[0])
    args.cwd = path.resolve(args.cwd, positional[0])

  // Default: also produce HTML unless --no-html
  if (!args.noHtml && args.html === null)
    args.html = './git-xray-report.html'

  return { args, positional }
}

async function openInBrowser(target: string): Promise<void> {
  const abs = path.resolve(target)
  const cmd = (() => {
    if (process.platform === 'darwin')
      return { bin: 'open', args: [abs] }
    if (process.platform === 'win32')
      return { bin: 'cmd', args: ['/c', 'start', '', abs] }
    return { bin: 'xdg-open', args: [abs] }
  })()
  try {
    const proc = spawn(cmd.bin, cmd.args, { stdio: 'ignore', detached: true })
    proc.unref()
  }
  catch {
    // best-effort
  }
}

async function main(): Promise<void> {
  const { args } = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }
  if (args.version) {
    process.stdout.write(`git-xray ${VERSION}\n`)
    return
  }

  if (args.noColor)
    process.env.NO_COLOR = '1'

  const spinner = process.stderr.isTTY
    ? (msg: string) => process.stderr.write(`\r⏳ ${msg}   `)
    : null
  const tick = (msg: string): void => {
    spinner?.(msg)
  }
  tick('Running git analysis…')

  let report
  try {
    report = await runReport({
      cwd: args.cwd,
      since: args.since,
      top: args.top,
      toolVersion: VERSION,
      locale: args.lang,
    })
  }
  catch (err) {
    spinner && process.stderr.write('\n')
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`❌ ${msg}\n`)
    process.exitCode = 1
    return
  }
  spinner && process.stderr.write('\n')

  // Terminal output
  process.stdout.write(`${renderTerminal(report)}\n`)

  // HTML output
  if (args.html) {
    const html = renderHtml(report, args.lang)
    const outPath = path.resolve(args.cwd, args.html)
    await writeFile(outPath, html, 'utf8')
    process.stderr.write(`📄 HTML report written to ${outPath}\n`)
    if (args.open)
      await openInBrowser(outPath)
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err)
  process.stderr.write(`❌ ${msg}\n`)
  process.exitCode = 1
})
