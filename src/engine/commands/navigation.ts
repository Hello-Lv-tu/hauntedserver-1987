import type { Command } from '../shell/types'
import { stderr, stdout } from '../shell/types'
import { canAccess } from '../vfs/Vfs'
import { errnoText, pathCtx } from './common'

/** csh builtin. With no argument, go home. */
export const cd: Command = (args, ctx) => {
  if (args.length > 1) return { lines: [stderr('cd: Too many arguments.')], status: 1 }
  const target = args[0] ?? ctx.session.home
  const found = ctx.vfs.resolve(target, pathCtx(ctx))
  // period: csh prints "name: message." with a trailing period.
  if (!found.ok) {
    if (found.error.code === 'EUSER') return { lines: [stderr(`Unknown user: ${found.error.path}.`)], status: 1 }
    return { lines: [stderr(`${target}: ${errnoText(found.error)}.`)], status: 1 }
  }
  const { abs, node } = found.value
  if (node.kind !== 'dir') return { lines: [stderr(`${target}: Not a directory.`)], status: 1 }
  if (!canAccess(node, ctx.session.user, 'x')) return { lines: [stderr(`${target}: Permission denied.`)], status: 1 }
  return { lines: [], status: 0, session: { ...ctx.session, cwd: abs } }
}

export const pwd: Command = (_args, ctx) => ({ lines: [stdout(ctx.session.cwd)], status: 0 })
