import type { DirNode, Result, VNode } from './types'
import { fail, ok } from './types'

/**
 * Authoring format for the server's contents (see src/story/seed/).
 *
 * Children are an array (not an object) so duplicate names can be detected.
 * owner, group, mode and mtime are optional and inherit sensible defaults:
 * owner/group from the parent, mode 644 for files and 755 for dirs, mtime
 * from the parent.
 */
export interface SeedNode {
  name: string
  kind: 'file' | 'dir'
  owner?: string
  group?: string
  /** Octal string, e.g. "644" or "0700". */
  mode?: string
  /** "YYYY-MM-DD HH:MM" */
  mtime?: string
  content?: string
  children?: SeedNode[]
}

export interface SeedError {
  path: string
  message: string
}

const MTIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
const MODE_RE = /^0?[0-7]{3}$/
const NAME_RE = /^[^/\0]+$/

interface Defaults {
  owner: string
  group: string
  mtime: string
}

/**
 * Build the root directory from untrusted seed JSON. Returns every problem
 * found (not just the first) so authors can fix a seed in one pass.
 */
export function loadSeed(json: unknown): Result<DirNode, SeedError[]> {
  const errors: SeedError[] = []
  const rootDefaults: Defaults = { owner: 'root', group: 'wheel', mtime: '1987-10-31 23:59' }
  if (!isObject(json) || json.kind !== 'dir') {
    return fail([{ path: '/', message: 'seed root must be a directory node' }])
  }
  const root = build({ ...json, name: '/' }, '', rootDefaults, errors)
  if (errors.length > 0 || root === null || root.kind !== 'dir') return fail(errors)
  return ok(root)
}

function build(raw: unknown, parentPath: string, defaults: Defaults, errors: SeedError[]): VNode | null {
  if (!isObject(raw)) {
    errors.push({ path: parentPath || '/', message: 'node must be an object' })
    return null
  }
  const isRoot = parentPath === '' && raw.name === '/'
  const name = typeof raw.name === 'string' ? raw.name : ''
  const path = isRoot ? '/' : `${parentPath === '/' ? '' : parentPath}/${name}`

  if (!isRoot && !NAME_RE.test(name)) {
    errors.push({ path, message: `invalid name ${JSON.stringify(raw.name)}` })
    return null
  }
  if (raw.kind !== 'file' && raw.kind !== 'dir') {
    errors.push({ path, message: 'kind must be "file" or "dir"' })
    return null
  }

  const owner = optionalString(raw.owner, defaults.owner, path, 'owner', errors)
  const group = optionalString(raw.group, defaults.group, path, 'group', errors)
  const mtime = optionalString(raw.mtime, defaults.mtime, path, 'mtime', errors)
  if (!MTIME_RE.test(mtime)) errors.push({ path, message: `mtime must look like "1987-10-31 23:58", got "${mtime}"` })

  let mode = raw.kind === 'dir' ? 0o755 : 0o644
  if (raw.mode !== undefined) {
    if (typeof raw.mode === 'string' && MODE_RE.test(raw.mode)) mode = parseInt(raw.mode, 8)
    else errors.push({ path, message: `invalid mode ${JSON.stringify(raw.mode)}` })
  }

  if (raw.kind === 'file') {
    if (raw.children !== undefined) errors.push({ path, message: 'a file cannot have children' })
    const content = raw.content ?? ''
    if (typeof content !== 'string') {
      errors.push({ path, message: 'content must be a string' })
      return null
    }
    return { kind: 'file', name, owner, group, mode, mtime, content }
  }

  if (raw.content !== undefined) errors.push({ path, message: 'a directory cannot have content' })
  const rawChildren = raw.children ?? []
  if (!Array.isArray(rawChildren)) {
    errors.push({ path, message: 'children must be an array' })
    return null
  }
  const children: Record<string, VNode> = {}
  for (const child of rawChildren) {
    const node = build(child, path, { owner, group, mtime }, errors)
    if (node === null) continue
    if (Object.hasOwn(children, node.name)) {
      errors.push({ path: `${path === '/' ? '' : path}/${node.name}`, message: 'duplicate name in directory' })
      continue
    }
    children[node.name] = node
  }
  return { kind: 'dir', name: isRoot ? '' : name, owner, group, mode, mtime, children }
}

function optionalString(value: unknown, fallback: string, path: string, field: string, errors: SeedError[]): string {
  if (value === undefined) return fallback
  if (typeof value === 'string' && value !== '') return value
  errors.push({ path, message: `${field} must be a non-empty string` })
  return fallback
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
