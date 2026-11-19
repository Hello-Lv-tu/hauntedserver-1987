import { endLevel } from './levels/end.js'
import { level0 } from './levels/level0.js'
import { boss } from './levels/boss.js'
import { choice } from './levels/choice.js'
import { level1 } from './levels/level1.js'
import { level2 } from './levels/level2.js'
import { level3 } from './levels/level3.js'
import { level4 } from './levels/level4.js'
import { level5 } from './levels/level5.js'
import { NELL } from './lines.js'
import { looksLikeCommand, pick } from './matchers.js'
import type { Effect, Flags, Level, StoryCtx, StoryInput, StoryState } from './types.js'

export const LEVELS: readonly Level[] = [level0, level1, level2, level3, level4, level5, boss, choice]

export function levelAt(id: number): Level {
  return LEVELS[id] ?? endLevel(id)
}

/**
 * Story state and effects for the start of a level. With `ctx` (the world as
 * the previous level ends), a level whose goal is already met closes at once.
 */
export function levelEntry(level: number, flags: Flags = {}, ctx?: StoryCtx): { story: StoryState; effects: Effect[] } {
  const def = levelAt(level)
  const done = ctx ? (def.alreadyDone?.(ctx) ?? null) : null
  if (done !== null) {
    const next = levelEntry(level + 1, flags, ctx)
    return { story: next.story, effects: [...done, ...next.effects] }
  }
  return {
    story: { level, beat: def.start, flags, hintIndex: 0, turn: 0, chats: 0 },
    effects: [{ type: 'levelStart', level }, ...def.enter],
  }
}

export function isFinished(story: StoryState): boolean {
  return story.level >= LEVELS.length
}

/**
 * Advance the story by one input. Pure and deterministic: the same state and
 * input always give the same result. Inputs a beat does not care about leave
 * the state unchanged apart from the turn counter.
 */
export function storyStep(state: StoryState, input: StoryInput, ctx: StoryCtx): { story: StoryState; effects: Effect[] } {
  const level = levelAt(state.level)
  const beat = level.beats[state.beat] ?? level.beats[level.start]
  const wroteToNell = input.type === 'wrote' && input.to === 'nell'
  const now: StoryState = { ...state, turn: state.turn + 1, chats: state.chats + (wroteToNell ? 1 : 0) }

  const askedForHint = input.type === 'hint' || (input.type === 'wrote' && input.text.trim() === 'hint')
  if (askedForHint) {
    const text = beat.hints[Math.min(now.hintIndex, beat.hints.length - 1)]
    return { story: { ...now, hintIndex: now.hintIndex + 1 }, effects: [{ type: 'hint', text }] }
  }

  let transition = beat.on(input, ctx, now) ?? level.on?.(input, ctx, now) ?? null

  // Typing a command into write mode is a common slip; Nell points it out.
  // A beat that moves the story on (e.g. her first greeting) still wins.
  const movesOn = transition !== null && (transition.next !== undefined || transition.complete === true)
  if (input.type === 'wrote' && looksLikeCommand(input.text) && !movesOn) {
    // Kept pre-written: it is an instruction, not small talk.
    transition = { effects: [{ type: 'nell', lines: [...pick(NELL.stillWriting, now.turn)] }] }
  } else if (input.type === 'wrote' && wroteToNell && !movesOn) {
    // Small talk: Nell's AI voice may answer the player's own words.
    // Story-moving lines (greetings, reactions) always stay pre-written.
    const chatter = transition?.effects?.filter((e) => e.type === 'nell') ?? []
    const fallback = chatter.length > 0 && chatter[0].type === 'nell' ? chatter[0].lines : [...pick(NELL.chatter, now.turn)]
    const others = transition?.effects?.filter((e) => e.type !== 'nell') ?? []
    transition = { ...transition, effects: [...others, { type: 'nellVoice', fallback, text: input.text }] }
  }
  if (transition === null) return { story: now, effects: [] }

  const flags = transition.flags ? { ...now.flags, ...transition.flags } : now.flags
  const effects = transition.effects ?? []

  if (transition.complete) {
    // Completing transitions never change processes or files, so ctx still
    // describes the world the next level starts in.
    const next = levelEntry(now.level + 1, flags, ctx)
    return { story: next.story, effects: [...effects, ...next.effects] }
  }
  if (transition.next && transition.next !== now.beat) {
    return { story: { ...now, flags, beat: transition.next, hintIndex: 0, chats: 0 }, effects }
  }
  return { story: { ...now, flags }, effects }
}
