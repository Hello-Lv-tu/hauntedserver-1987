import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { asRoot, devWorld, run } from '../../test/helpers'
import { COMMAND_NAMES } from '../commands/registry'
import { normalizePath } from '../vfs/path'
import { PANIC_LINE, execute } from './execute'

const { vfs, session } = devWorld()

// Command lines made of real command names, flags, paths and shell noise.
const piece = fc.oneof(
  fc.constantFrom(...COMMAND_NAMES),
  fc.constantFrom('-l', '-a', '-n', '-v', '-c', '-i', '-5', '-n3', '-z', '--', '-'),
  fc.constantFrom('/', '.', '..', '~', '~nell', '~nobody', '/etc/motd', '~nell/.diary', '/tmp', 'README', 'x*', '[a-', '\\('),
  fc.constantFrom('|', "'", '"', '\\', ' ', '>', ';', '&', '`'),
  fc.string({ unit: 'binary-ascii', maxLength: 6 }),
)
const commandLine = fc.array(piece, { maxLength: 8 }).map((parts) => parts.join(' '))

describe('execute (property tests)', () => {
  it('never throws and never hits the panic fallback', () => {
    fc.assert(
      fc.property(commandLine, (line) => {
        const result = execute(line, vfs, session)
        expect(result.lines.map((l) => l.text)).not.toContain(PANIC_LINE)
      }),
      { numRuns: 500 },
    )
  })

  it('after a successful cd, pwd prints the normalized path', () => {
    const dir = fc.constantFrom('/', '/tmp', '/usr', '/usr/adm', '/usr/users/nell', '/etc')
    const relative = fc.array(fc.constantFrom('..', '.', 'users', 'nell', 'adm', 'usr', ''), { maxLength: 4 })
    fc.assert(
      fc.property(dir, relative, (start, parts) => {
        const target = parts.join('/') || '.'
        const at = { ...session, cwd: start }
        const cd = run(`cd ${target}`, vfs, at)
        if (cd.err.length > 0) return
        expect(run('pwd', vfs, cd.session).out).toEqual([normalizePath(target, start)])
      }),
    )
  })

  it('never leaks the content of a file the user cannot read', () => {
    const secret = vfs.readFile('/usr/users/nell/.diary', asRoot(session))
    if (!secret.ok) throw new Error('dev seed must contain the diary')
    const secretLines = secret.value.split('\n').filter((l) => l.length > 10)
    const leakAttempt = fc
      .tuple(
        fc.constantFrom('cat', 'more', 'head', 'tail', 'grep -v zzz', 'grep -i dear', 'wc', 'ls -la'),
        fc.constantFrom('~nell/.diary', '/usr/users/nell/.diary', '../nell/.diary', '~nell/./.diary'),
        fc.constantFrom('', ' | cat', ' | head -1', ' | grep a'),
      )
      .map(([cmd, path, pipe]) => `${cmd} ${path}${pipe}`)
    fc.assert(
      fc.property(leakAttempt, (line) => {
        const text = run(line, vfs, session).lines.map((l) => l.text).join('\n')
        for (const secretLine of secretLines) expect(text).not.toContain(secretLine)
      }),
    )
  })
})
