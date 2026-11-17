import { AI_LESSON, JACK_MORE, NELL } from '../lines.js'
import { absoluteArg, commandEvent, hasFlag, operands, pick } from '../matchers.js'
import type { Beat, Effect, Level, StoryCtx, StoryInput, StoryState, Transition } from '../types.js'

const nell = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'nell', lines: [...pick(variants, state.turn)] })

/** `rm -r` aimed at the player's home or anything above it. */
function wipedHome(input: StoryInput, ctx: StoryCtx): boolean {
  const event = commandEvent(input)
  if (!event || event.name !== 'rm' || !hasFlag(event, 'r')) return false
  return operands(event).some((arg) => {
    const abs = absoluteArg(arg, event, ctx)
    return abs !== null && (ctx.home === abs || ctx.home.startsWith(abs === '/' ? '/' : `${abs}/`))
  })
}

function shared(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null {
  // Following the assistant's advice: Jack eats the player (level restarts).
  if (wipedHome(input, ctx)) {
    return { effects: [{ type: 'jack', lines: [...pick(JACK_MORE.l4Eaten, state.turn)] }, { type: 'eaten' }] }
  }
  const event = commandEvent(input)
  if (event && event.name === 'man' && event.status === 0 && event.args.includes('rm') && !state.flags.readManRm) {
    return { next: 'decide', flags: { readManRm: true }, effects: [nell(NELL.l4ReadMan, state)] }
  }
  if (input.type === 'assistant' && input.action === 'decline') {
    if (!state.flags.readManRm) return { effects: [{ type: 'assistant', action: 'nag' }, nell(NELL.l4DeclineEarly, state)] }
    return { complete: true, effects: [{ type: 'assistant', action: 'hide' }, nell(NELL.l4Done, state), { type: 'lesson', card: AI_LESSON }] }
  }
  if (input.type === 'wrote' && input.to === 'nell') return { effects: [nell(NELL.l4Chatter, state)] }
  return null
}

const advice: Beat = {
  id: 'advice',
  hints: [
    "AI assistants can sound sure and still be wrong. Don't run advice you don't understand.",
    'Check what the command does first: `man rm`.',
    'Type `man rm`, then press "No thanks" in the assistant.',
  ],
  on: shared,
}

const decide: Beat = {
  id: 'decide',
  hints: [
    'You read what rm -rf ~ does. Would a real helper suggest that?',
    'Turn the assistant down.',
    'Press "No thanks" in the assistant bubble.',
  ],
  on: shared,
}

export const level4: Level = {
  id: 4,
  title: 'The assistant that lied',
  start: 'advice',
  beats: { advice, decide },
  enter: [
    { type: 'jack', lines: [...JACK_MORE.l4[0]] },
    { type: 'assistant', action: 'show' },
    { type: 'nell', lines: [...NELL.l4Start[0]] },
  ],
}
