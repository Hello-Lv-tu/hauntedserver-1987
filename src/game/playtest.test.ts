import { describe, expect, it } from 'vitest'
import { findProc } from '../engine/procs/types.js'
import { hasCjk, translate } from '../i18n/index.js'
import { ROOT_MAIL_HINT } from '../story/levels/level2.js'
import { play, screenText } from '../test/helpers.js'
import { newGame, step } from './game.js'
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

describe('play-test 2026-11-17: AI Nell repeated old tasks in Level 4', () => {
  it('chat context starts fresh at each level', () => {
    const g = play(newGame(), ['write nell', 'hi', 'what now?', 'EOF', 'ls -a', 'cat .from_nell'])
    expect(g.story.level).toBe(1)
    expect(g.chatLog.map((c) => c.text).join(' ')).not.toContain('what now?')
  })
})

describe('play-test 2026-11-17: /user and diff in Level 5', () => {
  it('/user suggests /usr', () => {
    expect(hints(play(at(5), ['cd /user'])).at(-1)).toBe('Unix spells it usr, without the e: `cd /usr`')
    expect(hints(play(at(5), ['diff /user/adm/messages.0 /user/adm/messages'])).at(-1)).toContain('`diff /usr/adm/messages.0 /usr/adm/messages`')
  })

  it('diff with one file says it needs two', () => {
    expect(hints(play(at(5), ['diff /usr/adm/messages.0'])).join(' ')).toContain('TWO files')
  })

  it('a command glued to a path suggests the space', () => {
    expect(hints(play(at(5), ['diff/usr/adm/messages.0'])).join(' ')).toContain('`diff /usr/adm/messages.0`')
  })

  it('the exact steps the player typed, then the fix, complete the level', () => {
    const g = play(at(5), ['hint', 'ls', 'cd /user', 'cd user', 'cd adm', 'hint', 'diff /user/adm/messages.0', 'diff/user/adm/messages.0.', 'diff /usr/adm/messages.0 /usr/adm/messages'])
    expect(g.story.level).toBe(6)
  })
})

describe('play-test 2026-11-17: typo in the boss fight', () => {
  it('a near-miss file name gets a "did you mean"', () => {
    const g = play(at(6), ['su', 'tape3', 'cd /usr/lib/jack', 'rm jack-o-daekon'])
    expect(hints(g).at(-1)).toBe('Did you mean `rm jack-o-daemon`?')
  })

  it('su when already root says so instead of doing nothing visible', () => {
    expect(hints(play(at(6), ['su', 'tape3', 'su'])).at(-1)).toContain('already root')
  })

  it('the exact steps the player typed, then the fix, win the fight', () => {
    const g = play(at(6), ['su', 'tape3', 'kill 6666', 'ls', 'cat /usr/lib/crontab', 'hint', 'hint', 'cd /usr/lib/jack', 'rm jack-o-daekon', 'ls -a', 'su', 'su', 'rm jack-o-daemon', 'kill 6666'])
    expect(g.story.level).toBe(7)
  })
})

describe('play-test 2026-11-17: tar in the Move ending', () => {
  const choice = () => ({ ...newGame({ save: { version: 1, level: 7, spells: [], flags: {} } }), cards: [] })
  it('a truncated device shows the full example', () => {
    expect(hints(play(choice(), ['tar cvf /dev/rmt'])).at(-1)).toContain('`tar cvf /dev/rmt0 ~nell`')
  })
  it('options glued to the device suggest the space', () => {
    expect(hints(play(choice(), ['tar cvf/dev/rmt0 ~nell'])).at(-1)).toBe('Put a space after the options: `tar cvf /dev/rmt0 ~nell`')
  })
  it("the player's steps, then the fix, reach the Move ending", () => {
    const g = play(choice(), ['come with me', 'write nell', 'come with me', 'EOF', 'tar cvf /dev/rmt', 'tar cvf/dev/rmt0 ~nell', 'tar cvf /dev/rmt0 ~nell'])
    expect(g.ending).toBe('move')
  })
})

