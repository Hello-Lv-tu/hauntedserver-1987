import { parseFlags } from '../shell/flags.js'
import type { Command, CommandCtx, OutputLine } from '../shell/types.js'
import { hint, stderr, stdout } from '../shell/types.js'
import { dirname } from '../vfs/path.js'
import type { Vfs } from '../vfs/Vfs.js'
import { canAccess } from '../vfs/Vfs.js'
import type { VNode } from '../vfs/types.js'
import { fileError, pathCtx, toLines } from './common.js'

// ---------------------------------------------------------------- chmod

const PERM_BITS: Record<string, number> = { r: 4, w: 2, x: 1 }
const WHO_SHIFT: Record<string, number> = { u: 6, g: 3, o: 0 }

/**
 * Apply an octal ("644") or symbolic ("u+r", "go-w", "a=rx,u+w") mode.
 * Returns null for an invalid mode string.
 */
export function applyMode(mode: number, spec: string): number | null {
  if (/^[0-7]{1,4}$/.test(spec)) return parseInt(spec, 8) & 0o7777
  let result = mode
  for (const clause of spec.split(',')) {
    const match = /^([ugoa]*)([+\-=])([rwx]*)$/.exec(clause)
    if (match === null) return null
    const [, whoRaw, op, perms] = match
    const who = whoRaw === '' || whoRaw.includes('a') ? 'ugo' : whoRaw
    const bits = [...perms].reduce((sum, p) => sum | PERM_BITS[p], 0)
    for (const w of new Set(who)) {
      const shift = WHO_SHIFT[w]
      const mask = 0o7 << shift
      const value = bits << shift
      if (op === '+') result |= value
      else if (op === '-') result &= ~value
      else result = (result & ~mask) | value
    }
  }
  return result
}

export const chmod: Command = (args, ctx) => {
  const [spec, ...files] = args
  if (spec === undefined || files.length === 0) {
    return { lines: [stderr('Usage: chmod [-R] mode file ...'), hint('Example: `chmod 644 README` (mode first, then one or more files).')], status: 1 }
  }

  let vfs = ctx.vfs
  const lines: OutputLine[] = []
  let status = 0
  for (const file of files) {
    const found = vfs.resolve(file, pathCtx(ctx))
    if (!found.ok) {
      lines.push(fileError('chmod', found.error))
      status = 1
      continue
    }
    const { abs, node } = found.value
    if (node.owner !== ctx.session.user && ctx.session.user !== 'root') {
      // period: 4.3BSD chmod's wording.
      lines.push(stderr(`chmod: ${file}: Not owner`))
      status = 1
      continue
    }
    const mode = applyMode(node.mode, spec)
    if (mode === null) return { lines: [stderr('chmod: invalid mode')], status: 1 }
    const written = vfs.write(abs, { ...node, mode })
    if (written.ok) vfs = written.value
  }
  return { lines, status, vfs }
}

// ---------------------------------------------------------------- rm

/** Removing these would break the game; refuse in character instead. */
const PROTECTED: Record<string, string> = {
  '/': 'rm: cannot remove the root directory. (also: please don\'t.)',
  '/usr': 'rm: /usr: the whole system lives there. Nell would never forgive you.',
  '/etc': 'rm: /etc: that would lock everyone out, including you.',
  '/usr/users': 'rm: /usr/users: every home directory is in there!',
  '/usr/users/nell': 'rm: /usr/users/nell: HEY. that\'s Nell. no.',
}

function removeTree(vfs: Vfs, abs: string, node: VNode, user: string, recursive: boolean, name: string, lines: OutputLine[], quiet: boolean): Vfs {
  if (node.kind === 'dir') {
    if (!recursive) {
      if (!quiet) lines.push(stderr(`rm: ${name} directory`))
      return vfs
    }
    let next = vfs
    for (const child of Object.values(node.children)) {
      if (!canAccess(node, user, 'w') || !canAccess(node, user, 'x')) {
        if (!quiet) lines.push(stderr(`rm: ${name}/${child.name}: Permission denied`))
        continue
      }
      next = removeTree(next, `${abs === '/' ? '' : abs}/${child.name}`, child, user, true, `${name}/${child.name}`, lines, quiet)
    }
    const stillThere = next.stat(abs, { cwd: '/', home: '/', user: 'root' })
    if (stillThere.ok && stillThere.value.kind === 'dir' && Object.keys(stillThere.value.children).length > 0) return next
    return removeOne(next, abs, user, name, lines, quiet)
  }
  return removeOne(vfs, abs, user, name, lines, quiet)
}

