import { describe, expect, it } from 'vitest'
import { POPUP_PID } from '../story/levels/level1.js'
import { JACK } from '../story/lines.js'
import { play, screenText } from '../test/helpers.js'
import { newGame, popupRunning, step } from './game.js'
import type { GameState } from './types.js'

const LEVEL0 = ['write nell', 'hi nell', 'EOF', 'ls -a', 'cat .from_nell']
const LEVEL1 = ['ps aux', 'kill 6667']

const ticks = (game: GameState, n: number) => {
  let s = game
  for (let i = 0; i < n; i++) s = step(s, { type: 'tick' })
  return s
}

describe('level 0: the note with a dot', () => {
  it('starts with the boot banner and Nell\'s SOS', () => {
    const game = newGame()
    expect(screenText(game)).toContain('Message from nell@vax3 on ttyp0 at 23:59 ...')
    expect(screenText(game)).toContain('write nell')
    expect(game.story).toMatchObject({ level: 0, beat: 'sos' })
  })

  it('write nell enters write mode; lines go to Nell, not the shell', () => {
    let game = play(newGame(), ['write nell'])
    expect(game.mode).toEqual({ kind: 'write', to: 'nell' })
    game = play(game, ['hello?'])
    expect(game.story.beat).toBe('hunt')
    expect(screenText(game)).toContain("i'm nell")
    expect(game.session.history).toEqual(['write nell'])
  })

  it('Nell greets you whatever your first message is (play-test regression)', () => {
    for (const first of ['who are you?', 'ls -a', 'hint me', '']) {
      const game = play(newGame(), ['write nell', first || ' '])
      expect(game.story.beat, first).toBe('hunt')
      expect(screenText(game), first).toMatch(/i'm nell/)
    }
  })

  it('a sentence typed at the shell gets a hint about write nell', () => {
    const game = play(newGame(), ['hi'])
    const last = game.screen.filter((l) => l.kind === 'hint').at(-1)?.text
    expect(last).toContain('write nell')
    expect(play(newGame(), ['sudo ls']).screen.filter((l) => l.kind === 'hint')).toHaveLength(1)
    expect(play(newGame(), ['ls']).screen.some((l) => l.kind === 'hint')).toBe(false)
  })

  it('EOF and Ctrl-D leave write mode', () => {
    expect(play(newGame(), ['write nell', 'EOF']).mode.kind).toBe('shell')
    expect(play(newGame(), ['write nell', { type: 'eof' }]).mode.kind).toBe('shell')
  })

  it('Nell spots a command typed in write mode', () => {
    const game = play(newGame(), ['write nell', 'hi', 'ls -a'])
    expect(game.screen.filter((l) => l.kind === 'nell').at(-2)?.text).toMatch(/ctrl-d/)
    expect(game.story.beat).toBe('hunt')
  })

  it('ls -a then cat .from_nell completes the level and starts level 1', () => {
    const game = play(newGame(), LEVEL0)
    expect(game.story.level).toBe(1)
    expect(game.popup).not.toBeNull()
    expect(popupRunning(game, POPUP_PID)).toBe(true)
    expect(game.save.level).toBe(1)
  })

  it('hints escalate from direction to full answer', () => {
    const game = play(newGame(), ['hint', 'hint', 'hint', 'hint'])
    const hints = game.screen.filter((l) => l.kind === 'hint').map((l) => l.text)
    expect(hints).toHaveLength(4)
    expect(hints[2]).toContain('write nell')
    expect(hints[3]).toBe(hints[2])
  })

  it('awards spells once, with a card each', () => {
    const game = play(newGame(), [...LEVEL0, 'ls', 'cat README'])
    expect(game.spells).toEqual(['write', 'ls', 'cat'])
    expect(game.cards.filter((c) => c.kind === 'spell')).toHaveLength(3)
  })
})

describe('level 1: the popup that would not close', () => {
  const atLevel1 = () => play(newGame(), LEVEL0)

  it('ps aux shows the popup process; kill ends the level with a lesson card', () => {
    let game = play(atLevel1(), ['ps aux'])
    expect(screenText(game)).toContain('pumpkin_upd8r')
    expect(game.story.beat).toBe('found')
    game = play(game, ['kill 6667'])
    expect(game.popup).toBeNull()
    expect(game.cards.some((c) => c.kind === 'lesson')).toBe(true)
    expect(game.story.level).toBe(2)
  })

  it('closing the popup brings it back after a few seconds with a new message', () => {
    let game = step({ ...atLevel1(), cards: [] }, { type: 'popup', action: 'close' })
    expect(game.popup).toMatchObject({ message: 1, hiddenFor: 3 })
    game = ticks(game, 3)
    expect(game.popup?.hiddenFor).toBe(0)
  })

  it('FIX NOW gets you eaten: the level restarts, spells are kept', () => {
    const before = atLevel1()
    const eaten = step(before, { type: 'popup', action: 'fix' })
    expect(eaten.glitch).toBe(1)
    expect(eaten.story).toMatchObject({ level: 1, beat: 'popup' })
    expect(eaten.spells).toEqual(before.spells)
    expect(eaten.popup).toMatchObject({ message: 0, secondsLeft: 60 })
    expect(popupRunning(eaten, POPUP_PID)).toBe(true)
    const eatenLines = JACK.eaten.map((variant) => variant[0])
    expect(eaten.screen.some((l) => l.kind === 'jack' && eatenLines.includes(l.text))).toBe(true)
  })

  it('the countdown eats you when it reaches zero, using the 30 s setting', () => {
    let game = play(newGame({ settings: { version: 1, popupSeconds: 30, lang: 'en', typewriter: false } }), LEVEL0)
    game = { ...game, cards: [] }
    expect(game.popup?.secondsLeft).toBe(30)
    game = ticks(game, 29)
    expect(game.glitch).toBe(0)
    game = ticks(game, 1)
    expect(game.glitch).toBe(1)
  })

  it('the countdown pauses while a card or panel is open', () => {
    const game = atLevel1()
    expect(game.cards.length).toBeGreaterThan(0)
    expect(ticks(game, 5).popup?.secondsLeft).toBe(60)
    const clear = { ...game, cards: [] }
    expect(ticks({ ...clear, panel: 'spellbook' }, 5).popup?.secondsLeft).toBe(60)
    expect(ticks(clear, 5).popup?.secondsLeft).toBe(55)
  })

  it('killing the popup before running ps also works', () => {
    expect(play(atLevel1(), ['kill 6667']).story.level).toBe(2)
  })
})

describe("Nell's AI voice", () => {
  const chatting = () => play(newGame(), ['write nell', 'hi', 'what should i do next?'])

  it('small talk creates a pending voice request with context, printing nothing yet', () => {
    const game = chatting()
    expect(game.pendingVoices).toHaveLength(1)
    const [pending] = game.pendingVoices
    expect(pending.request).toMatchObject({ level: 0, beat: 'hunt', chats: 1, text: 'what should i do next?' })
    expect(pending.request.history.map((h) => h.from)).toEqual(['nell', 'player', 'nell']) // SOS, hi, greeting
    expect(pending.fallback.length).toBeGreaterThan(0)
    expect(screenText(game)).not.toContain(pending.fallback[0])
  })

  it('prints the AI lines when they arrive, or the fallback on failure', () => {
    const game = chatting()
    const id = game.pendingVoices[0].id
    const answered = step(game, { type: 'voice', id, lines: ['the note is called .from_nell!'] })
    expect(screenText(answered)).toContain('the note is called .from_nell!')
    expect(answered.pendingVoices).toEqual([])
    expect(answered.chatLog.at(-1)).toEqual({ from: 'nell', text: 'the note is called .from_nell!' })

    const failed = step(game, { type: 'voice', id, lines: null })
    expect(screenText(failed)).toContain(game.pendingVoices[0].fallback[0])
  })

  it('story-moving lines and the "still writing" nudge stay pre-written', () => {
    expect(play(newGame(), ['write nell', 'hi']).pendingVoices).toEqual([])
    expect(play(newGame(), ['write nell', 'hi', 'ls -a']).pendingVoices).toEqual([])
  })

  it('counts chats per beat so the AI may give the full answer after three asks', () => {
    const game = play(newGame(), ['write nell', 'hi', 'help?', 'what?', 'please?'])
    expect(game.pendingVoices.map((p) => p.request.chats)).toEqual([1, 2, 3])
  })

  it('ignores unknown voice ids', () => {
    const game = chatting()
    expect(step(game, { type: 'voice', id: 999, lines: ['x'] })).toBe(game)
  })
})

describe('continuing from a save', () => {
  it('rebuilds the world for the saved level', () => {
    const game = newGame({ save: { version: 1, level: 1, spells: ['ls'], flags: {} } })
    expect(game.story.level).toBe(1)
    expect(game.spells).toEqual(['ls'])
    expect(popupRunning(game, POPUP_PID)).toBe(true)
    expect(screenText(game)).toContain('(continuing from level 1)')
  })

  it('a full play-through of levels 0 and 1', () => {
    const game = play(newGame(), [...LEVEL0, ...LEVEL1])
    expect(game.story.level).toBe(2)
    expect(game.save.level).toBe(2)
    expect(game.spells).toEqual(['write', 'ls', 'cat', 'ps', 'kill'])
  })
})
