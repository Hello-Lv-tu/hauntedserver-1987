import type { FileNode } from '../../engine/vfs/types.js'
import { canAccess } from '../../engine/vfs/Vfs.js'
import { PATHS, RANSOM_NOTE } from '../content.js'
import { JACK_MORE, NELL, RANSOMWARE_LESSON } from '../lines.js'
import { commandEvent, hasFlag, pick } from '../matchers.js'
import type { Beat, Effect, Level, StoryCtx, StoryInput, StoryState, Transition } from '../types.js'

export const LOCKED = [PATHS.readme, PATHS.login] as const

const note: FileNode = { kind: 'file', name: 'RANSOM_NOTE', owner: 'root', group: 'wheel', mode: 0o644, mtime: '1987-11-17 03:14', content: RANSOM_NOTE }
const nell = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'nell', lines: [...pick(variants, state.turn)] })

/** Done when the player can read every locked file again (Requirement 2.3). */
function allUnlocked(ctx: StoryCtx): boolean {
  return LOCKED.every((path) => {
    const node = ctx.vfs.stat(path, { cwd: '/', home: '/', user: 'root' })
    return node.ok && canAccess(node.value, 'guest', 'r')
  })
}

function unlock(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null {
  if (input.type === 'command' && allUnlocked(ctx)) {
    return { complete: true, effects: [nell(NELL.l3Done, state), { type: 'lesson', card: RANSOMWARE_LESSON }] }
  }
  return null
}

const locked: Beat = {
  id: 'locked',
  hints: [
    '"Pay to unlock" is the ransomware playbook. Never pay first: check what really happened to the files.',
    '`ls -l` shows each file\'s size and permission bits. Are the files really scrambled, or just locked?',
    'Type `ls -l`, then `chmod 644 README .login`.',
  ],
  on(input, ctx, state) {
    const event = commandEvent(input)
    if (event && event.name === 'ls' && hasFlag(event, 'l')) {
      return unlock(input, ctx, state) ?? { next: 'unlock', effects: [nell(NELL.l3Looked, state)] }
    }
    if (input.type === 'wrote' && input.to === 'nell') return { effects: [nell(NELL.l3Chatter, state)] }
    return unlock(input, ctx, state)
  },
}

const unlock_: Beat = {
  id: 'unlock',
  hints: [
    'The bytes are intact; only the permission bits changed.',
    '`chmod 644 file` gives you read and write again (see `man chmod`).',
    'Type `chmod 644 README .login`.',
  ],
  on(input, ctx, state) {
    if (input.type === 'wrote' && input.to === 'nell') return { effects: [nell(NELL.l3Chatter, state)] }
    return unlock(input, ctx, state)
  },
}

export const level3: Level = {
  id: 3,
  title: 'Files held for ransom',
  start: 'locked',
  beats: { locked, unlock: unlock_ },
  enter: [
    ...LOCKED.map((path): Effect => ({ type: 'setMode', path, mode: 0o000 })),
    { type: 'writeFile', path: PATHS.ransom, node: note },
    { type: 'jack', lines: [...JACK_MORE.l3[0]] },
    { type: 'nell', lines: [...NELL.l3Start[0]] },
  ],
}
