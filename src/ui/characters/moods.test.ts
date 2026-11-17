import { describe, expect, it } from 'vitest'
import { parseSettings } from '../../game/settings.js'
import { NELL } from '../../story/lines.js'
import { jackMoodOf, nellMoodOf } from './moods.js'

describe('character moods', () => {
  it("Nell's face follows her smileys and tone", () => {
    expect(nellMoodOf(NELL.sos[0].join(' '))).toBe('scared')
    expect(nellMoodOf('i read it :-(')).toBe('sad')
    expect(nellMoodOf('wait :-O')).toBe('surprised')
    expect(nellMoodOf('lazy pumpkin :-P')).toBe('cheeky')
    expect(nellMoodOf('BONK!! it is GONE!! :-D')).toBe('happy')
    expect(nellMoodOf('the PID is the number in the second column')).toBe('neutral')
  })

  it("Jack is smug when he gloats and angry when he loses", () => {
    expect(jackMoodOf('Nooo... my subscription... cancelled...')).toBe('angry')
    expect(jackMoodOf('Miss me? Auto-restart is a Premium feature™!')).toBe('smug')
    expect(jackMoodOf("Hi! I'm Jack's Smart Assistant™.")).toBe('smile')
  })
})

describe('typewriter setting', () => {
  it('defaults on, can be turned off, and respects the reduced-motion default', () => {
    expect(parseSettings(null).typewriter).toBe(true)
    expect(parseSettings(null, 'en', false).typewriter).toBe(false)
    expect(parseSettings('{"typewriter":false}').typewriter).toBe(false)
    expect(parseSettings('{"typewriter":"yes"}').typewriter).toBe(true)
  })
})