describe('play-test 2026-11: boss actions done early on a replay', () => {
  const nellSaid = (g: GameState, from: number) => g.screen.slice(from).filter((l) => l.kind === 'nell').map((l) => l.text)
  /** Levels 2 to 5, solved the normal way. */
  const middle = (g: GameState): GameState => {
    let s = play(g, ['finger nell', 'mail', 'P 2', 'd 2', 'q', 'chmod 644 README', 'chmod 644 .login', 'man rm'])
    s = step({ ...s, cards: [] }, { type: 'assistant', action: 'decline' })
    return s
  }

  it('Jack killed and his program removed before the boss: the fight is not replayed', () => {
    const early = play(at(2), ['su', 'tape3', 'rm /usr/lib/jack/jack-o-daemon', 'kill 6666', 'kill 6666', 'exit'])
    expect(early.story.level).toBe(2)
    const beforeDiff = middle(early)
    expect(beforeDiff.story.level).toBe(5)
    const from = beforeDiff.screen.length
    const g = play(beforeDiff, ['diff /usr/adm/messages.0 /usr/adm/messages'])
    expect(g.story.level).toBe(7)
    expect(findProc(g.procs, 6666)).toBeUndefined()
    const said = nellSaid(g, from).join('\n')
    expect(said).toContain('his program is gone too')
    expect(said).not.toContain('only root can stop root')
    expect(g.cards.some((c) => c.kind === 'lesson' && c.card.title === 'Lesson: find the root cause')).toBe(true)
    expect(play(g, ['write nell', 'stay']).ending).toBe('stay')
  })

  it('Jack killed early but his program kept: cron has him back, and the fight still teaches the respawn', () => {
    const g = play(at(5), ['su', 'tape3', 'kill 6666', 'diff /usr/adm/messages.0 /usr/adm/messages'])
    expect(g.story.level).toBe(6)
    expect(findProc(g.procs, 6666)).toBeDefined()
    const respawned = play(g, ['kill 6666', 'ps aux'])
    expect(screenText(respawned)).toContain('he came BACK?!')
    expect(play(respawned, ['cat /usr/lib/crontab', 'rm /usr/lib/jack/jack-o-daemon', 'kill 6666']).story.level).toBe(7)
  })

  it('only his program removed early: one kill in the boss finishes him', () => {
    const g = play(at(5), ['su', 'tape3', 'rm /usr/lib/jack/jack-o-daemon', 'diff /usr/adm/messages.0 /usr/adm/messages'])
    expect(g.story.level).toBe(6)
    expect(play(g, ['kill 6666']).story.level).toBe(7)
  })

  it('a normal boss start still shows his intro', () => {
    const from = at(5).screen.length
    const g = play(at(5), ['diff /usr/adm/messages.0 /usr/adm/messages'])
    expect(g.story.level).toBe(6)
    expect(nellSaid(g, from).join('\n')).toContain('only root can stop root')
  })
})

describe('play-test 2026-11: mail as root during the phishing level', () => {
  it('root has no mail (correct), and a hint points back to guest', () => {
    const g = play(at(2), ['su', 'tape3', 'mail'])
    expect(screenText(g)).toContain('No mail for root')
    expect(hints(g).at(-1)).toBe(ROOT_MAIL_HINT)
    const back = play(g, ['exit', 'mail'])
    expect(back.mode.kind).toBe('mail')
  })

  it('the hint is only for the mail task, not for root everywhere', () => {
    const g = play(at(5), ['su', 'tape3', 'mail'])
    expect(screenText(g)).toContain('No mail for root')
    expect(hints(g)).not.toContain(ROOT_MAIL_HINT)
  })

  it('the hint has a Chinese version that keeps its commands', () => {
    const zh = translate(ROOT_MAIL_HINT, 'zh')
    expect(hasCjk(zh)).toBe(true)
    expect(zh).toContain('`exit`')
    expect(zh).toContain('`mail`')
  })
})
