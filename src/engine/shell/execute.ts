import { MODERN_HINTS } from '../commands/modern'
import { lookup } from '../commands/registry'
import type { Vfs } from '../vfs/Vfs'
import { tokenize } from './tokenize'
import type { CommandCtx, CommandEvent, CommandOutput, ExecResult, OutputLine, Session } from './types'
import { hint, stderr } from './types'

export const PANIC_LINE = 'panic: internal error'

/**
 * Run one command line. Never throws: any unexpected exception becomes a
 * "panic" line so the game keeps running (Requirement 4.7).
 */
export function execute(line: string, vfs: Vfs, session: Session): ExecResult {
  try {
    return run(line, vfs, session)
  } catch (error) {
    console.error('execute panicked on', JSON.stringify(line), error)
    return { lines: [stderr(PANIC_LINE)], session, events: [], vfs }
  }
}

function run(line: string, vfs: Vfs, session: Session): ExecResult {
  if (line.trim() === '') return { lines: [], session, events: [], vfs }

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
    return { lines, session: current, events: [], vfs }
  }

  // Split into pipeline stages.
  const stages: string[][] = [[]]
  for (const token of tokens.value) {
    if (token.type === 'pipe') stages.push([])
    else stages[stages.length - 1].push(token.value)
  }
  if (stages.some((stage) => stage.length === 0)) {
    // period: csh's message for "| foo" or "foo |".
    return { lines: [stderr('Invalid null command.')], session: current, events: [], vfs }
  }

  const lines: OutputLine[] = []
  const events: CommandEvent[] = []
  let stdin: string[] | null = null
  let currentVfs = vfs
  let clear = false

  for (const [index, [name, ...args]] of stages.entries()) {
    const isLast = index === stages.length - 1
    const output = runStage(name, args, { vfs: currentVfs, session: current, stdin, isTty: isLast })

    // Like a subshell: only a lone command may change the session (e.g. cd).
    if (output.session && stages.length === 1) current = output.session
    if (output.vfs) currentVfs = output.vfs
    if (output.clear && isLast) clear = true

    events.push({ seq: current.seq, name, args, status: output.status, cwd: current.cwd })
    current = { ...current, seq: current.seq + 1 }

    if (isLast) {
      lines.push(...output.lines)
    } else {
      // stdout feeds the next stage; stderr and hints go to the screen.
      lines.push(...output.lines.filter((l) => l.stream !== 'stdout'))
      stdin = output.lines.filter((l) => l.stream === 'stdout').map((l) => l.text)
    }
  }

  return { lines, session: current, events, vfs: currentVfs, ...(clear ? { clear } : {}) }
}

function runStage(name: string, args: string[], ctx: CommandCtx): CommandOutput {
  const command = lookup(name)
  if (command) return command(args, ctx)
  const lines = [stderr(`${name}: Command not found.`)]
  const modern = Object.hasOwn(MODERN_HINTS, name) ? MODERN_HINTS[name] : undefined
  if (modern) lines.push(hint(modern))
  return { lines, status: 1 }
}
