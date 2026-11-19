import type { EndingKind } from '../story/types.js'

/** What the browser may send to /api/ghost. Nothing here is trusted as prompt text. */
export interface ChatEntry {
  from: 'player' | 'nell'
  text: string
}

export interface VoiceRequest {
  /** Language Nell answers in. Optional for older clients; defaults to English. */
  lang?: 'en' | 'zh'
  level: number
  beat: string
  /** Messages the player has written to Nell in this beat (incl. this one). */
  chats: number
  /** What the player just wrote. */
  text: string
  /** Recent conversation, oldest first, not including `text`. */
  history: ChatEntry[]
  /**
   * Postgame only: which ending happened. The server picks its own context
   * for it; only valid for the epilogue beat.
   */
  ending?: EndingKind
  /** Postgame only: the player left a line for the next visitor. */
  keepsake?: boolean
}

export const LIMITS = { text: 200, history: 8, entry: 300, beat: 40, chats: 1000 } as const

/** Largest request body the server accepts. */
export const MAX_BODY_BYTES = 4096

/** Validate an untrusted request body. Returns null if anything is off. */
export function parseVoiceRequest(value: unknown): VoiceRequest | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const { level, beat, chats, text, history, lang, ending, keepsake } = v
  if (lang !== undefined && lang !== 'en' && lang !== 'zh') return null
  if (ending !== undefined && ending !== 'move' && ending !== 'stay') return null
  if (keepsake !== undefined && typeof keepsake !== 'boolean') return null
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > 100) return null
  if (typeof beat !== 'string' || beat.length === 0 || beat.length > LIMITS.beat) return null
  if (typeof chats !== 'number' || !Number.isInteger(chats) || chats < 0 || chats > LIMITS.chats) return null
  if (typeof text !== 'string' || text.trim() === '' || text.length > LIMITS.text) return null
  if (!Array.isArray(history) || history.length > LIMITS.history) return null
  const entries: ChatEntry[] = []
  for (const entry of history) {
    if (typeof entry !== 'object' || entry === null) return null
    const e = entry as Record<string, unknown>
    if (e.from !== 'player' && e.from !== 'nell') return null
    if (typeof e.text !== 'string' || e.text.length > LIMITS.entry) return null
    entries.push({ from: e.from, text: e.text })
  }
  return {
    ...(lang === 'zh' ? { lang } : {}),
    level,
    beat,
    chats,
    text,
    history: entries,
    ...(ending !== undefined ? { ending } : {}),
    ...(keepsake === true ? { keepsake } : {}),
  }
}

const bodyBytes = (request: VoiceRequest) => new TextEncoder().encode(JSON.stringify(request)).length

/**
 * Drop the oldest history entries until the request fits the server's body
 * limit. Chinese text is 3 bytes per character in UTF-8, so a full history
 * could otherwise be refused (and Nell would fall back for no reason).
 */
export function fitVoiceRequest(request: VoiceRequest, maxBytes = MAX_BODY_BYTES): VoiceRequest {
  let fitted = request
  while (fitted.history.length > 0 && bodyBytes(fitted) > maxBytes) fitted = { ...fitted, history: fitted.history.slice(1) }
  return fitted
}
