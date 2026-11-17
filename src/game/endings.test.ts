import { describe, expect, it } from 'vitest'
import { findProc } from '../engine/procs/types.js'
import { choiceOf, cleanLegacy } from '../story/levels/choice.js'
import { SEED_PID } from '../story/levels/end.js'
import { play, screenText } from '../test/helpers.js'
import { newGame } from './game.js'
import { parseSave, serializeSave } from './save.js'
import type { GameState } from './types.js'

const atChoice = (asRoot = true): GameState => {
  const g = { ...newGame({ save: { version: 1, level: 7, spells: ['ls'], flags: {} } }), cards: [] }
  return asRoot ? play(g, []) : g
}

describe('the choice', () => {
  it('Nell asks, and only keywords decide (never the AI)', () => {
    expect(screenText(atChoice())).toContain('`come with me`, or `stay`')
    expect(choiceOf('come with me!')).toBe('move')
    expect(choiceOf('take me with you')).toBe('move')
    expect(choiceOf('please stay home')).toBe('stay')
    expect(choiceOf('hmm i dunno')).toBeNull()
    expect(choiceOf('come or stay?')).toBeNull()
  })

  it('an unclear answer is small talk (AI may word it) and asks again', () => {
    const g = play(atChoice(), ['write nell', 'i dunno'])
    expect(g.ending).toBeNull()
    expect(g.pendingVoices.at(-1)?.fallback.join(' ')).toMatch(/come with me|stay/)
  })
})

describe('ending: stay', () => {
  it('ends with amber, the summary flag and a saved ending', () => {
    const g = play(atChoice(), ['write nell', 'stay'])
    expect(g.ending).toBe('stay')
    expect(g.save.ending).toBe('stay')
    expect(g.finished).toBe(true)
    expect(screenText(g)).toContain("i'll stay and keep vax3 company")
  })

  it('a later visit greets you instead of the SOS', () => {
    const save = play(atChoice(), ['write nell', 'stay']).save
    const later = newGame({ save })
    expect(screenText(later)).toContain("you're back!!")
    expect(screenText(later)).not.toContain('is someone there??')
  })
})

describe('ending: move', () => {
  it('come with me asks for tar; tar of ~nell packs her', () => {
    let g = play(atChoice(), ['write nell', 'come with me', 'EOF'])
    expect(g.ending).toBeNull()
    expect(screenText(g)).toContain('`tar cvf /dev/rmt0 ~nell`')
    g = play(g, ['tar cvf /dev/rmt0 ~nell'])
    expect(screenText(g)).toContain('a /usr/users/nell/notes 1 block')
    expect(g.ending).toBe('move')
  })

  it('she can still change her mind to stay before the tape runs', () => {
    expect(play(atChoice(), ['write nell', 'come with me', 'actually, stay']).ending).toBe('stay')
  })

  it('tar to a non-tape file is refused', () => {
    const g = play(atChoice(), ['write nell', 'come with me', 'EOF', 'tar cvf nell.tar ~nell'])
    expect(screenText(g)).toContain('tar: cannot create nell.tar')
    expect(g.ending).toBeNull()
  })
})

describe('hidden ending: a piece of you', () => {
  it('diary (as root) + riddle unlocks the question; the line is saved and greets the next visitor', () => {
    let g = play(atChoice(), ['su', 'tape3', 'cat ~nell/.diary'])
    expect(screenText(g)).toContain("that's my DIARY")
    g = play(g, ['write nell', 'is it a keyboard?'])
    expect(g.story.beat).toBe('legacy')
    g = play(g, ['hello stranger, nell is a friend', 'stay'])
    expect(g.legacy).toBe('hello stranger, nell is a friend')
    expect(g.ending).toBe('stay')

    const next = newGame({ legacy: g.legacy })
    expect(screenText(next)).toContain('Message from guest@vax3 on ttyh3')
    expect(screenText(next)).toContain('hello stranger, nell is a friend')
  })

  it('the visitor line is cleaned and bounded', () => {
    expect(cleanLegacy('  hi\n\u001b[31mthere  ')).toBe('hi [31mthere')
    expect(cleanLegacy('x'.repeat(500))).toHaveLength(100)
  })
})

describe('post-credits tease', () => {
  it('pumpkin_seed shows on one ps, then is gone', () => {
    let g = play(atChoice(), ['write nell', 'stay', 'EOF'])
    expect(findProc(g.procs, SEED_PID)).toBeDefined()
    g = play(g, ['ps aux'])
    expect(screenText(g)).toContain('pumpkin_seed')
    expect(findProc(g.procs, SEED_PID)).toBeUndefined()
    const again = play(g, ['clear', 'ps aux'])
    expect(screenText(again)).not.toContain('pumpkin_seed')
  })
})

describe('save data with endings', () => {
  it('round-trips ending and legacy, rejects bad values', () => {
    const save = { version: 1 as const, level: 8, spells: ['ls'], flags: {}, ending: 'move' as const, legacy: 'hi' }
    expect(parseSave(serializeSave(save))).toEqual(save)
    expect(parseSave(JSON.stringify({ ...save, ending: 'explode' }))).toBeNull()
    expect(parseSave(JSON.stringify({ ...save, legacy: 'a\nb' }))).toBeNull()
  })
})
