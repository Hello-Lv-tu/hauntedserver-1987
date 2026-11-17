/**
 * Lexically normalize `path` against `cwd`. Pure string operation: no
 * filesystem access, no `~` expansion (see Vfs.expandTilde).
 *
 * Output always starts with "/", contains no empty, "." or ".." segments,
 * and has no trailing slash except for the root itself.
 */
export function normalizePath(path: string, cwd: string): string {
  const start = path.startsWith('/') ? [] : splitPath(cwd)
  const parts = [...start]
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      parts.pop() // ".." at "/" stays at "/"
      continue
    }
    parts.push(segment)
  }
  return '/' + parts.join('/')
}

/** Split an absolute path into its non-empty segments. */
export function splitPath(abs: string): string[] {
  return abs.split('/').filter((s) => s !== '' && s !== '.')
}

/** Parent directory of a normalized absolute path. Parent of "/" is "/". */
export function dirname(abs: string): string {
  const parts = splitPath(abs)
  parts.pop()
  return '/' + parts.join('/')
}

/** Last segment of a normalized absolute path ("" for "/"). */
export function basename(abs: string): string {
  const parts = splitPath(abs)
  return parts[parts.length - 1] ?? ''
}

/** Show `abs` with the home directory abbreviated to "~", as csh prompts do. */
export function tildify(abs: string, home: string): string {
  if (home === '/' || home === '') return abs
  if (abs === home) return '~'
  if (abs.startsWith(home + '/')) return '~' + abs.slice(home.length)
  return abs
}
