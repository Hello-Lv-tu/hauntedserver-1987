# Design: Virtual filesystem and shell

## Overview

The engine is pure TypeScript under `src/engine/` with no React or DOM
dependencies, so it can be unit- and property-tested in Node. The UI calls a
single entry point, `execute(line, state)`, and renders the returned lines.

```
UI (src/ui/Terminal.tsx)
  │  line
  ▼
shell/execute.ts ── tokenize ── parse pipeline ── run stages ──► ExecResult
                                                     │
                                       commands/registry.ts
                                                     │
                                                 vfs/Vfs.ts
```

## Data model

```ts
// src/engine/vfs/types.ts
export type Mode = number // e.g. 0o644

interface NodeBase {
  name: string
  owner: string
  group: string
  mode: Mode
  mtime: string // ISO 8601, always 1987 or earlier
}
export interface FileNode extends NodeBase { kind: 'file'; content: string }
export interface DirNode extends NodeBase {
  kind: 'dir'
  children: Record<string, VNode>
}
export type VNode = FileNode | DirNode

export type VfsError =
  | { code: 'ENOENT'; path: string }
  | { code: 'ENOTDIR'; path: string }
  | { code: 'EISDIR'; path: string }
  | { code: 'EACCES'; path: string }
  | { code: 'EEXIST'; path: string }

export type Result<T, E = VfsError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

The seed format is the same shape as `DirNode`, stored as JSON in
`src/story/seed/`. `loadSeed(json)` validates it (Requirement 1.2) and returns
`Result<Vfs, SeedError[]>`.

### Users

`/etc/passwd` in the seed is the source of truth for users and home
directories. `Vfs` parses it once to support `~user` (Requirement 2.1).

## VFS API

```ts
// src/engine/vfs/Vfs.ts
class Vfs {
  constructor(root: DirNode)
  normalize(path: string, cwd: string, home: string): string   // pure string op
  resolve(path: string, ctx: PathCtx): Result<{ abs: string; node: VNode }>
  readFile(path: string, ctx: PathCtx): Result<string>
  listDir(path: string, ctx: PathCtx): Result<VNode[]>          // sorted by name
  stat(path: string, ctx: PathCtx): Result<VNode>
  // Story-engine only (Requirement 1.4). Returns a new Vfs; never mutates.
  write(abs: string, node: VNode): Result<Vfs>
  remove(abs: string): Result<Vfs>
  homeOf(user: string): string | undefined
}
interface PathCtx { cwd: string; home: string; user: string }
```

Decision: the VFS is **immutable** (write returns a new instance with
structural sharing). It makes React state updates trivial, makes story
"undo/replay" possible later, and makes properties easy to state.

Permissions (Requirement 3): `canRead(node, user)` checks the owner bits when
`node.owner === user`, otherwise the "other" bits; group bits are ignored in
this version (one group per user). `root` bypasses all checks. Directory
traversal requires `x`, listing requires `r`.

## Shell

### Tokenizer — `shell/tokenize.ts`

A single-pass state machine with states `plain | single | double | escape`.
Output: `Result<Token[], ShellError>` where a token is
`{ type: 'word', value } | { type: 'pipe' } | { type: 'unsupported', value }`.
Unsupported operators (Requirement 4.5) are detected only outside quotes.

### Pipeline — `shell/execute.ts`

```ts
export interface Session {
  user: string; home: string; cwd: string
  history: string[]; seq: number
}
export interface OutputLine { stream: 'stdout' | 'stderr' | 'hint'; text: string }
export interface CommandEvent {
  seq: number; name: string; args: string[]; status: number; cwd: string
}
export interface ExecResult {
  lines: OutputLine[]
  session: Session          // new session (cwd/history may change)
  events: CommandEvent[]
  clear?: boolean           // set by `clear`
}
export function execute(line: string, vfs: Vfs, session: Session): ExecResult
```

`execute` is wrapped in a top-level `try/catch` that converts any unexpected
exception into `stderr: "panic: internal error"` so Requirement 4.7 holds even
if a command has a bug. Property tests check that this fallback is never hit.

Stages run left to right. Each stage gets the previous stage's stdout as a
string array. Like real Unix, stderr from every stage goes straight to the
terminal. Exit status of the pipeline is the last stage's.

`cd` changes the session, so it only takes effect when it is the sole stage
(same as csh, where `cd | cat` runs `cd` in a subshell).

### Commands — `commands/*.ts`

```ts
export interface CommandCtx {
  vfs: Vfs; session: Session; stdin: string[] | null
}
export interface CommandOutput {
  stdout: string[]; stderr: string[]; hints?: string[]
  status: number; session?: Session; clear?: boolean
}
export type Command = (args: string[], ctx: CommandCtx) => CommandOutput
export const registry: Record<string, Command>
```

Flag parsing uses one small helper, `parseFlags(args, allowed, usage)`, that
supports combined short flags (`-la`) and `-n 5` / `-5` for head/tail.

### Output formats

All formats follow `.kiro/steering/period-accuracy.md`. `ls -l` example:

```
-rw-r--r--  1 nell         1234 Oct 31 23:58 notes
drwxr-xr-x  2 nell          512 Oct 12 09:01 bin
```

Columns: mode (10), link count (always 1 for files, 2 for dirs), owner
padded to 8, size right-aligned in 8, date `Mmm dd HH:MM`, name.
Directory size is fixed at 512. `-g` inserts the group after the owner.

### Modern commands — `commands/modern.ts`

A table `{ sudo: 'in 1987, try su', less: 'try more', vim: 'try vi', ... }`.
The "Command not found." line goes to stderr and the hint goes to the `hint`
stream (Requirement 6).

### man pages — `man/pages.ts`

`Record<string, string>` of preformatted text. A test asserts every
registry key has a page (Requirement 7.1).

## UI — `src/ui/`

- `Terminal.tsx`: holds `vfs`, `session`, `scrollback` in a reducer. Renders
  lines in a `<div role="log" aria-live="polite">` and a labelled `<input>`.
- History navigation and Tab completion live in a pure helper
  (`ui/completion.ts`) that takes the VFS, session and partial line, so it is
  testable without React.
- CRT styling stays in CSS. Line streams map to classes `.out`, `.err`,
  `.hint`.
- `App.tsx` loads the seed, creates the initial session (`user: 'intern'`,
  `cwd: home`) and renders `Terminal`.

## Testing strategy

- **Unit tests (Vitest)** for each command's output format and error text.
- **Property-based tests (fast-check)**:
  1. `normalize` is idempotent: `normalize(normalize(p)) === normalize(p)`.
  2. `normalize` output always starts with `/`, has no `//`, no trailing `/`
     (except root), and no `.`/`..` segments.
  3. Tokenizer round-trip: for any list of words, joining them with each word
     single-quoted (escaping `'` as `'\''`) tokenizes back to the same list.
  4. `grep p` and `grep -v p` on the same input partition it: the two outputs
     have no common line indices and together cover every line.
  5. `execute` never throws and never hits the panic fallback for arbitrary
     strings over a printable-ASCII alphabet including quotes and `|`.
  6. After `cd X` succeeds, `pwd` prints `normalize(X)`.
  7. Permission safety: for any file the session user cannot read,
     no command output contains that file's content.
  8. `vfs.write` never changes the original instance.
- Seed validation test for the real story seed, so a bad seed fails CI
  before it reaches players.
