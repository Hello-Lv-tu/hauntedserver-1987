import { parseFlags } from '../shell/flags'
import type { Command, OutputLine } from '../shell/types'
import { stderr, stdout } from '../shell/types'
import { readInputs } from './common'

/** Print files (or stdin) in order, with errors where they happen. */
function concatenate(cmd: string): Command {
  return (args, ctx) => {
    const lines: OutputLine[] = []
    let status = 0
    const targets = args.length === 0 ? [[]] : args.map((a) => [a])
    for (const target of targets) {
      const { inputs, errors } = readInputs(cmd, target, ctx)
      for (const input of inputs) lines.push(...input.lines.map(stdout))
      lines.push(...errors)
      if (errors.length > 0) status = 1
    }
    return { lines, status }
  }
}

// period: 4.3BSD cat has flags, but none are needed in this game.
export const cat = concatenate('cat')
/** No paging in this version: more prints the whole file. */
export const more = concatenate('more')

function headTail(which: 'head' | 'tail'): Command {
  const usage = `usage: ${which} [-n count] [file ...]`
  return (args, ctx) => {
    const parsed = parseFlags(args, { valued: 'n', numericAs: 'n' })
    if (!parsed.ok) return { lines: [stderr(usage)], status: 1 }
    const rawCount = parsed.value.values.get('n') ?? '10'
    const count = Number(rawCount)
    if (!Number.isInteger(count) || count < 0) {
      return { lines: [stderr(`${which}: illegal line count -- ${rawCount}`)], status: 1 }
    }
    const { inputs, errors } = readInputs(which, parsed.value.operands, ctx)
    const lines: OutputLine[] = [...errors]
    const showNames = inputs.length > 1
    for (const [i, input] of inputs.entries()) {
      if (showNames) {
        if (i > 0) lines.push(stdout(''))
        lines.push(stdout(`==> ${input.name} <==`))
      }
      const picked = which === 'head' ? input.lines.slice(0, count) : count === 0 ? [] : input.lines.slice(-count)
      lines.push(...picked.map(stdout))
    }
    return { lines, status: errors.length > 0 ? 1 : 0 }
  }
}

export const head = headTail('head')
export const tail = headTail('tail')

export const wc: Command = (args, ctx) => {
  const parsed = parseFlags(args, { boolean: 'lwc' })
  if (!parsed.ok) return { lines: [stderr('usage: wc [-clw] [file ...]')], status: 1 }
  const { flags, operands } = parsed.value
  const pick = flags.size === 0 ? new Set(['l', 'w', 'c']) : flags
  const { inputs, errors } = readInputs('wc', operands, ctx)
  const lines: OutputLine[] = [...errors]
  const total = { l: 0, w: 0, c: 0 }

  // period: 4.3BSD wc prints each count right-aligned in 8 columns.
  const format = (counts: typeof total, name: string | null) => {
    let text = ''
    for (const key of ['l', 'w', 'c'] as const) if (pick.has(key)) text += String(counts[key]).padStart(8)
    return stdout(name === null ? text : `${text} ${name}`)
  }

  for (const input of inputs) {
    const text = input.lines.map((l) => l + '\n').join('')
    const counts = {
      l: input.lines.length,
      w: text.split(/\s+/).filter((w) => w !== '').length,
      c: new TextEncoder().encode(text).length,
    }
    total.l += counts.l
    total.w += counts.w
    total.c += counts.c
    lines.push(format(counts, input.name))
  }
  if (inputs.length > 1) lines.push(format(total, 'total'))
  return { lines, status: errors.length > 0 ? 1 : 0 }
}

export const grep: Command = (args, ctx) => {
  const usage = 'usage: grep [-cinv] pattern [file ...]'
  const parsed = parseFlags(args, { boolean: 'cinv' })
  if (!parsed.ok) return { lines: [stderr(usage)], status: 2 }
  const { flags, operands } = parsed.value
  const [pattern, ...files] = operands
  if (pattern === undefined) return { lines: [stderr(usage)], status: 2 }

  const regex = compileBre(pattern, flags.has('i'))
  if (regex === null) return { lines: [stderr('grep: RE error')], status: 2 }

  const { inputs, errors } = readInputs('grep', files, ctx)
  const lines: OutputLine[] = [...errors]
  const showNames = inputs.length > 1
  let matched = false

  for (const input of inputs) {
    const prefix = showNames ? `${input.name}:` : ''
    let count = 0
    for (const [index, line] of input.lines.entries()) {
      const isMatch = regex.test(line) !== flags.has('v')
      if (!isMatch) continue
      matched = true
      count++
      if (!flags.has('c')) lines.push(stdout(`${prefix}${flags.has('n') ? `${index + 1}:` : ''}${line}`))
    }
    if (flags.has('c')) lines.push(stdout(`${prefix}${count}`))
  }
  if (errors.length > 0) return { lines, status: 2 }
  return { lines, status: matched ? 0 : 1 }
}

/**
 * Translate a POSIX basic regular expression to a JS RegExp.
 * In BRE, + ? | ( ) { } are literal and \( \) \{ \} are special.
 * Returns null for invalid patterns.
 */
export function compileBre(pattern: string, ignoreCase: boolean): RegExp | null {
  let source = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '\\') {
      const next = pattern[i + 1]
      if (next === undefined) return null
      i++
      source += '(){}'.includes(next) ? next : `\\${next}`
    } else if ('+?|(){}/'.includes(ch)) {
      source += `\\${ch}`
    } else if (ch === '*' && (source === '' || source === '^' || source.endsWith('('))) {
      // In BRE a leading "*" is a literal star.
      source += '\\*'
    } else {
      source += ch
    }
  }
  try {
    return new RegExp(source, ignoreCase ? 'i' : '')
  } catch {
    return null
  }
}
