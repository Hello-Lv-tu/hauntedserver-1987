import type { LoginHistory } from '../logins.js'
import type { Mailbox } from '../mail/mailbox.js'
import type { ProcTable } from '../procs/types.js'
import type { Vfs } from '../vfs/Vfs.js'

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
  /** The session `exit` returns to (set by `su`). */
  parent?: ParentSession
}

export interface ParentSession {
  user: string
  home: string
  cwd: string
  parent?: ParentSession
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

/** Berkeley Mail's `&` prompt. */
export interface MailMode {
  kind: 'mail'
  box: Mailbox
}

/** `su` asking for a password (input hidden). */
export interface PasswordMode {
  kind: 'password'
  user: string
}

export type TerminalMode = WriteMode | MailMode | PasswordMode

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
  mode?: TerminalMode
  request?: GameRequest
}

export interface CommandCtx {
  vfs: Vfs
  procs: ProcTable
  logins: LoginHistory
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
  mode?: TerminalMode
  request?: GameRequest
}

export type Command = (args: string[], ctx: CommandCtx) => CommandOutput

export const stdout = (text: string): OutputLine => ({ stream: 'stdout', text })
export const stderr = (text: string): OutputLine => ({ stream: 'stderr', text })
export const hint = (text: string): OutputLine => ({ stream: 'hint', text })

export function newSession(user: string, home: string, tty = 'ttyh3'): Session {
  return { user, home, cwd: home, tty, history: [], seq: 1 }
}