function removeOne(vfs: Vfs, abs: string, user: string, name: string, lines: OutputLine[], quiet: boolean): Vfs {
  const parent = vfs.stat(dirname(abs), { cwd: '/', home: '/', user: 'root' })
  if (!parent.ok || !canAccess(parent.value, user, 'w')) {
    if (!quiet) lines.push(stderr(`rm: ${name}: Permission denied`))
    return vfs
  }
  const removed = vfs.remove(abs)
  return removed.ok ? removed.value : vfs
}

export const rm: Command = (args, ctx) => {
  const parsed = parseFlags(args, { boolean: 'rfi' })
  if (!parsed.ok) return { lines: [stderr('usage: rm [-rif] file ...')], status: 1 }
  const { flags, operands } = parsed.value
  if (operands.length === 0) return { lines: [stderr('usage: rm [-rif] file ...')], status: 1 }

  let vfs = ctx.vfs
  const lines: OutputLine[] = []
  const quiet = flags.has('f')
  for (const operand of operands) {
    const found = vfs.resolve(operand, pathCtx(ctx))
    if (!found.ok) {
      // period: 4.3BSD rm says "nonexistent".
      if (!quiet) lines.push(found.error.code === 'ENOENT' ? stderr(`rm: ${operand} nonexistent`) : fileError('rm', found.error))
      continue
    }
    const { abs, node } = found.value
    const refusal = Object.hasOwn(PROTECTED, abs) ? PROTECTED[abs] : undefined
    if (refusal) {
      lines.push(stderr(refusal))
      continue
    }
    vfs = removeTree(vfs, abs, node, ctx.session.user, flags.has('r'), operand, lines, quiet)
  }
  const failed = lines.some((l) => l.stream === 'stderr')
  return { lines, status: failed ? 1 : 0, vfs }
}

// ---------------------------------------------------------------- diff

type Edit = { op: '=' | '-' | '+'; line: string }

/** Line diff via longest common subsequence (files here are small). */
export function diffLines(a: string[], b: string[]): Edit[] {
  const n = a.length
  const m = b.length
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }
  const edits: Edit[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      edits.push({ op: '=', line: a[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      edits.push({ op: '-', line: a[i++] })
    } else {
      edits.push({ op: '+', line: b[j++] })
    }
  }
  while (i < n) edits.push({ op: '-', line: a[i++] })
  while (j < m) edits.push({ op: '+', line: b[j++] })
  return edits
}

const range = (start: number, count: number) => (count <= 1 ? String(start) : `${start},${start + count - 1}`)

/** Render edits in classic "normal" diff format: 3c3, 5d4, 7a8,9. */
export function normalDiff(a: string[], b: string[]): string[] {
  const edits = diffLines(a, b)
  const out: string[] = []
  let ai = 0 // lines of a consumed
  let bi = 0
  let k = 0
  while (k < edits.length) {
    if (edits[k].op === '=') {
      ai++
      bi++
      k++
      continue
    }
    const removed: string[] = []
    const added: string[] = []
    while (k < edits.length && edits[k].op !== '=') {
      if (edits[k].op === '-') removed.push(edits[k].line)
      else added.push(edits[k].line)
      k++
    }
    if (removed.length > 0 && added.length > 0) out.push(`${range(ai + 1, removed.length)}c${range(bi + 1, added.length)}`)
    else if (removed.length > 0) out.push(`${range(ai + 1, removed.length)}d${bi}`)
    else out.push(`${ai}a${range(bi + 1, added.length)}`)
    out.push(...removed.map((l) => `< ${l}`))
    if (removed.length > 0 && added.length > 0) out.push('---')
    out.push(...added.map((l) => `> ${l}`))
    ai += removed.length
    bi += added.length
  }
  return out
}

export const diff: Command = (args, ctx: CommandCtx) => {
  const files = args.filter((a) => !a.startsWith('-'))
  if (files.length !== 2) return { lines: [stderr('diff: two filename arguments required')], status: 2 }
  const contents: string[][] = []
  for (const file of files) {
    const read = ctx.vfs.readFile(file, pathCtx(ctx))
    if (!read.ok) return { lines: [fileError('diff', read.error)], status: 2 }
    contents.push(toLines(read.value))
  }
  const out = normalDiff(contents[0], contents[1])
  return { lines: out.map(stdout), status: out.length === 0 ? 0 : 1 }
}

