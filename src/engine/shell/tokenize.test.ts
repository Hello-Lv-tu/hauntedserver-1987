import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { quote, tokenize } from './tokenize'

const words = (line: string) => {
  const result = tokenize(line)
  if (!result.ok) throw new Error(JSON.stringify(result.error))
  return result.value.map((t) => (t.type === 'word' ? t.value : '|'))
}

describe('tokenize', () => {
  it('splits on whitespace and pipes', () => {
    expect(words('  ls   -la  /tmp ')).toEqual(['ls', '-la', '/tmp'])
    expect(words('cat x|grep y | head')).toEqual(['cat', 'x', '|', 'grep', 'y', '|', 'head'])
  })

  it('handles quotes and escapes', () => {
    expect(words(`grep "two words" 'it''s' a\\ b`)).toEqual(['grep', 'two words', 'its', 'a b'])
    expect(words(`echo "say \\"boo\\"" '|' ""`)).toEqual(['echo', 'say "boo"', '|', ''])
    expect(words('echo trailing\\')).toEqual(['echo', 'trailing\\'])
  })

  it('reports unmatched quotes', () => {
    expect(tokenize(`echo 'oops`)).toEqual({ ok: false, error: { kind: 'unmatched', quote: "'" } })
    expect(tokenize(`echo "oops`)).toEqual({ ok: false, error: { kind: 'unmatched', quote: '"' } })
  })

  it('rejects unsupported operators outside quotes only', () => {
    expect(tokenize('ls > out')).toEqual({ ok: false, error: { kind: 'unsupported', operator: '>' } })
    expect(tokenize('ls && pwd')).toEqual({ ok: false, error: { kind: 'unsupported', operator: '&&' } })
    expect(tokenize('echo `date`').ok).toBe(false)
    expect(words(`echo "a > b; c"`)).toEqual(['echo', 'a > b; c'])
  })
})

describe('tokenize (property tests)', () => {
  it('round-trips any list of words through single quoting', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ unit: 'binary-ascii' }), { maxLength: 6 }), (list) => {
        const line = list.map(quote).join(' ')
        expect(words(line)).toEqual(list)
      }),
    )
  })
})
