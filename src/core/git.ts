import { spawn } from 'node:child_process'
import process from 'node:process'

export interface RunGitOptions {
  cwd: string
  /** Timeout in milliseconds. Default: 30_000. */
  timeout?: number
}

export class GitError extends Error {
  constructor(message: string, public readonly stderr: string, public readonly code: number | null) {
    super(message)
    this.name = 'GitError'
  }
}

/**
 * Run a single git command and return stdout as a string.
 * Throws GitError on non-zero exit or timeout.
 */
export function runGit(args: string[], options: RunGitOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      cwd: options.cwd,
      env: { ...process.env, GIT_PAGER: 'cat', PAGER: 'cat' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    const timeoutMs = options.timeout ?? 30_000
    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new GitError(`git ${args.join(' ')} timed out after ${timeoutMs}ms`, stderr, null))
    }, timeoutMs)

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8')
    })
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })
    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(new GitError(`failed to spawn git: ${err.message}`, stderr, null))
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve(stdout)
      }
      else {
        reject(new GitError(
          `git ${args.join(' ')} exited with code ${code}: ${stderr.trim() || '(no stderr)'}`,
          stderr,
          code,
        ))
      }
    })
  })
}

/**
 * Verify that the given path is inside a git working tree.
 * Returns the absolute path to the repo root.
 */
export async function getRepoRoot(cwd: string): Promise<string> {
  const out = await runGit(['rev-parse', '--show-toplevel'], { cwd })
  return out.trim()
}
