/** What the browser may send to /api/ghost. Nothing here is trusted as prompt text. */
export interface ChatEntry {
  from: 'player' | 'nell'
  text: string
}

export interface VoiceRequest {
  level: number
  beat: string
  /** Messages the player has written to Nell in this beat (incl. this one). */
  chats: number
  /** What the player just wrote. */
  text: string
  /** Recent conversation, oldest first, not including `text`. */
  history: ChatEntry[]
}

export const LIMITS = { text: 200, history: 8, entry: 300, beat: 40, chats: 1000 } as const

/** Validate an untrusted request body. Returns null if anything is off. */
export function parseVoiceRequest(value: unknown): VoiceRequest | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const { level, beat, chats, text, history } = v
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
  return { level, beat, chats, text, history: entries }
}
