import { parseFlags } from '../shell/flags.js'
import type { Command, CommandCtx, OutputLine } from '../shell/types.js'
import { stderr, stdout } from '../shell/types.js'
import { DIR_SIZE } from '../vfs/Vfs.js'
import type { DirNode, VNode } from '../vfs/types.js'
import { FROZEN_NOW, MONTHS, fileError, parseMtime, pathCtx } from './common.js'

const USAGE = 'usage: ls [-agl] [file ...]'
const TERMINAL_WIDTH = 80

export const ls: Command = (args, ctx) => {
  const parsed = parseFlags(args, { boolean: 'agl' })
  if (!parsed.ok) return { lines: [stderr(USAGE)], status: 1 }
  const { flags, operands } = parsed.value
  const opts = { all: flags.has('a'), long: flags.has('l'), group: flags.has('g') }
  const targets = operands.length > 0 ? operands : ['.']

  const lines: OutputLine[] = []
  const files: { name: string; node: VNode }[] = []
  const dirs: { name: string; node: DirNode }[] = []
  let status = 0

  for (const target of targets) {
    const found = ctx.vfs.resolve(target, pathCtx(ctx))
    if (!found.ok) {
      // period: 4.3BSD ls says "foo not found", not "No such file or directory".
      if (found.error.code === 'ENOENT') lines.push(stderr(`${target} not found`))
      else lines.push(fileError('ls', found.error))
      status = 1
      continue
    }
    const { node } = found.value
    if (node.kind === 'dir') dirs.push({ name: target, node })
    else files.push({ name: target, node })
  }

  if (files.length > 0) lines.push(...render(files, opts, ctx, false))

  for (const [index, dir] of dirs.entries()) {
    const listing = ctx.vfs.listDir(dir.name, pathCtx(ctx))
    const multiple = targets.length > 1
    if (multiple && (index > 0 || files.length > 0)) lines.push(stdout(''))
    if (multiple) lines.push(stdout(`${dir.name}:`))
    if (!listing.ok) {
      // period: 4.3BSD ls reports unreadable directories this way.
      lines.push(stderr(`${dir.name} unreadable`))
      status = 1
      continue
    }
    const entries = listing.value
      .filter((n) => opts.all || !n.name.startsWith('.'))
      .map((n) => ({ name: n.name, node: n }))
    if (opts.all) {
      const parent = ctx.vfs.resolve(`${dir.name}/..`, pathCtx(ctx))
      entries.unshift({ name: '.', node: dir.node }, { name: '..', node: parent.ok ? parent.value.node : dir.node })
    }
    lines.push(...render(entries, opts, ctx, true))
  }

  return { lines, status }
}

function render(
  entries: { name: string; node: VNode }[],
  opts: { long: boolean; group: boolean },
  ctx: CommandCtx,
  showTotal: boolean,
): OutputLine[] {
  if (opts.long) {
    const out: OutputLine[] = []
    if (showTotal) {
      const blocks = entries.reduce((sum, e) => sum + Math.ceil(sizeOf(e.node) / 1024), 0)
      out.push(stdout(`total ${blocks}`))
    }
    for (const e of entries) out.push(stdout(longLine(e.name, e.node, opts.group)))
    return out
  }
  const names = entries.map((e) => e.name)
  // period: ls prints in columns on a terminal and one name per line in a pipe.
  if (!ctx.isTty) return names.map(stdout)
  return columns(names).map(stdout)
}

export function sizeOf(node: VNode): number {
  return node.kind === 'dir' ? DIR_SIZE : new TextEncoder().encode(node.content).length
}

export function modeString(node: VNode): string {
  const type = node.kind === 'dir' ? 'd' : '-'
  const bits = 'rwxrwxrwx'
  let out = type
  for (let i = 0; i < 9; i++) out += node.mode & (1 << (8 - i)) ? bits[i] : '-'
  return out
}

function linkCount(node: VNode): number {
  if (node.kind === 'file') return 1
  return 2 + Object.values(node.children).filter((c) => c.kind === 'dir').length
}

/** period: 4.3BSD shows the year instead of the time for files older than six months. */
export function lsDate(mtime: string): string {
  const t = parseMtime(mtime)
  const monthsOld = (FROZEN_NOW.year - t.year) * 12 + (FROZEN_NOW.month - t.month)
  const day = String(t.day).padStart(2)
  const tail = monthsOld >= 6 ? ` ${t.year}` : `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`
  return `${MONTHS[t.month - 1]} ${day} ${tail}`
}

/**
 * period: 4.3BSD `ls -l` omits the group unless -g is given.
 * -rw-r--r--  1 nell         1234 Oct 31 23:58 notes
 */
export function longLine(name: string, node: VNode, showGroup: boolean): string {
  const links = String(linkCount(node)).padStart(3)
  const owner = node.owner.padEnd(8)
  const group = showGroup ? node.group.padEnd(8) : ''
  const size = String(sizeOf(node)).padStart(9)
  return `${modeString(node)}${links} ${owner}${group}${size} ${lsDate(node.mtime)} ${name}`
}

/** Lay names out in columns, sorted down the columns, like BSD ls. */
export function columns(names: string[], width = TERMINAL_WIDTH): string[] {
  if (names.length === 0) return []
  const colWidth = Math.max(...names.map((n) => n.length)) + 2
  const cols = Math.max(1, Math.floor(width / colWidth))
  const rows = Math.ceil(names.length / cols)
  const out: string[] = []
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const name = names[c * rows + r]
      if (name === undefined) continue
      const isLast = names[(c + 1) * rows + r] === undefined
      line += isLast ? name : name.padEnd(colWidth)
    }
    out.push(line)
  }
  return out
}
