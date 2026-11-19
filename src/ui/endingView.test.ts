import { describe, expect, it } from 'vitest'
import { newGame } from '../game/game.js'
import type { GameState } from '../game/types.js'
import { translate } from '../i18n/index.js'
import { NELL } from '../story/lines.js'
import { play } from '../test/helpers.js'
import { endingMessages } from './endingView.js'

const atChoice = (lang: 'en' | 'zh' = 'en'): GameState =>
  play({ ...newGame({ save: { version: 1, level: 7, spells: ['ls'], flags: {} }, settings: { version: 1, popupSeconds: 60, lang, typewriter: false, sound: false } }), cards: [] }, [])

/** Nell's lines in the terminal after the given point, as the player saw them. */
const nellSaid = (before: GameState, after: GameState) =>
  after.screen.slice(before.screen.length).filter((l) => l.kind === 'nell').map((l) => l.text)

describe('the ending sheet repeats the farewell the terminal printed', () => {
  it('each farewell has one variant, so the sheet cannot show different words', () => {
    expect(NELL.packed).toHaveLength(1)
    expect(NELL.stayed).toHaveLength(1)
  })

  for (const lang of ['en', 'zh'] as const) {
    it(`Move (${lang}): the tape farewell comes first, then her 2026 messages`, () => {
      const packing = play(atChoice(lang), ['write nell', 'come with me', 'EOF'])
      const moved = play(packing, ['tar cvf /dev/rmt0 ~nell'])
      expect(moved.ending).toBe('move')
      const farewell = endingMessages('move').slice(0, NELL.packed[0].length)
      expect(farewell).toEqual(NELL.packed[0])
      for (const line of farewell) expect(nellSaid(packing, moved)).toContain(translate(line, lang))
      expect(endingMessages('move')).toContain('why are all the buttons ROUND??')
    })

    it(`Stay (${lang}): the sheet shows exactly her terminal farewell`, () => {
      const start = atChoice(lang)
      const stayed = play(start, ['write nell', 'stay'])
      expect(stayed.ending).toBe('stay')
      expect(endingMessages('stay')).toEqual(NELL.stayed[0])
      for (const line of endingMessages('stay')) expect(nellSaid(start, stayed)).toContain(translate(line, lang))
    })
  }
})
