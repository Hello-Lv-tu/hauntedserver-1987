import { CHAT_LIMITS, cleanChatText } from '../game/postgame.js'
import type { PostgameChat } from '../game/postgame.js'
import type { GameState } from '../game/types.js'

/** Pure helpers for the postgame chat window (unit-tested without a DOM). */

/** Is Nell's reply to a chat message still on its way? */
export const chatPending = (game: Pick<GameState, 'pendingVoices'>) => game.pendingVoices.some((p) => p.target === 'chat')

/** Send is possible when there is something to say and Nell is not typing. */
export function canSend(draft: string, pending: boolean): boolean {
  return !pending && cleanChatText(draft) !== ''
}

/** Characters left; shown only near the limit (null otherwise). */
export function charactersLeft(draft: string, warnAt = 40): number | null {
  const left = CHAT_LIMITS.send - draft.length
  return left <= warnAt ? Math.max(0, left) : null
}

/** Id of Nell's newest message, or -1. */
export function lastNellId(chat: PostgameChat | null): number {
  const last = chat?.messages.findLast((m) => m.from === 'nell')
  return last?.id ?? -1
}

/** Nell wrote something the player has not seen in the window yet. */
export function hasUnread(chat: PostgameChat | null, seenId: number): boolean {
  return lastNellId(chat) > seenId
}

/**
 * Is this Enter part of an input method composition (e.g. Chinese pinyin)?
 * Then it commits the text and must not send. Chrome reports `isComposing`;
 * Safari fires compositionend first and then a keydown with keyCode 229, so
 * both are checked, plus our own composition flag.
 */
export function isImeEnter(event: { key: string; isComposing: boolean; keyCode: number }, composing: boolean): boolean {
  return event.key === 'Enter' && (composing || event.isComposing || event.keyCode === 229)
}

/**
 * Focus trap: where Tab should go from `current` (index among the dialog's
 * focusable elements, -1 if focus is outside them). null: let the browser move.
 */
export function trapFocus(current: number, count: number, shift: boolean): number | null {
  if (count === 0) return null
  if (current < 0) return shift ? count - 1 : 0
  if (shift && current === 0) return count - 1
  if (!shift && current === count - 1) return 0
  return null
}
