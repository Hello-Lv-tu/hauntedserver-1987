import { findProc } from '../../engine/procs/types.js'
import type { Proc } from '../../engine/procs/types.js'
import { NELL } from '../lines.js'
import { commandEvent, pick, ran } from '../matchers.js'
import type { Beat, Level } from '../types.js'

export const SEED_PID = 6669

/** Post-credits tease: one `ps` shows it, then it is gone. Never explained. */
export const SEED_PROC: Proc = {
  pid: SEED_PID,
  user: 'root',
  tty: '?',
  stat: 'S',
  time: '0:00',
  command: 'pumpkin_seed',
  cpu: 0,
  mem: 0.1,
  sz: 6,
  rss: 6,
}

const end: Beat = {
  id: 'end',
  hints: ['You set Nell free. The story is over.', 'Write to Nell any time: `write nell`.', 'Try `ps` once more...'],
  on(input, ctx, state) {
    const event = commandEvent(input)
    if (event && ran(event, 'ps') && findProc(ctx.procs, SEED_PID) !== undefined) {
      return { effects: [{ type: 'stopProc', pid: SEED_PID }] }
    }
    if (input.type === 'wrote' && input.to === 'nell') {
      return { effects: [{ type: 'nell', lines: [...pick(NELL.endChatter, state.turn)] }] }
    }
    return null
  },
}

/** After the ending, and on later visits: free chat and the tease. */
export function endLevel(id: number): Level {
  return {
    id,
    title: 'Epilogue',
    start: 'end',
    beats: { end },
    enter: [{ type: 'startProc', proc: SEED_PROC }, { type: 'finished' }],
  }
}
