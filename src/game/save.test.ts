import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { SPELLS } from '../story/spells.js'
import type { SaveData } from './save.js'
import { parseSave, serializeSave } from './save.js'
import { DEFAULT_SETTINGS, parseSettings } from './settings.js'

describe('save data', () => {
  it('round-trips valid saves (property test)', () => {
    const save: fc.Arbitrary<SaveData> = fc.record({
      version: fc.constant(1 as const),
      level: fc.integer({ min: 0, max: 100 }),
      spells: fc.uniqueArray(fc.constantFrom(...SPELLS.map((s) => s.command))),
      // fc.dictionary builds null-prototype objects; JSON gives plain ones.
      flags: fc.dictionary(fc.stringMatching(/^[a-z]{1,10}$/), fc.boolean()).map((d) => ({ ...d })),
    })
    fc.assert(
      fc.property(save, (s) => {
        expect(parseSave(serializeSave(s))).toEqual(s)
      }),
    )
  })

  it('never crashes on random or hostile input (property test)', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), fc.jsonValue().map((v) => JSON.stringify(v))), (raw) => {
        const result = parseSave(raw)
        if (result !== null) expect(result.version).toBe(1)
      }),
    )
  })

  it('rejects wrong shapes', () => {
    expect(parseSave(null)).toBeNull()
    expect(parseSave('{"version":2,"level":0,"spells":[],"flags":{}}')).toBeNull()
    expect(parseSave('{"version":1,"level":-1,"spells":[],"flags":{}}')).toBeNull()
    expect(parseSave('{"version":1,"level":0,"spells":["rm"],"flags":{}}')).toBeNull()
    expect(parseSave('{"version":1,"level":0,"spells":[],"flags":{"a":"yes"}}')).toBeNull()
    expect(parseSave('{"version":1,"level":0,"spells":[],"flags":[]}')).toBeNull()
  })
})

describe('settings', () => {
  it('accepts 30 and 60 seconds and falls back otherwise', () => {
    expect(parseSettings('{"version":1,"popupSeconds":30}').popupSeconds).toBe(30)
    expect(parseSettings('{"popupSeconds":60}').popupSeconds).toBe(60)
    expect(parseSettings('{"popupSeconds":5}')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
  })
})
