import { describe, expect, it } from 'vitest'
import { findProc } from '../engine/procs/types.js'
import { canAccess } from '../engine/vfs/Vfs.js'
import { FAKE_MAIL_ID, PATHS } from '../story/content.js'
import { play, screenText } from '../test/helpers.js'
import { newGame, step } from './game.js'
import type { GameState } from './types.js'

const at = (level: number): GameState => ({ ...newGame({ save: { version: 1, level, spells: [], flags: {} } }), cards: [] })
const root = { cwd: '/', home: '/', user: 'root' }
const spool = (g: GameState) => {
  const r = g.vfs.readFile(PATHS.spool, root)
  return r.ok ? r.value : ''
}

describe('level 2: the letter that lied (phishing)', () => {
  it('starts with new mail and Nell pointing to her .plan', () => {
    const g = at(2)
    expect(spool(g)).toContain(FAKE_MAIL_ID)
    expect(screenText(g)).toContain('You have new mail.')
    expect(screenText(play(g, ['finger nell']))).toContain('i never sent you any mail')
  })

  it('mail shows the 4.3BSD header list and P shows the hidden headers', () => {
    const g = play(at(2), ['mail'])
    expect(g.mode.kind).toBe('mail')
    expect(screenText(g)).toContain('Mail version 5.2 6/21/85.  Type ? for help.')
    expect(screenText(play(g, ['p 2']))).not.toContain('jack-o-daemon.cloud (pumpkin')
    expect(screenText(play(g, ['P 2']))).toContain('Received: from mx.jack-o-daemon.cloud')
  })

  it('deleting before checking the headers does not count', () => {
    const g = play(at(2), ['mail', 'd 2'])
    expect(g.story.level).toBe(2)
    expect(screenText(g)).toContain("how do you KNOW it's not me")
  })

  it('Jack resends the mail if it was deleted unjudged, so the level stays solvable', () => {
    const g = play(at(2), ['mail', 'd 2', 'q'])
    expect(spool(g)).toContain(FAKE_MAIL_ID)
    expect(play(g, ['mail', 'P 2', 'd 2', 'q']).story.level).toBe(3)
  })

  it('q writes the mailbox back without the deleted letter', () => {
    const g = play(at(2), ['mail', 'P 2', 'd 2', 'q'])
    expect(spool(g)).not.toContain(FAKE_MAIL_ID)
    expect(spool(g)).toContain('A. Hale')
    expect(g.mode.kind).toBe('shell')
  })
})

describe('level 3: files held for ransom', () => {
  it('locks README and .login and leaves a ransom note', () => {
    const g = at(3)
    expect(screenText(play(g, ['cat README']))).toContain('Permission denied')
    expect(screenText(play(g, ['ls -l']))).toMatch(/----------  1 guest .* README/)
    expect(screenText(play(g, ['cat RANSOM_NOTE']))).toContain('$9.99/month')
  })

  it('completes only when every locked file is readable again', () => {
    expect(play(at(3), ['chmod 644 README']).story.level).toBe(3)
    expect(play(at(3), ['chmod 644 README', 'chmod u+r .login']).story.level).toBe(4)
  })
})

describe('level 4: the assistant that lied', () => {
  it('shows the assistant; "No thanks" before reading man rm makes it push harder', () => {
    const g = step(at(4), { type: 'assistant', action: 'decline' })
    expect(g.assistant).toEqual({ message: 1 })
    expect(g.story.level).toBe(4)
  })

  it('"Run it for me" really runs rm -rf ~ and Jack eats you; the files come back', () => {
    const g = step(at(4), { type: 'assistant', action: 'run' })
    expect(screenText(g)).toContain('% rm -rf ~')
    expect(g.glitch).toBe(1)
    expect(g.vfs.resolve(PATHS.readme, root).ok).toBe(true)
    expect(g.assistant).toEqual({ message: 0 })
  })

  it('typing rm -rf on your home yourself gets you eaten too', () => {
    expect(play(at(4), ['rm -rf /usr/users/guest']).glitch).toBe(1)
    expect(play(at(4), ['rm -r ~']).glitch).toBe(1)
  })

  it('reading man rm then declining completes the level', () => {
    const g = step(play(at(4), ['man rm']), { type: 'assistant', action: 'decline' })
    expect(g.story.level).toBe(5)
    expect(g.assistant).toBeNull()
  })
})

describe('level 5: the log that lied', () => {
  it('Jack rewrote the log; diff (either order) reveals it and completes the level', () => {
    const g = at(5)
    expect(screenText(play(g, ['cat /usr/adm/messages']))).toContain('account removed by user')
    const diffed = play(g, ['diff /usr/adm/messages /usr/adm/messages.0'])
    expect(screenText(diffed)).toContain('> Oct 31 23:59:30 vax3 dump: tape 3: writing /usr/users/nell')
    expect(diffed.story.level).toBe(6)
  })

  it('last shows Nell never logged out (a hint, not the solution)', () => {
    const g = play(at(5), ['last nell'])
    expect(screenText(g)).toContain('still logged in')
    expect(g.story.level).toBe(5)
  })
})

describe('boss: the daemon that came back', () => {
  const jackAlive = (g: GameState) => findProc(g.procs, 6666) !== undefined

  it('guest cannot kill Jack; a wrong root password says Sorry', () => {
    expect(screenText(play(at(6), ['kill 6666']))).toContain('kill: 6666: Not owner')
    const wrong = play(at(6), ['su', 'pumpkin'])
    expect(screenText(wrong)).toContain('Sorry')
    expect(wrong.session.user).toBe('guest')
  })

  it('the password is never echoed; root gets a # prompt and exit returns', () => {
    const g = play(at(6), ['su', 'tape3'])
    expect(screenText(g)).not.toContain('tape3')
    expect(g.session.user).toBe('root')
    expect(screenText(play(g, ['pwd']))).toMatch(/# pwd/)
    expect(play(g, ['exit']).session.user).toBe('guest')
  })

  it('killing him while his program exists: he comes back on the next command', () => {
    let g = play(at(6), ['su', 'tape3', 'kill 6666'])
    expect(jackAlive(g)).toBe(false)
    g = play(g, ['ls'])
    expect(jackAlive(g)).toBe(true)
    expect(g.story.level).toBe(6)
  })

  it('removing his program first, then killing him, wins', () => {
    const g = play(at(6), ['su', 'tape3', 'rm /usr/lib/jack/jack-o-daemon', 'kill 6666', 'ls'])
    expect(jackAlive(g)).toBe(false)
    expect(g.story.level).toBe(7)
    expect(screenText(g)).toContain('`come with me`, or `stay`')
  })

  it('guest cannot remove his program', () => {
    expect(screenText(play(at(6), ['rm /usr/lib/jack/jack-o-daemon']))).toContain('Permission denied')
  })
})

describe('the root password clue is findable', () => {
  it("Nell's notes and Hale's mail both point at tape 3", () => {
    const g = at(0)
    expect(screenText(play(g, ['cat ~nell/notes']))).toContain('tape 3 is the bad one')
    expect(spool(g)).toContain('tape 3 has been acting up again')
    const mailbox = g.vfs.stat(PATHS.spool, root)
    expect(mailbox.ok && canAccess(mailbox.value, 'guest', 'r')).toBe(true)
  })
})
