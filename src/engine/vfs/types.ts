/** Unix permission bits, e.g. 0o644. */
export type Mode = number

interface NodeBase {
  name: string
  owner: string
  group: string
  mode: Mode
  /** "YYYY-MM-DD HH:MM", machine-local time. Always 1987 or earlier. */
  mtime: string
}

export interface FileNode extends NodeBase {
  kind: 'file'
  content: string
}

export interface DirNode extends NodeBase {
  kind: 'dir'
  children: Readonly<Record<string, VNode>>
}

export type VNode = FileNode | DirNode

export type VfsErrorCode = 'ENOENT' | 'ENOTDIR' | 'EISDIR' | 'EACCES' | 'EEXIST' | 'EUSER'

export interface VfsError {
  code: VfsErrorCode
  /** The path as the player typed it (or the offending component). */
  path: string
}

export type Result<T, E = VfsError> = { ok: true; value: T } | { ok: false; error: E }

export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value })
export const fail = <E>(error: E): { ok: false; error: E } => ({ ok: false, error })

/** Who is asking, and from where. */
export interface PathCtx {
  cwd: string
  home: string
  user: string
}
