/** One running program, as `ps aux` shows it on 4.3BSD. */
export interface Proc {
  pid: number
  user: string
  /** Full device name, e.g. "ttyh3", or "?" for no terminal. */
  tty: string
  /** BSD state letters, e.g. "S", "R", "IW". */
  stat: string
  /** CPU time, "M:SS". */
  time: string
  command: string
  cpu: number
  mem: number
  /** Virtual size and resident set size, in KB. */
  sz: number
  rss: number
  /** Login time for login shells ("Oct 31 23:41"), shown by `who`. */
  login?: string
}

export type ProcTable = readonly Proc[]

/** "ttyh3" -> "h3", "?" -> "?", as in the TT column. */
export function shortTty(tty: string): string {
  if (tty === 'console') return 'co'
  return tty.startsWith('tty') ? tty.slice(3) : tty
}

export function findProc(procs: ProcTable, pid: number): Proc | undefined {
  return procs.find((p) => p.pid === pid)
}

export function withoutProc(procs: ProcTable, pid: number): ProcTable {
  return procs.filter((p) => p.pid !== pid)
}

/** Add a process, replacing any existing one with the same PID. */
export function withProc(procs: ProcTable, proc: Proc): ProcTable {
  return [...withoutProc(procs, proc.pid), proc].sort((a, b) => a.pid - b.pid)
}

/** Users with a login shell on a terminal, in PID order. */
export function loggedIn(procs: ProcTable): Proc[] {
  return procs.filter((p) => p.login !== undefined && p.tty !== '?')
}
