import type { ProcTable } from '../engine/procs/types'
import { execute } from '../engine/shell/execute'
import type { ExecResult, Session } from '../engine/shell/types'
import type { Vfs } from '../engine/vfs/Vfs'
import { step } from '../game/game'
import type { GameInput, GameState } from '../game/types'
import { createWorld } from '../story/world'

/** A fresh dev world, logged in as guest in their home directory. */
export function devWorld() {
  return createWorld()
}

/** Run a line; returns the result plus convenient text views. */
export function run(line: string, vfs?: Vfs, session?: Session, procs?: ProcTable) {
  const world = devWorld()
  const result: ExecResult = execute(line, vfs ?? world.vfs, session ?? world.session, procs ?? world.procs)
  return {
    ...result,
    out: result.lines.filter((l) => l.stream === 'stdout').map((l) => l.text),
    err: result.lines.filter((l) => l.stream === 'stderr').map((l) => l.text),
    hints: result.lines.filter((l) => l.stream === 'hint').map((l) => l.text),
  }
}

/** Run several lines in sequence, threading session, vfs and processes. */
export function runAll(lines: string[]) {
  let { vfs, session, procs } = devWorld()
  let last = run('', vfs, session, procs)
  for (const line of lines) {
    last = run(line, vfs, session, procs)
    vfs = last.vfs
    session = last.session
    procs = last.procs
  }
  return last
}

export const asRoot = (session: Session): Session => ({ ...session, user: 'root' })

/**
 * Drive a game with a script. Strings are lines (shell or write mode,
 * whatever the game is in); objects are raw inputs.
 */
export function play(game: GameState, script: readonly (string | GameInput)[]): GameState {
  return script.reduce<GameState>(
    (state, item) => step(state, typeof item === 'string' ? { type: 'line', text: item } : item),
    game,
  )
}

export const screenText = (game: GameState) => game.screen.map((l) => l.text).join('\n')
