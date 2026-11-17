import type { Proc } from '../../engine/procs/types.js'
import { JACK, NELL, SCAREWARE_LESSON } from '../lines.js'
import { commandEvent, killed, pick, ran } from '../matchers.js'
import type { Beat, Level, StoryCtx, StoryInput, StoryState, Transition } from '../types.js'

export const POPUP_PID = 6667

/** Jack's popup runs as the player's own process, so the player may kill it. */
export const POPUP_PROC: Proc = {
  pid: POPUP_PID,
  user: 'guest',
  tty: 'ttyh3',
  stat: 'R',
  time: '6:66',
  command: 'pumpkin_upd8r --nag --fullscreen',
  cpu: 66.6,
  mem: 13.0,
  sz: 6660,
  rss: 1987,
}

const wroteToNell = (input: StoryInput) => input.type === 'wrote' && input.to === 'nell'

/** Killing the popup finishes the level from any beat. */
function killPopup(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null {
  const event = commandEvent(input)
  if (event && killed(event, ctx, POPUP_PID)) {
    return {
      complete: true,
      effects: [
        { type: 'popup', action: 'hide' },
        { type: 'jack', lines: [...pick(JACK.killed, state.turn)] },
        { type: 'nell', lines: [...pick(NELL.killedPopup, state.turn)] },
        { type: 'lesson', card: SCAREWARE_LESSON },
      ],
    }
  }
  return null
}

const popup: Beat = {
  id: 'popup',
  hints: [
    'The popup is drawn by a program. Programs can be found.',
    'Use `ps aux` to list every running program, and look for the odd one.',
    'Run `ps aux`, find the PID of pumpkin_upd8r (6667), then type `kill 6667`.',
  ],
  on(input, ctx, state) {
    const event = commandEvent(input)
    if (event && ran(event, 'ps')) {
      return { next: 'found', effects: [{ type: 'nell', lines: [...pick(NELL.foundProc, state.turn)] }] }
    }
    if (wroteToNell(input)) return { effects: [{ type: 'nell', lines: [...pick(NELL.popupChatter, state.turn)] }] }
    return killPopup(input, ctx, state)
  },
}

const found: Beat = {
  id: 'found',
  hints: [
    'You found the program. Every program has a number, its PID.',
    'The `kill` command stops a program by its PID. See `man kill`.',
    'Type `kill 6667`.',
  ],
  on(input, ctx, state) {
    if (wroteToNell(input)) return { effects: [{ type: 'nell', lines: [...pick(NELL.foundChatter, state.turn)] }] }
    return killPopup(input, ctx, state)
  },
}

export const level1: Level = {
  id: 1,
  title: 'The popup that would not close',
  start: 'popup',
  beats: { popup, found },
  enter: [
    { type: 'startProc', proc: POPUP_PROC },
    { type: 'jack', lines: [...JACK.appear[0]] },
    { type: 'popup', action: 'show' },
    { type: 'nell', lines: [...NELL.popupWarn[0]] },
  ],
  on(input, _ctx, state) {
    if (input.type !== 'popup') return null
    if (input.action === 'close') return { effects: [{ type: 'popup', action: 'nag' }, { type: 'nell', lines: [...pick(NELL.popupNag, state.turn)] }] }
    // "FIX NOW" or the countdown ran out: Jack eats the player.
    return { effects: [{ type: 'jack', lines: [...pick(JACK.eaten, state.turn)] }, { type: 'eaten' }] }
  },
}
