import type { Proc, ProcTable } from '../../engine/procs/types.js'

const sys = (pid: number, command: string, extra: Partial<Proc> = {}): Proc => ({
  pid,
  user: 'root',
  tty: '?',
  stat: 'S',
  time: '0:00',
  command,
  cpu: 0,
  mem: 0,
  sz: 0,
  rss: 0,
  ...extra,
})

/**
 * period: a plausible 4.3BSD process table at 23:59 on Oct 31 1987.
 * PIDs 0-2 are kernel processes; the rest are typical daemons.
 */
export const SEED_PROCS: ProcTable = [
  sys(0, 'swapper', { stat: 'D', time: '0:12' }),
  sys(1, 'init', { stat: 'I', sz: 52, rss: 20, time: '0:03' }),
  sys(2, 'pagedaemon', { stat: 'S', time: '0:31' }),
  sys(48, 'update', { stat: 'S', sz: 16, rss: 8, time: '1:02' }),
  sys(53, 'cron', { stat: 'I', sz: 60, rss: 28, time: '0:04' }),
  sys(61, 'inetd', { stat: 'I', sz: 64, rss: 32 }),
  sys(77, '/usr/lib/lpd', { stat: 'I', user: 'daemon', sz: 76, rss: 36 }),
  sys(91, '- std.9600 ttyh0 (getty)', { stat: 'I', tty: 'ttyh0', sz: 40, rss: 16 }),
  {
    pid: 1171,
    user: 'nell',
    tty: 'ttyp0',
    stat: 'IW',
    time: '0:07',
    command: '-csh (csh)',
    cpu: 0,
    mem: 1.2,
    sz: 196,
    rss: 104,
    login: 'Oct 31 23:41',
  },
  {
    pid: 2187,
    user: 'guest',
    tty: 'ttyh3',
    stat: 'S',
    time: '0:00',
    command: '-csh (csh)',
    cpu: 0.3,
    mem: 1.1,
    sz: 188,
    rss: 96,
    login: 'Oct 31 23:59',
  },
]

/** The player's login shell. Killing it would log them out, so kill refuses. */
export const PLAYER_SHELL_PID = 2187
