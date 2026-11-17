import { basename, dirname, normalizePath, splitPath } from './path.js'
import type { DirNode, PathCtx, Result, VNode } from './types.js'
import { fail, ok } from './types.js'

export interface PasswdEntry {
  user: string
  uid: number
  gid: number
  /** Full name and office info, shown by `finger`. */
  gecos: string
  home: string
  shell: string
}

type Access = 'r' | 'w' | 'x'

const OWNER_BITS: Record<Access, number> = { r: 0o400, w: 0o200, x: 0o100 }
const OTHER_BITS: Record<Access, number> = { r: 0o004, w: 0o002, x: 0o001 }

/** Directory "size" shown by ls, as on a 4.3BSD UFS filesystem. */
export const DIR_SIZE = 512

/**
 * Immutable in-memory filesystem. Write operations return a new Vfs and
 * share untouched subtrees with the old one.
 */
export class Vfs {
  readonly root: DirNode
  readonly users: ReadonlyMap<string, PasswdEntry>

  constructor(root: DirNode) {
    this.root = root
    this.users = parsePasswd(root)
  }

  homeOf(user: string): string | undefined {
    return this.users.get(user)?.home
  }

  /** Expand a leading "~" or "~user", then normalize against ctx.cwd. */
  absolute(path: string, ctx: PathCtx): Result<string> {
    let expanded = path
    if (path === '~' || path.startsWith('~/')) {
      expanded = ctx.home + path.slice(1)
    } else if (path.startsWith('~')) {
      const slash = path.indexOf('/')
      const user = slash === -1 ? path.slice(1) : path.slice(1, slash)
      const home = this.homeOf(user)
      if (home === undefined) return fail({ code: 'EUSER', path: user })
      expanded = home + (slash === -1 ? '' : path.slice(slash))
    }
    return ok(normalizePath(expanded, ctx.cwd))
  }

  /**
   * Find the node at `path`. Every directory on the way must be searchable
   * (x bit). The final node itself is not permission-checked.
   */
  resolve(path: string, ctx: PathCtx): Result<{ abs: string; node: VNode }> {
    const abs = this.absolute(path, ctx)
    if (!abs.ok) return abs
    let node: VNode = this.root
    for (const segment of splitPath(abs.value)) {
      if (node.kind !== 'dir') return fail({ code: 'ENOTDIR', path })
      if (!canAccess(node, ctx.user, 'x')) return fail({ code: 'EACCES', path })
      const child: VNode | undefined = Object.hasOwn(node.children, segment) ? node.children[segment] : undefined
      if (child === undefined) return fail({ code: 'ENOENT', path })
      node = child
    }
    return ok({ abs: abs.value, node })
  }

  stat(path: string, ctx: PathCtx): Result<VNode> {
    const found = this.resolve(path, ctx)
    return found.ok ? ok(found.value.node) : found
  }

  readFile(path: string, ctx: PathCtx): Result<string> {
    const found = this.resolve(path, ctx)
    if (!found.ok) return found
    const { node } = found.value
    if (node.kind === 'dir') return fail({ code: 'EISDIR', path })
    if (!canAccess(node, ctx.user, 'r')) return fail({ code: 'EACCES', path })
    return ok(node.content)
  }

  /** Children of a directory, sorted by name in ASCII order (like ls). */
  listDir(path: string, ctx: PathCtx): Result<VNode[]> {
    const found = this.resolve(path, ctx)
    if (!found.ok) return found
    const { node } = found.value
    if (node.kind !== 'dir') return fail({ code: 'ENOTDIR', path })
    if (!canAccess(node, ctx.user, 'r') || !canAccess(node, ctx.user, 'x')) {
      return fail({ code: 'EACCES', path })
    }
    return ok(sortedChildren(node))
  }

  /**
   * Create or replace the node at absolute path `abs`. The parent must exist
   * and be a directory. No permission checks: callers (story engine, player
   * commands) check permissions first. `node.name` is set from `abs`.
   */
  write(abs: string, node: VNode): Result<Vfs> {
    const name = basename(abs)
    if (name === '') return fail({ code: 'EEXIST', path: '/' })
    const root = updateDir(this.root, splitPath(dirname(abs)), (dir) =>
      ok({ ...dir, children: { ...dir.children, [name]: { ...node, name } } }),
    )
    return root.ok ? ok(new Vfs(root.value)) : root
  }

  /** Remove the node at absolute path `abs` (and its subtree). */
  remove(abs: string): Result<Vfs> {
    const name = basename(abs)
    if (name === '') return fail({ code: 'EACCES', path: '/' })
    const root = updateDir(this.root, splitPath(dirname(abs)), (dir) => {
      if (!Object.hasOwn(dir.children, name)) return fail({ code: 'ENOENT', path: abs })
      const children = { ...dir.children }
      delete children[name]
      return ok({ ...dir, children })
    })
    return root.ok ? ok(new Vfs(root.value)) : root
  }
}

/** Owner bits if the user owns the node, otherwise "other" bits. Root can do anything. */
export function canAccess(node: VNode, user: string, access: Access): boolean {
  if (user === 'root') return true
  const bits = node.owner === user ? OWNER_BITS : OTHER_BITS
  return (node.mode & bits[access]) !== 0
}

export function sortedChildren(dir: DirNode): VNode[] {
  return Object.keys(dir.children)
    .sort()
    .map((name) => dir.children[name])
}

/** Copy the directories along `segments`, applying `fn` to the last one. */
function updateDir(
  dir: DirNode,
  segments: string[],
  fn: (dir: DirNode) => Result<DirNode>,
  walked = '',
): Result<DirNode> {
  if (segments.length === 0) return fn(dir)
  const [head, ...rest] = segments
  const path = `${walked}/${head}`
  const child = Object.hasOwn(dir.children, head) ? dir.children[head] : undefined
  if (child === undefined) return fail({ code: 'ENOENT', path })
  if (child.kind !== 'dir') return fail({ code: 'ENOTDIR', path })
  const updated = updateDir(child, rest, fn, path)
  if (!updated.ok) return updated
  return ok({ ...dir, children: { ...dir.children, [head]: updated.value } })
}

function parsePasswd(root: DirNode): Map<string, PasswdEntry> {
  const users = new Map<string, PasswdEntry>()
  const etc = root.children['etc']
  const passwd = etc?.kind === 'dir' ? etc.children['passwd'] : undefined
  if (passwd?.kind !== 'file') return users
  for (const line of passwd.content.split('\n')) {
    const fields = line.split(':')
    if (fields.length < 7 || fields[0] === '') continue
    const [user, , uid, gid, gecos, home, shell] = fields
    users.set(user, { user, uid: Number(uid), gid: Number(gid), gecos, home, shell })
  }
  return users
}
