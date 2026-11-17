import type { CommandCtx, OutputLine } from '../shell/types'
import { stderr } from '../shell/types'
import type { PathCtx, VfsError } from '../vfs/types'

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** period: the machine's clock stopped at this moment. */
export const FROZEN_NOW = { year: 1987, month: 10, day: 31, hour: 23, minute: 59, second: 59 }
export const FROZEN_DATE_STRING = 'Sat Oct 31 23:59:59 EST 1987'

export function pathCtx(ctx: CommandCtx): PathCtx {
  const { cwd, home, user } = ctx.session
  return { cwd, home, user }
}

/** Errno text as printed by 4.3BSD libc's perror(). */
export function errnoText(error: VfsError): string {
  switch (error.code) {
    case 'ENOENT':
      return 'No such file or directory'
    case 'ENOTDIR':
      return 'Not a directory'
    case 'EISDIR':
      return 'Is a directory'
    case 'EACCES':
      return 'Permission denied'
    case 'EEXIST':
      return 'File exists'
    case 'EUSER':
      return 'Unknown user'
  }
}

/** "cmd: path: message", the usual format for file errors. */
export function fileError(cmd: string, error: VfsError): OutputLine {
  if (error.code === 'EUSER') return stderr(`Unknown user: ${error.path}.`)
  return stderr(`${cmd}: ${error.path}: ${errnoText(error)}`)
}

/** Split file content into lines, ignoring one trailing newline. */
export function toLines(content: string): string[] {
  if (content === '') return []
  return content.replace(/\n$/, '').split('\n')
}

export interface Input {
  /** File name, or null for stdin. */
  name: string | null
  lines: string[]
}

/**
 * Read each operand as a file, or stdin when there are no operands.
 * Errors are reported with `cmd` as prefix and the file is skipped.
 */
export function readInputs(cmd: string, operands: string[], ctx: CommandCtx): { inputs: Input[]; errors: OutputLine[] } {
  if (operands.length === 0) return { inputs: [{ name: null, lines: ctx.stdin ?? [] }], errors: [] }
  const inputs: Input[] = []
  const errors: OutputLine[] = []
  for (const name of operands) {
    const content = ctx.vfs.readFile(name, pathCtx(ctx))
    if (content.ok) inputs.push({ name, lines: toLines(content.value) })
    else errors.push(fileError(cmd, content.error))
  }
  return { inputs, errors }
}

/** "1987-10-31 23:58" -> parts. */
export function parseMtime(mtime: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const [date, time] = mtime.split(' ')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return { year, month, day, hour, minute }
}
