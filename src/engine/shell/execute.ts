import { MODERN_HINTS } from '../commands/modern.js'
import { lookup } from '../commands/registry.js'
import type { ProcTable } from '../procs/types.js'
import type { Vfs } from '../vfs/Vfs.js'
import { tokenize } from './tokenize.js'
import type { CommandCtx, CommandEvent, CommandOutput, ExecResult, OutputLine, Session } from './types.js'
import { hint, stderr } from './types.js'

export const PANIC_LINE = 'panic: internal error'

/**
 * Run one command line. Never throws: any unexpected exception becomes a
 * "panic" line so the game keeps running (Requirement 4.7).
 */
export function execute(line: string, vfs: Vfs, session: Session, procs: ProcTable = []): ExecResult {
  try {
    return run(line, vfs, session, procs)
  } catch (error) {
    console.error('execute panicked on', JSON.stringify(line), error)
    return { lines: [stderr(PANIC_LINE)], session, events: [], vfs, procs }
  }
}

function run(line: string, vfs: Vfs, session: Session, procs: ProcTable): ExecResult {
  if (line.trim() === '') return { lines: [], session, events: [], vfs, procs }

  // csh records the line in history even when it fails to parse.
  let current: Session = { ...session, history: [...session.history, line] }

  const tokens = tokenize(line)
  if (!tokens.ok) {
    const error = tokens.error
    const text =
      error.kind === 'unmatched'
        ? `Unmatched ${error.quote}.`
        : 'Sorry, that is not supported on this terminal.'
    const lines = [stderr(text)]
    if (error.kind === 'unsupported') {
      lines.push(hint(`\`${error.operator}\` is a real shell feature, but this terminal only supports pipes (|).`))
    }
    return { lines, session: current, events: [], vfs, procs }
  }

  // Split into pipeline stages.
  const stages: string[][] = [[]]
  for (const token of tokens.value) {
    if (token.type === 'pipe') stages.push([])
    else stages[stages.length - 1].push(token.value)
  }
  if (stages.some((stage) => stage.length === 0)) {
    // period: csh's message for "| foo" or "foo |".
    return { lines: [stderr('Invalid null command.')], session: current, events: [], vfs, procs }
  }

  const lines: OutputLine[] = []
  const events: CommandEvent[] = []
  let stdin: string[] | null = null
  let currentVfs = vfs
  let currentProcs = procs
  let clear = false
  let mode: ExecResult['mode']
  let request: ExecResult['request']
  const alone = stages.length === 1

  for (const [index, [name, ...args]] of stages.entries()) {
    const isLast = index === stages.length - 1
    const cwd = current.cwd
    const output = runStage(name, args, { vfs: currentVfs, procs: currentProcs, session: current, stdin, isTty: isLast })

    // Like a subshell: only a lone command may change the session (e.g. cd)
    // or switch the terminal into write mode.
    if (alone) {
      if (output.session) current = output.session
      mode = output.mode
      request = output.request
    }
    if (output.vfs) currentVfs = output.vfs
    if (output.procs) currentProcs = output.procs
    if (output.clear && isLast) clear = true

    events.push({ seq: current.seq, name, args, status: output.status, cwd })
    current = { ...current, seq: current.seq + 1 }

    if (isLast) {
      lines.push(...output.lines)
    } else {
      // stdout feeds the next stage; stderr and hints go to the screen.
      lines.push(...output.lines.filter((l) => l.stream !== 'stdout'))
      stdin = output.lines.filter((l) => l.stream === 'stdout').map((l) => l.text)
    }
  }

  return {
    lines,
    session: current,
    events,
    vfs: currentVfs,
    procs: currentProcs,
    ...(clear ? { clear } : {}),
    ...(mode ? { mode } : {}),
    ...(request ? { request } : {}),
  }
}

function runStage(name: string, args: string[], ctx: CommandCtx): CommandOutput {
  const command = lookup(name)
  if (command) return command(args, ctx)
  const lines = [stderr(`${name}: Command not found.`)]
  const modern = Object.hasOwn(MODERN_HINTS, name) ? MODERN_HINTS[name] : undefined
  if (modern) lines.push(hint(modern))
  return { lines, status: 1 }
}
