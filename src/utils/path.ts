import path from 'node:path'

/** Patterns of files that should NOT count as code churn (per the blog). */
const NOISE_PATTERNS: RegExp[] = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)bun\.lockb?$/,
  /(^|\/)Cargo\.lock$/,
  /(^|\/)Gemfile\.lock$/,
  /(^|\/)composer\.lock$/,
  /(^|\/)poetry\.lock$/,
  /(^|\/)CHANGELOG(\.md)?$/i,
  /(^|\/)HISTORY(\.md)?$/i,
  /(^|\/)LICENSE(\.md)?$/i,
  /(^|\/)\.min\.(js|css)$/,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)node_modules\//,
]

/** Returns true if a file path looks like generated/lockfile/changelog noise. */
export function isNoiseFile(file: string): boolean {
  return NOISE_PATTERNS.some(re => re.test(file))
}

/** Make a path relative to `root`, using forward slashes. */
export function relativize(file: string, root: string): string {
  let rel = file
  if (file.startsWith(root)) {
    rel = file.slice(root.length)
    if (rel.startsWith(path.sep) || rel.startsWith('/'))
      rel = rel.replace(/^[\\/]+/, '')
  }
  return rel.split(path.sep).join('/')
}

/** Resolve a directory argument to an absolute path. */
export function resolveCwd(input: string | undefined, fallback: string): string {
  if (!input)
    return fallback
  return path.resolve(fallback, input)
}
