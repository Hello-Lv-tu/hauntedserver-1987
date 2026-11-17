import { execute } from '../engine/shell/execute'
import type { ExecResult, Session } from '../engine/shell/types'
import type { Vfs } from '../engine/vfs/Vfs'
import { createWorld } from '../story/world'

/** A fresh dev world, logged in as guest in their home directory. */
export function devWorld() {
  return createWorld()
}

/** Run a line; returns the result plus convenient text views. */
export function run(line: string, vfs?: Vfs, session?: Session) {
  const world = devWorld()
  const result: ExecResult = execute(line, vfs ?? world.vfs, session ?? world.session)
  return {
    ...result,
    out: result.lines.filter((l) => l.stream === 'stdout').map((l) => l.text),
    err: result.lines.filter((l) => l.stream === 'stderr').map((l) => l.text),
    hints: result.lines.filter((l) => l.stream === 'hint').map((l) => l.text),
  }
}

/** Run several lines in sequence, threading session and vfs. */
export function runAll(lines: string[]) {
  let { vfs, session } = devWorld()
  let last = run('', vfs, session)
  for (const line of lines) {
    last = run(line, vfs, session)
    vfs = last.vfs
    session = last.session
  }
  return last
}

export const asRoot = (session: Session): Session => ({ ...session, user: 'root' })
