import { DEMO_END_LINE, NELL } from '../lines.js'
import { pick } from '../matchers.js'
import type { Beat, Level } from '../types.js'

/** Placeholder after the last built level: ends the current slice cleanly. */
const end: Beat = {
  id: 'end',
  hints: ["That's all for now!", 'More levels are coming soon.', 'You beat every level built so far. Well done!'],
  on(input, _ctx, state) {
    if (input.type === 'wrote' && input.to === 'nell') {
      return { effects: [{ type: 'nell', lines: [...pick(NELL.endChatter, state.turn)] }] }
    }
    return null
  },
}

export function endLevel(id: number): Level {
  return {
    id,
    title: 'To be continued',
    start: 'end',
    beats: { end },
    enter: [{ type: 'nell', lines: [...NELL.toBeContinued[0]] }, { type: 'say', lines: [DEMO_END_LINE] }, { type: 'finished' }],
  }
}
