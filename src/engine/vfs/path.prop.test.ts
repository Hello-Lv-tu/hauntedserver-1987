import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { normalizePath } from './path.js'

// Paths built from realistic pieces, including the tricky ones.
const segment = fc.oneof(
  fc.constantFrom('', '.', '..', '...', 'usr', 'nell', '.plan', 'a b'),
  fc.stringMatching(/^[a-z.]{1,6}$/),
)
const path = fc.array(segment, { maxLength: 8 }).chain((parts) =>
  fc.boolean().map((absolute) => (absolute ? '/' : '') + parts.join('/')),
)
const cwd = fc.array(fc.stringMatching(/^[a-z]{1,5}$/), { maxLength: 4 }).map((p) => '/' + p.join('/'))

describe('normalizePath (property tests)', () => {
  it('is idempotent', () => {
    fc.assert(
      fc.property(path, cwd, (p, c) => {
        const once = normalizePath(p, c)
        expect(normalizePath(once, c)).toBe(once)
        expect(normalizePath(once, '/')).toBe(once)
      }),
    )
  })

  it('always produces a well-formed absolute path', () => {
    fc.assert(
      fc.property(path, cwd, (p, c) => {
        const result = normalizePath(p, c)
        expect(result.startsWith('/')).toBe(true)
        expect(result).not.toContain('//')
        if (result !== '/') expect(result.endsWith('/')).toBe(false)
        const segments = result.split('/').slice(1)
        expect(segments).not.toContain('.')
        expect(segments).not.toContain('..')
      }),
    )
  })

  it('".." never climbs above the root', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 20 }), (n) => {
        expect(normalizePath(Array(n).fill('..').join('/'), '/usr/users')).toBe('/')
      }),
    )
  })
})
