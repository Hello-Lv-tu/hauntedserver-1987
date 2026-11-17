import { describe, expect, it } from 'vitest'
import { JACK, NELL, POPUP_MESSAGES, SCAREWARE_LESSON } from './lines.js'

// ™ © ® are technically pictographic in Unicode, but every text font has them.
const EMOJI = /(?![\u2122\u00a9\u00ae])\p{Extended_Pictographic}/u

/** Persona rules from .kiro/steering/ghost-persona.md, enforced. */
describe('pre-written lines', () => {
  it("Nell's messages: at most 3 lines, under 200 characters, no emoji", () => {
    for (const [beat, variants] of Object.entries(NELL)) {
      for (const message of variants) {
        expect(message.length, beat).toBeLessThanOrEqual(3)
        expect(message.join(' ').length, beat).toBeLessThan(200)
        for (const line of message) expect(EMOJI.test(line), `${beat}: ${line}`).toBe(false)
      }
    }
  })

  it('chatter lines (the AI fallbacks) have at least two variants', () => {
    for (const [beat, variants] of Object.entries(NELL)) {
      if (/chatter$/i.test(beat)) expect(variants.length, beat).toBeGreaterThanOrEqual(2)
    }
  })

  it('no emoji anywhere: some systems have no emoji font (icons are SVG)', () => {
    const all = [
      ...Object.values(JACK).flat(2),
      ...POPUP_MESSAGES.flatMap((m) => [m.title, m.body]),
      SCAREWARE_LESSON.title,
      SCAREWARE_LESSON.body,
      ...SCAREWARE_LESSON.tips,
    ]
    for (const text of all) expect(EMOJI.test(text), text).toBe(false)
  })
})
