import { describe, expect, it } from 'vitest'
import { loadSeed } from '../engine/vfs/seed'
import devSeed from './seed/dev.json'
import { PLAYER, createWorld } from './world'

/** Catches broken seed files before they reach players (run by the seed hook). */
describe('story seeds', () => {
  it('dev seed is valid', () => {
    const result = loadSeed(devSeed)
    expect(result.ok ? [] : result.error).toEqual([])
  })

  it('player account exists and has a home directory', () => {
    const { vfs, session } = createWorld()
    expect(vfs.homeOf(PLAYER)).toBeDefined()
    expect(vfs.resolve(session.home, session).ok).toBe(true)
  })

  it('in-world text has no lines wider than 80 columns or modern emoji', () => {
    const texts: string[] = []
    const walk = (node: unknown) => {
      if (typeof node !== 'object' || node === null) return
      const n = node as { content?: unknown; children?: unknown[] }
      if (typeof n.content === 'string') texts.push(n.content)
      n.children?.forEach(walk)
    }
    walk(devSeed)
    for (const text of texts) {
      for (const line of text.split('\n')) {
        expect(line.length, line).toBeLessThanOrEqual(80)
        expect(/\p{Extended_Pictographic}/u.test(line), line).toBe(false)
      }
    }
  })
})
