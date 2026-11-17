import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { devWorld, run } from '../../test/helpers.js'
import { quote } from '../shell/tokenize.js'

describe('grep (property tests)', () => {
  const { vfs, session } = devWorld()

  it('grep -n p and grep -vn p partition the input lines', () => {
    const lines = fc.array(fc.stringMatching(/^[a-c ]{0,8}$/), { minLength: 1, maxLength: 15 })
    const pattern = fc.stringMatching(/^[a-c^$.]{1,3}$/)
    fc.assert(
      fc.property(lines, pattern, (input, p) => {
        const file = { kind: 'file', name: '', owner: 'guest', group: 'guest', mode: 0o644, mtime: '1987-10-31 23:59', content: input.join('\n') + '\n' } as const
        const written = vfs.write('/tmp/input', file)
        if (!written.ok) throw new Error('write failed')
        const numbers = (line: string) =>
          run(line, written.value, session).out.map((l) => Number(l.slice(0, l.indexOf(':'))))
        const matched = numbers(`grep -n ${quote(p)} /tmp/input`)
        const unmatched = numbers(`grep -vn ${quote(p)} /tmp/input`)
        expect(matched.filter((n) => unmatched.includes(n))).toEqual([])
        expect([...matched, ...unmatched].sort((a, b) => a - b)).toEqual(input.map((_, i) => i + 1))
      }),
    )
  })
})
