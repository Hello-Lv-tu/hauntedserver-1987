import type { CommandEvent, Session } from '../engine/shell/types.js'
import { basename, dirname } from '../engine/vfs/path.js'
import type { Vfs } from '../engine/vfs/Vfs.js'

/** Levenshtein distance, small strings only. */
export function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = temp
    }
  }
  return row[b.length]
}

/**
 * For a failed command, find an argument that names a missing file whose
 * directory has a near-identical name (a phone-keyboard typo like
 * "jack-o-daekon"). Returns the corrected command line, or null.
 */
export function suggestFix(event: CommandEvent, vfs: Vfs, session: Session): string | null {
  if (event.status === 0) return null
  const ctx = { cwd: event.cwd, home: session.home, user: 'root' }
  for (const [i, arg] of event.args.entries()) {
    if (arg.startsWith('-') || /^\d+$/.test(arg)) continue
    const abs = vfs.absolute(arg, ctx)
    if (!abs.ok || vfs.resolve(abs.value, ctx).ok) continue
    const listing = vfs.listDir(dirname(abs.value), ctx)
    if (!listing.ok) continue
    const wanted = basename(abs.value)
    const limit = wanted.length <= 4 ? 1 : 2
    const best = listing.value
      .map((n) => ({ name: n.name, d: distance(wanted, n.name) }))
      .filter((c) => c.d > 0 && c.d <= limit)
      .sort((a, b) => a.d - b.d)[0]
    if (!best) continue
    const fixedArg = arg.slice(0, arg.length - wanted.length) + best.name
    const args = event.args.map((a, j) => (j === i ? fixedArg : a))
    return [event.name, ...args].join(' ')
  }
  return null
}
