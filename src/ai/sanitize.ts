/** Nell's limits from .kiro/steering/ghost-persona.md. */
export const MAX_LINES = 3
export const MAX_CHARS = 199

/** Emoji and their joiners; ™ © ® are allowed (every text font has them). */
const EMOJI = /(?![\u2122\u00a9\u00ae])\p{Extended_Pictographic}|\u200d|\ufe0f/gu

/** Anything that breaks the fourth wall, names a vendor, or links out. */
const FORBIDDEN =
  /\b(ai|a\.i\.|artificial intelligence|language model|llm|chat ?bot|chatgpt|gpt|openai|deepseek|anthropic|claude|gemini|prompt|system message|instructions?)\b|https?:\/\/|www\./i

/**
 * Turn raw model output into at most 3 safe lines under 200 characters,
 * or null if it cannot be used (the caller then shows the fallback line).
 */
export function sanitizeReply(raw: string): string[] | null {
  let text = raw.replace(/\r/g, '').replace(EMOJI, '').trim()
  // Unwrap a reply the model put in quotes.
  text = text.replace(/^["“”']+|["“”']+$/g, '').trim()
  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  if (FORBIDDEN.test(text)) return null

  const lines = text
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*(nell|eleanor)\s*[:>-]\s*/i, '')
        .replace(/\*\*|__/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((line) => line !== '')
    .slice(0, MAX_LINES)

  const out: string[] = []
  let used = 0
  for (const line of lines) {
    const room = MAX_CHARS - used - out.length // count line breaks as one character
    if (room <= 3) break
    if (line.length <= room) {
      out.push(line)
      used += line.length
      continue
    }
    const cut = line.slice(0, room - 3)
    const atWord = cut.lastIndexOf(' ') > room / 2 ? cut.slice(0, cut.lastIndexOf(' ')) : cut
    out.push(atWord.trimEnd() + '...')
    break
  }
  return out.length > 0 ? out : null
}
