import type { Session } from '../engine/shell/types'
import type { Vfs } from '../engine/vfs/Vfs'

export interface Completion {
  /** The new input line. */
  line: string
  /** Candidates to list when the completion is ambiguous. */
  options: string[]
}

/**
 * Tab completion on the last word of `line`: command names for the first
 * word of a pipeline stage, paths otherwise. Quotes are not understood;
 * that is fine for the names on this machine.
 */
export function complete(line: string, vfs: Vfs, session: Session, commands: readonly string[]): Completion {
  const lastSpace = Math.max(line.lastIndexOf(' '), line.lastIndexOf('|'))
  const before = line.slice(0, lastSpace + 1)
  const word = line.slice(lastSpace + 1)
  const isCommand = before.trim() === '' || before.trim().endsWith('|')

  if (isCommand && !word.includes('/')) {
    return finish(before, '', word, commands.map((name) => ({ name, isDir: false })))
  }

  const slash = word.lastIndexOf('/')
  const dirPart = word.slice(0, slash + 1)
  const prefix = word.slice(slash + 1)
  const listing = vfs.listDir(dirPart === '' ? '.' : dirPart, {
    cwd: session.cwd,
    home: session.home,
    user: session.user,
  })
  if (!listing.ok) return { line, options: [] }
  const showHidden = prefix.startsWith('.')
  const candidates = listing.value
    .filter((node) => showHidden || !node.name.startsWith('.'))
    .map((node) => ({ name: node.name, isDir: node.kind === 'dir' }))
  return finish(before, dirPart, prefix, candidates)
}

function finish(before: string, dirPart: string, prefix: string, candidates: { name: string; isDir: boolean }[]): Completion {
  const matches = candidates.filter((c) => c.name.startsWith(prefix))
  const original = before + dirPart + prefix
  if (matches.length === 0) return { line: original, options: [] }
  if (matches.length === 1) {
    const [only] = matches
    return { line: before + dirPart + only.name + (only.isDir ? '/' : ' '), options: [] }
  }
  const common = commonPrefix(matches.map((m) => m.name))
  if (common.length > prefix.length) return { line: before + dirPart + common, options: [] }
  return { line: original, options: matches.map((m) => m.name + (m.isDir ? '/' : '')) }
}

export function commonPrefix(words: string[]): string {
  if (words.length === 0) return ''
  let prefix = words[0]
  for (const word of words.slice(1)) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return prefix
}
