import type { ProcTable } from '../engine/procs/types.js'
import { newSession } from '../engine/shell/types.js'
import type { Session } from '../engine/shell/types.js'
import { loadSeed } from '../engine/vfs/seed.js'
import { Vfs } from '../engine/vfs/Vfs.js'
import devSeed from './seed/dev.json'
import { SEED_PROCS } from './seed/procs.js'

export const PLAYER = 'guest'
export const PLAYER_TTY = 'ttyh3'

export interface World {
  vfs: Vfs
  procs: ProcTable
  session: Session
}

/** Build the starting world from the seed. Throws only if the bundled seed is broken. */
export function createWorld(seed: unknown = devSeed): World {
  const root = loadSeed(seed)
  if (!root.ok) {
    const details = root.error.map((e) => `${e.path}: ${e.message}`).join('\n')
    throw new Error(`Invalid seed:\n${details}`)
  }
  const vfs = new Vfs(root.value)
  const home = vfs.homeOf(PLAYER) ?? '/'
  return { vfs, procs: SEED_PROCS, session: newSession(PLAYER, home, PLAYER_TTY) }
}
