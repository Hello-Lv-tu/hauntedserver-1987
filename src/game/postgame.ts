import type { ChatEntry } from '../ai/request.js'
import { LIMITS } from '../ai/request.js'
import { isControl } from '../story/levels/choice.js'
import type { EndingKind } from '../story/types.js'

/**
 * The short conversation with Nell after an ending (see "Postgame" in
 * .kiro/steering/story.md). Stored only in this browser, separate from the
 * version-1 save, so old saves keep loading unchanged.
 */
export const POSTGAME_KEY = 'hauntedserver:postgame'

export const CHAT_LIMITS = {
  /** Messages kept (and stored). */
  messages: 30,
  /** Longest stored message. Nell's replies are under 200 characters. */
  stored: LIMITS.entry,
  /** Longest message the player may send (what the server accepts). */
  send: LIMITS.text,
  /** Messages sent to the AI as context. */
  history: LIMITS.history,
} as const

export interface PostgameMessage {
  id: number
  from: 'player' | 'nell'
  text: string
}

export interface PostgameChat {
  ending: EndingKind
  messages: PostgameMessage[]
  nextId: number
}

export function emptyChat(ending: EndingKind): PostgameChat {
  return { ending, messages: [], nextId: 0 }
}

/** Cut to at most `max` UTF-16 units without splitting a surrogate pair. */
function cap(text: string, max: number): string {
  let out = ''
  for (const ch of text) {
    if (out.length + ch.length > max) break
    out += ch
  }
  return out
}

/** One printable line, collapsed spaces, at most `max` characters. */
export function cleanChatText(text: string, max: number = CHAT_LIMITS.send): string {
  const printable = [...text].map((ch) => (isControl(ch) ? ' ' : ch)).join('')
  return cap(printable.replace(/\s+/g, ' ').trim(), max).trim()
}

/** Append a message; the oldest ones drop off. Empty text is ignored. */
export function addMessage(chat: PostgameChat, from: PostgameMessage['from'], text: string): PostgameChat {
  const clean = cleanChatText(text, CHAT_LIMITS.stored)
  if (clean === '') return chat
  const messages = [...chat.messages, { id: chat.nextId, from, text: clean }].slice(-CHAT_LIMITS.messages)
  return { ...chat, messages, nextId: chat.nextId + 1 }
}

/** The recent chat as AI context: last 8 entries, each within the server limit. */
export function chatHistory(chat: PostgameChat): ChatEntry[] {
  return chat.messages.slice(-CHAT_LIMITS.history).map((m) => ({ from: m.from, text: cap(m.text, LIMITS.entry) }))
}

export const playerMessages = (chat: PostgameChat) => chat.messages.filter((m) => m.from === 'player').length

const CJK = /[\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/

/**
 * Reply lines were wrapped for an 80-column terminal; a chat bubble wraps by
 * itself. Join them with spaces, except between Chinese characters.
 */
export function joinLines(lines: readonly string[]): string {
  return lines.reduce((out, line) => {
    if (out === '') return line
    return CJK.test(out.at(-1) ?? '') || CJK.test(line[0] ?? '') ? out + line : `${out} ${line}`
  }, '')
}

/** Parse stored chat. Anything malformed gives null (a fresh chat). Never throws. */
export function parsePostgame(raw: string | null): PostgameChat | null {
  if (raw === null) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  if (v.version !== 1 || (v.ending !== 'move' && v.ending !== 'stay') || !Array.isArray(v.messages)) return null
  // Accept a little more than we write, but never an unbounded list.
  if (v.messages.length > CHAT_LIMITS.messages * 2) return null
  let chat = emptyChat(v.ending)
  for (const entry of v.messages) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return null
    const e = entry as Record<string, unknown>
    if ((e.from !== 'player' && e.from !== 'nell') || typeof e.text !== 'string') return null
    chat = addMessage(chat, e.from, e.text)
  }
  return chat
}

export function serializePostgame(chat: PostgameChat): string {
  return JSON.stringify({ version: 1, ending: chat.ending, messages: chat.messages.map(({ from, text }) => ({ from, text })) })
}
