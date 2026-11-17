import { NELL } from '../lines.js'
import { commandEvent, listsAll, pick, readsFile } from '../matchers.js'
import type { Beat, Level, StoryCtx, StoryInput, Transition } from '../types.js'

export const NOTE_PATH = '/usr/users/guest/.from_nell'

const wroteToNell = (input: StoryInput) => input.type === 'wrote' && input.to === 'nell'

/** Reading the note finishes the level from any beat. */
function readNote(input: StoryInput, ctx: StoryCtx, turn: number): Transition | null {
  const event = commandEvent(input)
  if (event && readsFile(event, ctx, NOTE_PATH)) {
    return { complete: true, effects: [{ type: 'nell', lines: [...pick(NELL.readNote, turn)] }] }
  }
  return null
}

const sos: Beat = {
  id: 'sos',
  hints: [
    'Nell asked you to message her.',
    'The `write` command sends a message to another user.',
    'Type `write nell`, press Enter, then type a message (like "hi") and press Enter.',
  ],
  on(input, ctx, state) {
    if (wroteToNell(input)) return { next: 'hunt', effects: [{ type: 'nell', lines: [...pick(NELL.greet, state.turn)] }] }
    return readNote(input, ctx, state.turn)
  },
}

const hunt: Beat = {
  id: 'hunt',
  hints: [
    "Nell's note is hidden: its name starts with a dot.",
    'Leave write mode (Ctrl-D or EOF). Then `ls -a` shows hidden files.',
    'Type `ls -a` in your home directory, then `cat .from_nell`.',
  ],
  on(input, ctx, state) {
    const event = commandEvent(input)
    if (event && listsAll(event, ctx, ctx.home)) {
      return { next: 'read', effects: [{ type: 'nell', lines: [...pick(NELL.foundNote, state.turn)] }] }
    }
    if (wroteToNell(input)) return { effects: [{ type: 'nell', lines: [...pick(NELL.huntChatter, state.turn)] }] }
    return readNote(input, ctx, state.turn)
  },
}

const read: Beat = {
  id: 'read',
  hints: ['You found the note. Now open it.', 'Notebooks open with `cat`.', 'Type `cat .from_nell`.'],
  on(input, ctx, state) {
    if (wroteToNell(input)) return { effects: [{ type: 'nell', lines: [...pick(NELL.readChatter, state.turn)] }] }
    return readNote(input, ctx, state.turn)
  },
}

export const level0: Level = {
  id: 0,
  title: 'The note with a dot',
  start: 'sos',
  beats: { sos, hunt, read },
  enter: [{ type: 'nell', lines: [...NELL.sos[0]] }],
}
