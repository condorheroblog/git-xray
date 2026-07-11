import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { formatLocal } from '../utils/date.ts'
import { getRepoRoot, runGit } from './git.ts'

export interface PackageInfo {
  name?: string
  version?: string
  description?: string
}

export interface RepoInfo extends PackageInfo {
  path: string
  name: string
  headShort: string
  headFull: string
  generatedAt: string
  generatedAtLocal: string
  toolVersion: string
}

const FALLBACK_VERSION = '0.0.0'

/** Read the closest package.json (if any) and pull name/version/description. */
async function readPackageJson(repoRoot: string): Promise<PackageInfo> {
  try {
    const raw = await readFile(path.join(repoRoot, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as PackageInfo
    return {
      name: typeof pkg.name === 'string' ? pkg.name : undefined,
      version: typeof pkg.version === 'string' ? pkg.version : undefined,
      description: typeof pkg.description === 'string' ? pkg.description : undefined,
    }
  }
  catch {
    return {}
  }
}

/**
 * Collect repository metadata: HEAD commit, folder name, generated timestamp.
 */
export async function collectRepoMeta(
  cwd: string,
  toolVersion: string,
  locale: string = 'en',
): Promise<RepoInfo> {
  const repoRoot = await getRepoRoot(cwd)
  const headFull = (await runGit(['rev-parse', 'HEAD'], { cwd: repoRoot })).trim()
  const headShort = (await runGit(['rev-parse', '--short', 'HEAD'], { cwd: repoRoot })).trim()

  const pkg = await readPackageJson(repoRoot)

  const generatedAt = new Date().toISOString()

  return {
    ...pkg,
    path: repoRoot,
    name: pkg.name ?? path.basename(repoRoot),
    headShort: headShort || headFull.slice(0, 7),
    headFull,
    generatedAt,
    generatedAtLocal: formatLocal(generatedAt, locale),
    toolVersion: toolVersion || FALLBACK_VERSION,
  }
}
