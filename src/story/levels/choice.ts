import { NELL } from '../lines.js'
import { absoluteArg, commandEvent, operands, pick, readsFile } from '../matchers.js'
import type { Beat, Effect, Level, StoryCtx, StoryInput, StoryState, Transition } from '../types.js'

export const DIARY_PATH = '/usr/users/nell/.diary'
const NELL_HOME = '/usr/users/nell'
/** Longest line the player may leave for the next visitor. */
export const LEGACY_MAX = 100

const nell = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'nell', lines: [...pick(variants, state.turn)] })
const wrote = (input: StoryInput): string | null => (input.type === 'wrote' && input.to === 'nell' ? input.text : null)

/**
 * Deterministic keyword match: the AI never decides the ending.
 * Returns null when the answer is unclear (both or neither).
 */
export function choiceOf(text: string): 'move' | 'stay' | null {
  const t = text.toLowerCase()
  const move = /\b(come|go|take|move|leave|with me|with you|bring)\b/.test(t)
  const stay = /\b(stay|home|remain|guard|here)\b/.test(t)
  if (move === stay) return null
  return move ? 'move' : 'stay'
}

/** True for ASCII control characters (newlines, escapes, DEL). */
export const isControl = (ch: string) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127

/** Clean the visitor line: one line, printable, bounded. */
export function cleanLegacy(text: string): string {
  const printable = [...text].map((ch) => (isControl(ch) ? ' ' : ch)).join('')
  return printable.replace(/\s+/g, ' ').trim().slice(0, LEGACY_MAX)
}

/** Diary and riddle can happen any time before the choice; both unlock the legacy question. */
function secrets(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null {
  const event = commandEvent(input)
  const flags = state.flags
  let found: Record<string, boolean> | null = null
  let line: Effect | null = null
  if (event && !flags.readDiary && readsFile(event, ctx, DIARY_PATH)) {
    found = { readDiary: true }
    line = nell(NELL.readDiary, state)
  }
  const text = wrote(input)
  if (text !== null && !flags.solvedRiddle && /\bkey ?boards?\b/i.test(text)) {
    found = { solvedRiddle: true }
    line = nell(NELL.riddleSolved, state)
  }
  if (found === null || line === null) return null
  const now = { ...flags, ...found }
  if (now.readDiary && now.solvedRiddle && !now.legacySaved) {
    return { next: 'legacy', flags: found, effects: [line, nell(NELL.askLegacy, state)] }
  }
  return { flags: found, effects: [line] }
}

function decide(text: string, state: StoryState): Transition | null {
  const choice = choiceOf(text)
  if (choice === 'move') return { next: 'pack', effects: [nell(NELL.pack, state)] }
  if (choice === 'stay') return { complete: true, effects: [nell(NELL.stayed, state), { type: 'ending', kind: 'stay' }] }
  return null
}

const choose: Beat = {
  id: 'choose',
  hints: [
    'Nell asked whether she should come with you or stay. Tell her in write mode.',
    'Type `write nell`, then `come with me` or `stay`.',
    'Type `write nell`, then `stay` (or `come with me`).',
  ],
  on(input, ctx, state) {
    const found = secrets(input, ctx, state)
    if (found) return found
    const text = wrote(input)
    if (text === null) return null
    return decide(text, state) ?? { effects: [nell(NELL.chooseChatter, state)] }
  },
}

const legacy: Beat = {
  id: 'legacy',
  hints: [
    'Nell is waiting for one line for the next visitor.',
    'Write it to her in write mode.',
    'Type `write nell`, then your line.',
  ],
  on(input, ctx, state) {
    const found = secrets(input, ctx, state)
    if (found) return found
    const text = wrote(input)
    if (text === null) return null
    const line = cleanLegacy(text)
    if (line === '') return null
    return { next: 'choose', flags: { legacySaved: true }, effects: [{ type: 'legacy', text: line }, nell(NELL.legacySaved, state)] }
  },
}

/** `tar c...` of Nell's home packs her onto tape. */
function packsNell(input: StoryInput, ctx: StoryCtx): boolean {
  const event = commandEvent(input)
  if (!event || event.name !== 'tar' || event.status !== 0 || !/c/.test(event.args[0] ?? '')) return false
  return operands(event).some((arg) => absoluteArg(arg, event, ctx) === NELL_HOME)
}

const pack: Beat = {
  id: 'pack',
  hints: [
    'Nell wants to travel the 1987 way: on tape.',
    '`tar cvf /dev/rmt0 ~nell` writes her home directory to the tape drive. Stop writing to her first.',
    'Press Ctrl-D (or type `EOF`), then type `tar cvf /dev/rmt0 ~nell`.',
  ],
  on(input, ctx, state) {
    if (packsNell(input, ctx)) return { complete: true, effects: [nell(NELL.packed, state), { type: 'ending', kind: 'move' }] }
    const found = secrets(input, ctx, state)
    if (found) return found
    const text = wrote(input)
    if (text === null) return null
    // Changing her mind is allowed until the tape runs.
    if (choiceOf(text) === 'stay') return decide(text, state)
    return { effects: [nell(NELL.packChatter, state)] }
  },
}

export const choice: Level = {
  id: 7,
  title: 'Come with me, or stay',
  start: 'choose',
  beats: { choose, legacy, pack },
  enter: [{ type: 'nell', lines: [...NELL.choose[0]] }],
}
