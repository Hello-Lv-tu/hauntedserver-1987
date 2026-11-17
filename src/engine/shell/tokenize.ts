import type { Result } from '../vfs/types.js'
import { fail, ok } from '../vfs/types.js'

export type Token = { type: 'word'; value: string } | { type: 'pipe' }

export type TokenizeError =
  | { kind: 'unmatched'; quote: "'" | '"' }
  | { kind: 'unsupported'; operator: string }

/** Operators csh understands but this terminal deliberately does not. */
const UNSUPPORTED = new Set(['>', '<', ';', '&', '`'])

/**
 * Split a command line into words and pipes, csh style:
 * - whitespace separates words
 * - '...' is fully literal
 * - "..." is literal except \" and \\
 * - \x outside quotes is a literal x
 * - | separates pipeline stages
 */
export function tokenize(line: string): Result<Token[], TokenizeError> {
  const tokens: Token[] = []
  let word = ''
  let inWord = false
  let i = 0

  const endWord = () => {
    if (inWord) tokens.push({ type: 'word', value: word })
    word = ''
    inWord = false
  }

  while (i < line.length) {
    const ch = line[i]

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      endWord()
      i++
    } else if (ch === '|') {
      endWord()
      tokens.push({ type: 'pipe' })
      i++
    } else if (UNSUPPORTED.has(ch)) {
      const operator = line[i + 1] === ch && ch !== '`' ? ch + ch : ch
      return fail({ kind: 'unsupported', operator })
    } else if (ch === "'") {
      const end = line.indexOf("'", i + 1)
      if (end === -1) return fail({ kind: 'unmatched', quote: "'" })
      word += line.slice(i + 1, end)
      inWord = true
      i = end + 1
    } else if (ch === '"') {
      i++
      let closed = false
      while (i < line.length) {
        const c = line[i]
        if (c === '"') {
          closed = true
          i++
          break
        }
        if (c === '\\' && (line[i + 1] === '"' || line[i + 1] === '\\')) {
          word += line[i + 1]
          i += 2
        } else {
          word += c
          i++
        }
      }
      if (!closed) return fail({ kind: 'unmatched', quote: '"' })
      inWord = true
    } else if (ch === '\\') {
      // A trailing backslash is kept literally.
      word += i + 1 < line.length ? line[i + 1] : '\\'
      inWord = true
      i += 2
    } else {
      word += ch
      inWord = true
      i++
    }
  }
  endWord()
  return ok(tokens)
}

/** Quote a word so `tokenize` reads it back unchanged. */
export function quote(word: string): string {
  return `'${word.replaceAll("'", `'\\''`)}'`
}
