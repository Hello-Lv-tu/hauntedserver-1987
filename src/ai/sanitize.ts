/** Nell's limits from .kiro/steering/ghost-persona.md. */
export const MAX_LINES = 3
export const MAX_CHARS = 199
/** Wrap like an 80-column terminal, with room for the left edge. */
export const WRAP_COLUMNS = 72

/** Emoji and their joiners; ™ © ® are allowed (every text font has them). */
const EMOJI = /(?![\u2122\u00a9\u00ae])\p{Extended_Pictographic}|\u200d|\ufe0f/gu

/** Anything that breaks the fourth wall, names a vendor, or links out. */
const FORBIDDEN =
  /\b(ai|a\.i\.|artificial intelligence|language model|llm|chat ?bot|chatgpt|gpt|openai|deepseek|anthropic|claude|gemini|prompt|system message|instructions?)\b|https?:\/\/|www\.|人工智能|语言模型|大模型|聊天机器人|提示词|系统提示|指令/i

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

  const wrapped = text
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*(nell|eleanor)\s*[:>-]\s*/i, '')
        .replace(/\*\*|__/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((line) => line !== '')
    .flatMap(wrap)
  const lines = endAtSentence(wrapped)

  const out: string[] = []
  let used = 0
  for (const line of lines) {
    const room = MAX_CHARS - used - out.length // count line breaks as one character
    const length = [...line].length
    if (room <= 3) break
    if (length <= room) {
      out.push(line)
      used += length
      continue
    }
    const cut = line.slice(0, room - 3)
    const atWord = cut.lastIndexOf(' ') > room / 2 ? cut.slice(0, cut.lastIndexOf(' ')) : cut
    out.push(atWord.trimEnd() + '...')
    break
  }
  return out.length > 0 ? out : null
}

/**
 * Keep at most MAX_LINES lines. If text had to be dropped, end at the last
 * finished sentence instead of mid-phrase ("then peek at").
 */
export function endAtSentence(lines: string[]): string[] {
  if (lines.length <= MAX_LINES) return lines
  const kept = lines.slice(0, MAX_LINES)
  for (let i = kept.length - 1; i >= 0; i--) {
    const end = Math.max(kept[i].lastIndexOf('. '), kept[i].lastIndexOf('! '), kept[i].lastIndexOf('? '), kept[i].lastIndexOf(') '))
    if (/[.!?)]$/.test(kept[i])) return kept.slice(0, i + 1)
    if (end > 0) return [...kept.slice(0, i), kept[i].slice(0, end + 1)]
  }
  return [...kept.slice(0, -1), kept[kept.length - 1].replace(/\s*\S*$/, '...')]
}

/** A wrap unit and whether a space separated it from the previous one. */
interface Token {
  text: string
  spaced: boolean
}

/**
 * Split a line into wrap units: a `backtick command` is one unit, each
 * Chinese character is its own unit (Chinese has no spaces), other words
 * are split at spaces.
 */
function tokens(line: string): Token[] {
  const out: Token[] = []
  const re = /\s+|`[^`]*`\S*|[\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff00-\uffef\u3000-\u303f]|[^\s`\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff00-\uffef\u3000-\u303f]+/g
  let spaced = false
  for (const match of line.matchAll(re)) {
    const text = match[0]
    if (/^\s+$/.test(text)) {
      spaced = true
      continue
    }
    out.push({ text, spaced })
    spaced = false
  }
  return out
}

/** Split a line at word boundaries so no piece exceeds WRAP_COLUMNS. */
export function wrap(line: string): string[] {
  const out: string[] = []
  let current = ''
  for (const token of tokens(line)) {
    const joiner = current !== '' && token.spaced ? ' ' : ''
    const candidate = current + joiner + token.text
    if (displayWidth(candidate) <= WRAP_COLUMNS) {
      current = candidate
      continue
    }
    if (current !== '') out.push(current)
    current = token.text
    while (displayWidth(current) > WRAP_COLUMNS) {
      const cut = fitColumns(current, WRAP_COLUMNS)
      out.push(current.slice(0, cut))
      current = current.slice(cut)
    }
  }
  if (current !== '') out.push(current)
  return out
}

/** Terminal columns: CJK and full-width characters take two. */
export function displayWidth(text: string): number {
  let width = 0
  for (const ch of text) width += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(ch) ? 2 : 1
  return width
}

/** How many UTF-16 units of `text` fit in `columns`. */
function fitColumns(text: string, columns: number): number {
  let width = 0
  let index = 0
  for (const ch of text) {
    const w = displayWidth(ch)
    if (width + w > columns) break
    width += w
    index += ch.length
  }
  return Math.max(index, 1)
}
