import type { EndingKind } from '../story/types.js'
import { NELL } from '../story/lines.js'

/** Move: her first messages from 2026, after the tape (story.md: she complains about the font). */
const MOVE_ARRIVAL = ['whoa. am i in 2026??', 'why are all the buttons ROUND??', 'and this font is so... soft :-P', 'thank you, partner.'] as const

/**
 * Nell's messages on the ending sheet. They start with the farewell the
 * terminal just printed (NELL.packed or NELL.stayed), because the sheet opens
 * while that farewell is still typing out and would otherwise hide it. Each
 * farewell has exactly one variant, so these are the same words the player saw.
 */
export function endingMessages(kind: EndingKind): readonly string[] {
  return kind === 'move' ? [...NELL.packed[0], ...MOVE_ARRIVAL] : [...NELL.stayed[0]]
}
