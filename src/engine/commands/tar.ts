import type { Command, OutputLine } from '../shell/types.js'
import { hint, stderr, stdout } from '../shell/types.js'
import { canAccess } from '../vfs/Vfs.js'
import type { VNode } from '../vfs/types.js'
import { pathCtx } from './common.js'

/** Tape devices on vax3. period: rmt0 is the first 9-track drive. */
export const TAPES = new Set(['/dev/rmt0', '/dev/rmt8', '/dev/mt0'])

/**
 * period: 4.3BSD tar. Only `c` (create) is supported: it "writes" files to
 * tape and, with `v`, lists them as `a path N blocks`. Options are letters
 * with or without a dash; `f` takes the next operand as the archive.
 */
const EXAMPLE = hint('Example: `tar cvf /dev/rmt0 ~nell`: four parts with spaces between them; rmt0 ends in the digit zero.')

/** Add the example to any error, so a typo never leaves the player guessing. */
export const tar: Command = (args, ctx) => {
  const result = tarCore(args, ctx)
  if (result.status === 0) return result
  const [keys = ''] = args
  const glued = /^-?([cvftx]+)(\/\S+)$/.exec(keys)
  const extra = glued ? hint(`Put a space after the options: \`tar ${[glued[1], glued[2], ...args.slice(1)].join(' ')}\``) : EXAMPLE
  return { ...result, lines: [...result.lines, extra] }
}

const tarCore: Command = (args, ctx) => {
  const [keys = '', ...rest] = args
  const letters = keys.replace(/^-/, '')
  if (letters === '' || /[^cvftx]/.test(letters)) return { lines: [stderr('tar: usage  tar -{txru}[cvfblmhopwBi] [tapefile] [blocksize] file1 file2...')], status: 1 }
  if (letters.includes('t') || letters.includes('x')) return { lines: [stderr('tar: tape is blank')], status: 1 }
  if (!letters.includes('c')) return { lines: [stderr('tar: one of c, t or x must be given')], status: 1 }

  let operands = rest
  if (letters.includes('f')) {
    const device = operands[0]
    if (device === undefined) return { lines: [stderr('tar: missing tape file after f')], status: 1 }
    if (!TAPES.has(device)) return { lines: [stderr(`tar: cannot create ${device}`)], status: 1 }
    operands = operands.slice(1)
  }
  if (operands.length === 0) return { lines: [stderr('tar: no files to archive')], status: 1 }

  const lines: OutputLine[] = []
  let written = 0
  const verbose = letters.includes('v')
  const user = ctx.session.user

  const walk = (path: string, node: VNode) => {
    if (node.kind === 'dir') {
      if (!canAccess(node, user, 'r') || !canAccess(node, user, 'x')) {
        lines.push(stderr(`tar: ${path}: Permission denied`))
        return
      }
      for (const name of Object.keys(node.children).sort()) walk(`${path.replace(/\/$/, '')}/${name}`, node.children[name])
      return
    }
    if (!canAccess(node, user, 'r')) {
      // period: 4.3BSD tar's wording for unreadable files.
      lines.push(stderr(`tar: ${path}: cannot open file`))
      return
    }
    written++
    const blocks = Math.max(1, Math.ceil(new TextEncoder().encode(node.content).length / 512))
    if (verbose) lines.push(stdout(`a ${path} ${blocks} block${blocks === 1 ? '' : 's'}`))
  }

  for (const operand of operands) {
    const found = ctx.vfs.resolve(operand, pathCtx(ctx))
    if (!found.ok) {
      lines.push(stderr(`tar: ${operand}: No such file or directory`))
      continue
    }
    walk(found.value.abs, found.value.node)
  }
  return { lines, status: written > 0 ? 0 : 1 }
}
