import type { Proc } from '../procs/types'
import { findProc, loggedIn, shortTty, withoutProc } from '../procs/types'
import type { Command, OutputLine } from '../shell/types'
import { hint, stderr, stdout } from '../shell/types'

/**
 * BSD ps: options are letters with or without a dash ("aux", "-aux").
 *   a  all users' processes (with a terminal)
 *   u  user-oriented format
 *   x  also processes without a terminal
 */
export const ps: Command = (args, ctx) => {
  const letters = args.map((a) => a.replace(/^-/, '')).join('')
  const bad = [...letters].find((l) => !'aux'.includes(l))
  if (bad !== undefined) return { lines: [stderr(`ps: ${bad}: unknown option`), stderr('usage: ps [-aux]')], status: 1 }

  const all = letters.includes('a')
  const noTty = letters.includes('x')
  const userFormat = letters.includes('u')
  const procs = ctx.procs.filter(
    (p) => (all || p.user === ctx.session.user) && (noTty || p.tty !== '?'),
  )
  const lines = userFormat
    ? [stdout(uLine(null)), ...procs.map((p) => stdout(uLine(p)))]
    : [stdout(shortLine(null)), ...procs.map((p) => stdout(shortLine(p)))]
  return { lines, status: 0 }
}

/** period: 4.3BSD "ps" columns:  PID TT STAT  TIME COMMAND */
function shortLine(p: Proc | null): string {
  if (p === null) return '  PID TT STAT  TIME COMMAND'
  return `${String(p.pid).padStart(5)} ${shortTty(p.tty).padEnd(2)} ${p.stat.padEnd(4)}${p.time.padStart(6)} ${p.command}`
}

/** period: 4.3BSD "ps u" columns: USER PID %CPU %MEM SZ RSS TT STAT TIME COMMAND */
function uLine(p: Proc | null): string {
  const row = (user: string, pid: string, cpu: string, mem: string, sz: string, rss: string, tt: string, stat: string, time: string, cmd: string) =>
    `${user.padEnd(8)}${pid.padStart(6)}${cpu.padStart(5)}${mem.padStart(5)}${sz.padStart(5)}${rss.padStart(5)} ${tt.padEnd(2)} ${stat.padEnd(4)}${time.padStart(6)} ${cmd}`
  if (p === null) return row('USER', 'PID', '%CPU', '%MEM', 'SZ', 'RSS', 'TT', 'STAT', 'TIME', 'COMMAND')
  return row(
    p.user,
    String(p.pid),
    p.cpu.toFixed(1),
    p.mem.toFixed(1),
    String(p.sz),
    String(p.rss),
    shortTty(p.tty),
    p.stat,
    p.time,
    p.command,
  )
}

const SIGNALS = new Set(['1', '2', '3', '9', '15', 'HUP', 'INT', 'QUIT', 'KILL', 'TERM'])

/** csh builtin kill: `kill [-sig] pid ...`. You can only kill your own processes. */
export const kill: Command = (args, ctx) => {
  let operands = args
  if (operands[0]?.startsWith('-')) {
    const signal = operands[0].slice(1).toUpperCase()
    if (!SIGNALS.has(signal)) return { lines: [stderr(`kill: ${operands[0].slice(1)}: Unknown signal; kill -l lists signals.`)], status: 1 }
    operands = operands.slice(1)
  }
  if (operands.length === 0) return { lines: [stderr('kill: Too few arguments.')], status: 1 }

  let procs = ctx.procs
  const lines: OutputLine[] = []
  let status = 0
  for (const operand of operands) {
    if (!/^\d+$/.test(operand)) {
      // period: csh's wording for a non-numeric argument.
      lines.push(stderr("kill: Arguments should be jobs or process id's."))
      status = 1
      continue
    }
    const pid = Number(operand)
    const proc = findProc(procs, pid)
    if (proc === undefined) {
      lines.push(stderr(`kill: ${pid}: No such process`))
      status = 1
    } else if (proc.user !== ctx.session.user && ctx.session.user !== 'root') {
      lines.push(stderr(`kill: ${pid}: Not owner`))
      status = 1
    } else if (proc.login !== undefined && proc.tty === ctx.session.tty) {
      // Killing your own login shell would log you out; keep the player in.
      lines.push(hint(`PID ${pid} is your own login shell. Killing it would log you out of vax3.`))
      status = 1
    } else {
      procs = withoutProc(procs, pid)
    }
  }
  return { lines, status, procs }
}

/** period: 4.3BSD who:  name     line     time */
export const who: Command = (_args, ctx) => ({
  lines: loggedIn(ctx.procs).map((p) => stdout(`${p.user.padEnd(8)} ${p.tty.padEnd(8)} ${p.login}`)),
  status: 0,
})

/**
 * `write user [tty]`: the following lines go to that user's terminal until
 * Ctrl-D (or a line "EOF"). The game handles the mode; this only validates.
 */
export const write: Command = (args, ctx) => {
  const [user, tty] = args
  if (user === undefined || args.length > 2) return { lines: [stderr('usage: write user [ttyname]')], status: 1 }
  const sessions = loggedIn(ctx.procs).filter((p) => p.user === user)
  if (sessions.length === 0) return { lines: [stderr(`write: ${user} is not logged on.`)], status: 1 }
  if (tty !== undefined && !sessions.some((p) => p.tty === tty)) {
    return { lines: [stderr(`write: ${user} is not logged on ${tty}.`)], status: 1 }
  }
  return {
    lines: [hint(`You are writing to ${user}. Type a line and press Enter. Ctrl-D (or a line with only EOF) stops.`)],
    status: 0,
    mode: { kind: 'write', to: user },
  }
}

/** Game commands: handled by the game, not the shell. */
export const hintCommand: Command = () => ({ lines: [], status: 0, request: 'hint' })
export const spellbook: Command = () => ({ lines: [], status: 0, request: 'spellbook' })
