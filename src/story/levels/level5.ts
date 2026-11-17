import type { FileNode } from '../../engine/vfs/types.js'
import { PATHS, TAMPERED_MESSAGES } from '../content.js'
import { JACK_MORE, LOG_LESSON, NELL } from '../lines.js'
import { absoluteArg, commandEvent, operands, pick, ran } from '../matchers.js'
import type { Beat, Effect, Level, StoryState } from '../types.js'

const tampered: FileNode = { kind: 'file', name: 'messages', owner: 'root', group: 'wheel', mode: 0o644, mtime: '1987-11-17 03:14', content: TAMPERED_MESSAGES }
const nell = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'nell', lines: [...pick(variants, state.turn)] })

const lies: Beat = {
  id: 'lies',
  hints: [
    "A log that looks official isn't proof. Compare it with an independent copy that Jack didn't touch.",
    'The old copy is /usr/adm/messages.0, the current one is /usr/adm/messages. `diff` compares two files: give it both.',
    'Type `diff /usr/adm/messages.0 /usr/adm/messages` (usr has no e; two file names separated by a space).',
  ],
  on(input, ctx, state) {
    const event = commandEvent(input)
    if (event && event.name === 'diff') {
      const files = new Set(operands(event).map((a) => absoluteArg(a, event, ctx)))
      // diff exits 1 when the files differ (Requirement 2.5).
      if (files.has(PATHS.messages) && files.has(PATHS.messagesOld) && event.status === 1) {
        return { complete: true, effects: [nell(NELL.l5Done, state), { type: 'lesson', card: LOG_LESSON }] }
      }
    }
    if (event && ran(event, 'last')) return { effects: [nell(NELL.l5Last, state)] }
    if (input.type === 'wrote' && input.to === 'nell') return { effects: [nell(NELL.l5Chatter, state)] }
    return null
  },
}

export const level5: Level = {
  id: 5,
  title: 'The log that lied',
  start: 'lies',
  beats: { lies },
  enter: [
    { type: 'writeFile', path: PATHS.messages, node: tampered },
    { type: 'jack', lines: [...JACK_MORE.l5[0]] },
    { type: 'nell', lines: [...NELL.l5Start[0]] },
  ],
}
