import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crossReference } from '../src/core/cross.ts'
import { runReport } from '../src/core/index.ts'
import { renderHtml } from '../src/report/html.ts'
import { renderTerminal } from '../src/report/terminal.ts'

const RUNNING = process.env.CI !== 'true' && process.env.SKIP_GIT_TEST !== 'true'

function git(cwd: string, args: string[]): void {
  const res = spawnSync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Test User',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test User',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      GIT_PAGER: 'cat',
    },
    stdio: 'pipe',
  })
  if (res.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${res.stderr?.toString()}`)
  }
}

async function setupRepo(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'xray-test-'))
  git(dir, ['init', '-q', '--initial-branch=main'])
  git(dir, ['config', 'user.email', 'test@example.com'])
  git(dir, ['config', 'user.name', 'Test User'])

  await mkdir(path.join(dir, 'src'), { recursive: true })

  // src/app.ts — frequently changed
  for (let i = 0; i < 5; i++) {
    await writeFile(path.join(dir, 'src/app.ts'), `export const v = ${i}\n`)
    git(dir, ['add', '.'])
    git(dir, ['commit', '-q', '-m', `update app v${i}`])
  }

  // src/buggy.ts — fix commits
  await writeFile(path.join(dir, 'src/buggy.ts'), 'export const x = 1\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'init buggy'])
  for (let i = 0; i < 3; i++) {
    await writeFile(path.join(dir, 'src/buggy.ts'), `export const x = ${i + 2}\n`)
    git(dir, ['add', '.'])
    git(dir, ['commit', '-q', '-m', `fix bug ${i}`])
  }

  // hotfix commit
  await writeFile(path.join(dir, 'src/app.ts'), 'export const v = 99\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'hotfix: revert broken change'])

  return dir
}

const RUN_OR_SKIP = RUNNING ? describe : describe.skip

RUN_OR_SKIP('runReport', () => {
  let repo: string

  beforeAll(async () => {
    repo = await setupRepo()
  }, 30_000)

  afterAll(async () => {
    if (repo)
      await rm(repo, { recursive: true, force: true })
  })

  it('produces all 5 modules', async () => {
    const report = await runReport({
      cwd: repo,
      toolVersion: '0.0.0-test',
      locale: 'en',
      since: '5 years ago',
    })
    expect(report.churn.files.length).toBeGreaterThan(0)
    expect(report.contributors.contributors.length).toBeGreaterThan(0)
    expect(report.bugs.files.length).toBeGreaterThan(0)
    expect(report.velocity.history.length).toBeGreaterThan(0)
    expect(report.firefighting.events.length).toBeGreaterThan(0)
    expect(report.meta.headShort).toMatch(/^[0-9a-f]+$/)
  }, 30_000)

  it('flags cross-risk files', async () => {
    const report = await runReport({
      cwd: repo,
      toolVersion: '0.0.0-test',
      since: '5 years ago',
    })
    const buggyInBugs = report.bugs.files.some(f => f.file.endsWith('buggy.ts'))
    expect(buggyInBugs).toBe(true)
  }, 30_000)

  it('renders HTML containing all module titles', async () => {
    const report = await runReport({ cwd: repo, toolVersion: '0.0.0-test', since: '5 years ago' })
    const html = renderHtml(report, 'en')
    expect(html).toContain('Churn Hotspots')
    expect(html).toContain('Who Built This')
    expect(html).toContain('Where Do Bugs Cluster')
    expect(html).toContain('Accelerating or Dying')
    expect(html).toContain('Firefighting Frequency')
    expect(html).toContain('Cross-Risk Files')
    expect(html).toContain('<svg')
  }, 30_000)

  it('renders Chinese HTML', async () => {
    const report = await runReport({ cwd: repo, toolVersion: '0.0.0-test', since: '5 years ago' })
    const html = renderHtml(report, 'zh')
    expect(html).toContain('高频变更文件')
  }, 30_000)

  it('renders terminal output without throwing', async () => {
    const report = await runReport({ cwd: repo, toolVersion: '0.0.0-test', since: '5 years ago' })
    const out = renderTerminal(report)
    expect(out).toContain('git-xray report')
    expect(out).toContain('Churn Hotspots')
  }, 30_000)
})

describe('crossReference', () => {
  it('marks intersection as critical', () => {
    const cross = crossReference(
      { files: [{ file: 'a.ts', count: 10 }, { file: 'b.ts', count: 5 }], totalFiles: 2, totalCommits: 10, since: '1 year ago' },
      { files: [{ file: 'a.ts', count: 3 }], totalCommits: 3, since: '1 year ago' },
    )
    expect(cross.critical.find(r => r.file === 'a.ts')).toBeTruthy()
  })
})
