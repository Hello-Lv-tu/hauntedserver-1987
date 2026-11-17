import { describe, expect, it } from 'vitest'
import { play, screenText } from '../test/helpers.js'
import { newGame } from './game.js'
import { normalizeInput } from './normalize.js'
import type { GameState } from './types.js'

/** Regressions from real play-tests (see the PR descriptions for the logs). */
const at = (level: number): GameState => ({ ...newGame({ save: { version: 1, level, spells: [], flags: {} } }), cards: [] })
const hints = (g: GameState) => g.screen.filter((l) => l.kind === 'hint').map((l) => l.text)

describe('play-test 2026-11-17: stuck in mail', () => {
  it('full-width characters from Chinese input methods are folded to ASCII', () => {
    expect(normalizeInput('？')).toBe('?')
    expect(normalizeInput('ｌｓ　－ａ')).toBe('ls -a')
    expect(normalizeInput('Ｐ２')).toBe('P2')
    expect(normalizeInput('cat “two words”。')).toBe('cat "two words".')
    expect(screenText(play(at(2), ['mail', '？']))).toContain('Mail   Commands')
  })

  it('`mail P2` explains how to open Mail instead of only "sending is disabled"', () => {
    expect(hints(play(at(2), ['mail P2'])).at(-1)).toContain('type `mail` on its own')
  })

  it('entering Mail explains the & prompt', () => {
    expect(hints(play(at(2), ['mail'])).at(-1)).toContain('the & prompt')
  })

  it('unknown commands at & repeat the help; `hint` works there too', () => {
    expect(hints(play(at(2), ['mail', 'mail nell'])).at(-1)).toContain('the & prompt')
    expect(hints(play(at(2), ['mail', 'hint'])).length).toBeGreaterThanOrEqual(2)
  })

  it('`P2` without a space also works (Mail allows it)', () => {
    expect(screenText(play(at(2), ['mail', 'P2']))).toContain('Received: from mx.jack-o-daemon.cloud')
  })
})

describe('play-test 2026-11-17: l versus 1 in Level 3', () => {
  it('`ls -1` (digit one) explains the lowercase L', () => {
    expect(hints(play(at(3), ['ls -1'])).at(-1)).toContain('lowercase L')
  })

  it('`ls-l` (no space) suggests `ls -l`', () => {
    expect(hints(play(at(3), ['ls-l'])).at(-1)).toContain('`ls -l`')
  })

  it('`chmod` alone shows an example', () => {
    expect(hints(play(at(3), ['chmod'])).at(-1)).toContain('chmod 644 README')
  })
})

describe('play-test 2026-11-17: chmod in Level 3', () => {
  it('a wrong file name explains ls -a and spaces', () => {
    expect(hints(play(at(3), ['chmod 644 README.logon'])).join(' ')).toContain('`ls -a`')
  })

  it('after a chmod that leaves files locked, the hint names exactly what is left', () => {
    expect(hints(play(at(3), ['chmod 134 README'])).at(-1)).toBe('Still locked: README and .login. Type `chmod 644 README`, then `chmod 644 .login`. (644 means you can read it again.)')
    expect(hints(play(at(3), ['chmod 644 README'])).at(-1)).toContain('Still locked: .login.')
  })

  it('recovers from the exact sequence the player typed', () => {
    const g = play(at(3), ['chmod 644 README.logon', 'chmod 134 README.longin', 'chmod', 'chmod 134 README', '.login', 'chmod 644 README', 'chmod 644 .login'])
    expect(g.story.level).toBe(4)
  })
})
