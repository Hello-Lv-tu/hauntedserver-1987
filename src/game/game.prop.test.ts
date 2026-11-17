import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { LEVELS } from '../story/engine.js'
import { play } from '../test/helpers.js'
import { newGame, step } from './game.js'
import type { GameInput, GameState } from './types.js'

type Item = string | GameInput

/**
 * The known solution of each level, as blocks that must stay together
 * (a write session is one block). Every new level must add an entry here.
 */
const SOLUTIONS: Record<number, Item[][]> = {
  0: [['write nell', 'hi', 'EOF'], ['ls -a'], ['cat .from_nell']],
  1: [['ps aux'], ['kill 6667']],
  2: [['finger nell'], ['mail', 'P 2', 'd 2', 'q']],
  3: [['ls -l'], ['chmod 644 README .login']],
  4: [['man rm'], [{ type: 'assistant', action: 'decline' }]],
  5: [['diff /usr/adm/messages.0 /usr/adm/messages']],
  6: [['su', 'tape3'], ['kill 6666'], ['ls'], ['cat /usr/lib/crontab'], ['rm /usr/lib/jack/jack-o-daemon'], ['kill 6666']],
}

/**
 * Things a player might do at any moment. Each block leaves the shell mode
 * and working directory as it found them, like a player who wanders off and
 * comes back.
 */
const NOISE: Item[][] = [
  ['ls'],
  ['pwd'],
  ['ps'],
  ['who'],
  ['cat /etc/motd'],
  ['grep -n tape /usr/adm/messages | head -1'],
  ['frobnicate'],
  ["echo 'oops"],
  ['ls > out'],
  ['hint'],
  ['man kill'],
  ['clear'],
  ['kill 1'],
  ['cat ~nell/.diary'],
  ['cd /tmp', 'cd'],
  ['write nell', 'are you real?', 'EOF'],
  ['write nell', 'ls -a', { type: 'eof' }],
  ['write nell', 'hint', { type: 'interrupt', text: 'bye' }],
  [{ type: 'popup', action: 'fix' }],
  [{ type: 'assistant', action: 'run' }],
  [{ type: 'assistant', action: 'decline' }],
  ['mail', 'h', 'q'],
  ['mail', 'd 2', 'q'],
  ['mail', 'x'],
  ['su', 'wrong'],
  ['finger'],
  ['last'],
  [{ type: 'popup', action: 'close' }],
  [{ type: 'tick' }],
  [{ type: 'dismissCard' }],
  [{ type: 'eof' }],
  [''],
]

const noise = fc.array(fc.constantFrom(...NOISE), { maxLength: 3 }).map((blocks) => blocks.flat())

/** Interleave noise between (and around) the solution blocks. */
function withNoise(level: number) {
  const blocks = SOLUTIONS[level]
  return fc.array(noise, { minLength: blocks.length + 1, maxLength: blocks.length + 1 }).map((gaps) => {
    const script: Item[] = [...gaps[0]]
    blocks.forEach((block, i) => script.push(...block, ...gaps[i + 1]))
    return script
  })
}

const atLevel = (level: number): GameState => newGame({ save: { version: 1, level, spells: [], flags: {} } })

describe('story (property tests)', () => {
  it('every level has a known solution', () => {
    for (const level of LEVELS) expect(SOLUTIONS[level.id], `level ${level.id}`).toBeDefined()
  })

  it('each level completes despite random noise between the solution steps', () => {
    for (const level of LEVELS) {
      fc.assert(
        fc.property(withNoise(level.id), (script) => {
          const end = play(atLevel(level.id), script)
          expect(end.story.level, `script: ${JSON.stringify(script)}`).toBeGreaterThan(level.id)
        }),
        { numRuns: 150 },
      )
    }
  })

  it('from every beat, the level can still be completed', () => {
    for (const level of LEVELS) {
      for (const beat of Object.keys(level.beats)) {
        const start = atLevel(level.id)
        const game: GameState = { ...start, story: { ...start.story, beat } }
        const end = play(game, SOLUTIONS[level.id].flat())
        expect(end.story.level, `level ${level.id}, beat ${beat}`).toBeGreaterThan(level.id)
      }
    }
  })

  it('the whole game can be played start to finish in one go', () => {
    const script = LEVELS.flatMap((level) => SOLUTIONS[level.id].flat())
    expect(play(newGame(), script).finished).toBe(true)
  })

  it('step never throws, whatever the inputs and their order', () => {
    const input: fc.Arbitrary<GameInput> = fc.oneof(
      fc.string({ maxLength: 20 }).map((text) => ({ type: 'line', text }) as const),
      fc.constantFrom<GameInput>(
        { type: 'line', text: 'write nell' },
        { type: 'line', text: 'ps aux' },
        { type: 'line', text: 'kill 6667' },
        { type: 'eof' },
        { type: 'interrupt', text: 'x' },
        { type: 'popup', action: 'fix' },
        { type: 'popup', action: 'close' },
        { type: 'tick' },
        { type: 'tick', paused: true },
        { type: 'dismissCard' },
        { type: 'panel', panel: 'spellbook' },
        { type: 'panel', panel: null },
        { type: 'clearScreen' },
        { type: 'settings', settings: { version: 1, popupSeconds: 30 } },
      ),
    )
    fc.assert(
      fc.property(fc.integer({ min: 0, max: LEVELS.length }), fc.array(input, { maxLength: 40 }), (level, inputs) => {
        let game = atLevel(level)
        for (const i of inputs) game = step(game, i)
        expect(game.story.level).toBeGreaterThanOrEqual(level)
      }),
      { numRuns: 300 },
    )
  })
})
