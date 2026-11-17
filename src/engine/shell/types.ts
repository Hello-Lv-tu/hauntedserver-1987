import type { ProcTable } from '../procs/types'
import type { Vfs } from '../vfs/Vfs'

export interface Session {
  user: string
  home: string
  cwd: string
  /** The player's terminal, e.g. "ttyh3". */
  tty: string
  /** Every non-empty line the player entered, oldest first. */
  history: string[]
  /** Next command-event sequence number. */
  seq: number
}

/**
 * `hint` lines are not terminal output: the UI renders them as a separate
 * learning aid (see period-accuracy.md).
 */
export type Stream = 'stdout' | 'stderr' | 'hint'

export interface OutputLine {
  stream: Stream
  text: string
}

export interface CommandEvent {
  seq: number
  name: string
  args: string[]
  status: number
  cwd: string
}

/** Things a command asks the game (not the shell) to do. */
export type GameRequest = 'hint' | 'spellbook'

/** Entering write mode: following lines go to `to`, not to the shell. */
export interface WriteMode {
  kind: 'write'
  to: string
}

export interface ExecResult {
  lines: OutputLine[]
  session: Session
  events: CommandEvent[]
  /** The vfs after the line ran. Same instance when nothing was written. */
  vfs: Vfs
  /** The process table after the line ran. */
  procs: ProcTable
  /** Set by `clear`: the UI should wipe the scrollback. */
  clear?: boolean
  mode?: WriteMode
  request?: GameRequest
}

export interface CommandCtx {
  vfs: Vfs
  procs: ProcTable
  session: Session
  /** Lines from the previous pipeline stage, or null when not piped. */
  stdin: string[] | null
  /** True for the last stage of a pipeline (output goes to the screen). */
  isTty: boolean
}

export interface CommandOutput {
  /** stdout, stderr and hint lines in the order they were produced. */
  lines: OutputLine[]
  status: number
  session?: Session
  vfs?: Vfs
  procs?: ProcTable
  clear?: boolean
  mode?: WriteMode
  request?: GameRequest
}

export type Command = (args: string[], ctx: CommandCtx) => CommandOutput

export const stdout = (text: string): OutputLine => ({ stream: 'stdout', text })
export const stderr = (text: string): OutputLine => ({ stream: 'stderr', text })
export const hint = (text: string): OutputLine => ({ stream: 'hint', text })

export function newSession(user: string, home: string, tty = 'ttyh3'): Session {
  return { user, home, cwd: home, tty, history: [], seq: 1 }
}
