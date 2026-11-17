export interface ParsedFlags {
  flags: Set<string>
  /** Values for flags that take an argument, e.g. head -n 5. */
  values: Map<string, string>
  operands: string[]
}

export interface FlagSpec {
  /** Single-letter boolean flags, e.g. "agl". */
  boolean?: string
  /** Single-letter flags that take a value, e.g. "n". */
  valued?: string
  /** Accept "-5" as shorthand for "-n 5" (old head/tail style). */
  numericAs?: string
}

/**
 * Parse BSD-style short flags. Flags stop at the first operand or "--".
 * A lone "-" is an operand. Returns the offending letter on error.
 */
export function parseFlags(args: string[], spec: FlagSpec): { ok: true; value: ParsedFlags } | { ok: false; bad: string } {
  const boolean = spec.boolean ?? ''
  const valued = spec.valued ?? ''
  const flags = new Set<string>()
  const values = new Map<string, string>()
  let i = 0

  for (; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--') {
      i++
      break
    }
    if (!arg.startsWith('-') || arg === '-') break

    if (spec.numericAs && /^-\d+$/.test(arg)) {
      values.set(spec.numericAs, arg.slice(1))
      continue
    }

    for (let j = 1; j < arg.length; j++) {
      const letter = arg[j]
      if (valued.includes(letter)) {
        const rest = arg.slice(j + 1)
        const value = rest !== '' ? rest : args[++i]
        if (value === undefined) return { ok: false, bad: letter }
        values.set(letter, value)
        break
      }
      if (!boolean.includes(letter)) return { ok: false, bad: letter }
      flags.add(letter)
    }
  }
  return { ok: true, value: { flags, values, operands: args.slice(i) } }
}
