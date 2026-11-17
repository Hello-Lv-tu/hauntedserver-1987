import { findProc } from '../engine/procs/types'
import type { CommandEvent } from '../engine/shell/types'
import type { StoryCtx, StoryInput } from './types'

/**
 * Story beats match on command events (name, args, status), never on the raw
 * line, so `cat .from_nell`, `cat ~/.from_nell` and `more ./.from_nell` all
 * count the same.
 */

export function commandEvent(input: StoryInput): CommandEvent | null {
  return input.type === 'command' ? input.event : null
}

export const operands = (event: CommandEvent) => event.args.filter((a) => !a.startsWith('-') || a === '-')

/** True if a short flag letter appears, e.g. -a in `ls -la`. */
export function hasFlag(event: CommandEvent, letter: string): boolean {
  return event.args.some((a) => a.startsWith('-') && a !== '-' && a.slice(1).includes(letter))
}

/** Resolve an argument the way the command did (relative to the event's cwd). */
export function absoluteArg(arg: string, event: CommandEvent, ctx: StoryCtx): string | null {
  const abs = ctx.vfs.absolute(arg, { cwd: event.cwd, home: ctx.home, user: ctx.user })
  return abs.ok ? abs.value : null
}

const READERS = new Set(['cat', 'more', 'head', 'tail'])

/** A successful cat/more/head/tail of the file at absolute path `abs`. */
export function readsFile(event: CommandEvent, ctx: StoryCtx, abs: string): boolean {
  if (!READERS.has(event.name) || event.status !== 0) return false
  return operands(event).some((arg) => absoluteArg(arg, event, ctx) === abs)
}

/** A successful `ls -a` (any flag combination) that lists directory `abs`. */
export function listsAll(event: CommandEvent, ctx: StoryCtx, abs: string): boolean {
  if (event.name !== 'ls' || event.status !== 0 || !hasFlag(event, 'a')) return false
  const targets = operands(event)
  if (targets.length === 0) return event.cwd === abs
  return targets.some((arg) => absoluteArg(arg, event, ctx) === abs)
}

/** Any successful run of a command, e.g. `ps`. */
export function ran(event: CommandEvent, name: string): boolean {
  return event.name === name && event.status === 0
}

/** A `kill` after which the process is gone. */
export function killed(event: CommandEvent, ctx: StoryCtx, pid: number): boolean {
  return event.name === 'kill' && event.args.includes(String(pid)) && findProc(ctx.procs, pid) === undefined
}

const COMMAND_WORDS = new Set(['ls', 'cat', 'cd', 'ps', 'kill', 'more', 'grep', 'man', 'pwd', 'head', 'tail', 'help', 'hint', 'who', 'whoami', 'write', 'clear', 'history', 'spellbook', 'date'])

/**
 * Text written to Nell that is clearly a command typed in the wrong mode.
 * Must not fire on ordinary sentences that happen to start with a command
 * word, like "who are you?" or "more please".
 */
export function looksLikeCommand(text: string): boolean {
  const words = text.trim().split(/\s+/)
  const [first, ...rest] = words
  if (first === undefined || !COMMAND_WORDS.has(first)) return false
  if (/[?!,]/.test(text)) return false // sentences, not commands
  if (rest.length === 0) return true // "ls", "who", "help"
  return rest.every(
    (w) =>
      w.startsWith('-') || // flags: -a, -la
      /[/~.]/.test(w) || // paths: /tmp, ~nell, .from_nell
      /^\d+$/.test(w) || // PIDs: kill 6667
      (first === 'ps' && /^[aux]+$/.test(w)) || // ps aux
      (first === 'man' && COMMAND_WORDS.has(w)) || // man kill
      (first === 'write' && rest.length <= 2), // write nell
  )
}

/** Pick a line variant deterministically. */
export function pick<T>(variants: readonly T[], turn: number): T {
  return variants[turn % variants.length]
}
