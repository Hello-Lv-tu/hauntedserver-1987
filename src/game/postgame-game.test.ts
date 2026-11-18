import { describe, expect, it } from 'vitest'
import { hasCjk, translate } from '../i18n/index.js'
import { LEVELS } from '../story/engine.js'
import { NELL } from '../story/lines.js'
import { play, screenText } from '../test/helpers.js'
import { REVISIT_HINT, newGame, step } from './game.js'
import { addMessage, emptyChat, parsePostgame, serializePostgame } from './postgame.js'
import type { SaveData } from './save.js'
import { DEFAULT_SETTINGS } from './settings.js'
import type { GameState } from './types.js'

const ZH = { ...DEFAULT_SETTINGS, lang: 'zh' as const }
const atChoice = (settings = DEFAULT_SETTINGS): GameState => ({ ...newGame({ save: { version: 1, level: 7, spells: ['ls'], flags: {} }, settings }), cards: [] })
const moved = (settings = DEFAULT_SETTINGS) => play(atChoice(settings), ['write nell', 'come with me', 'EOF', 'tar cvf /dev/rmt0 ~nell'])
const stayed = (game = atChoice()) => play(game, ['write nell', 'stay'])
const withKeepsake = () => play(atChoice(), ['su', 'tape3', 'cat ~nell/.diary', 'write nell', 'keyboard', 'be kind to the ghost'])
const chatPending = (g: GameState) => g.pendingVoices.filter((p) => p.target === 'chat')
const save = (ending: 'move' | 'stay', extra: Partial<SaveData> = {}): SaveData => ({ version: 1, level: LEVELS.length, spells: ['ls'], flags: {}, ending, ...extra })
const finger = (g: GameState) => screenText(play(g, ['EOF', 'finger nell']))

describe('Move ending: the chat window', () => {
  it('starts a chat where Nell writes first; her .plan says she left', () => {
    const g = moved()
    expect(g.postgame?.ending).toBe('move')
    expect(g.postgame?.messages.map((m) => m.text)).toEqual([...NELL.moveOpen[0]])
    expect(finger(g)).toContain('gone traveling')
  })

  it('the keepsake is a bubble, never the visitor line itself', () => {
    const g = play(withKeepsake(), ['come with me', 'EOF', 'tar cvf /dev/rmt0 ~nell'])
    const texts = g.postgame?.messages.map((m) => m.text) ?? []
    expect(texts.at(-1)).toBe(NELL.keepsakeMove[0][0])
    expect(texts.join(' ')).not.toContain('be kind to the ghost')
  })

  it('a message asks the AI with the Move context and recent chat', () => {
    const g = step(moved(), { type: 'chat', text: '  what is a phone?\n' })
    const [pending] = chatPending(g)
    expect(pending.request).toMatchObject({ level: LEVELS.length, beat: 'end', ending: 'move', text: 'what is a phone?', chats: 1 })
    expect(pending.request.keepsake).toBeUndefined()
    expect(pending.request.history.map((h) => h.from)).toEqual(['nell', 'nell', 'nell'])
    expect(g.postgame?.messages.at(-1)).toMatchObject({ from: 'player', text: 'what is a phone?' })
    // Nothing printed in the terminal, and no story change.
    expect(g.screen).toEqual(moved().screen)
    expect(g.story).toEqual(moved().story)
  })

  it('the reply lands in the chat as one bubble; a failure uses a fallback', () => {
    const asked = step(moved(), { type: 'chat', text: 'hi' })
    const id = chatPending(asked)[0].id
    const answered = step(asked, { type: 'voice', id, lines: ['a computer in your', 'POCKET? liar :-P'] })
    expect(answered.postgame?.messages.at(-1)).toMatchObject({ from: 'nell', text: 'a computer in your POCKET? liar :-P' })
    expect(answered.pendingVoices).toEqual([])
    const failed = step(asked, { type: 'voice', id, lines: null })
    expect(NELL.moveChatter.map((v) => v[0])).toContain(failed.postgame?.messages.at(-1)?.text)
  })

  it('rapid sends are ignored until Nell answers; replies are never duplicated', () => {
    const once = step(moved(), { type: 'chat', text: 'one' })
    expect(step(once, { type: 'chat', text: 'two' })).toBe(once)
    const id = chatPending(once)[0].id
    const answered = step(once, { type: 'voice', id, lines: ['ok!'] })
    expect(step(answered, { type: 'voice', id, lines: ['ok!'] })).toBe(answered)
    const next = step(answered, { type: 'chat', text: 'two' })
    expect(chatPending(next)).toHaveLength(1)
    expect(chatPending(next)[0].request.history.at(-1)).toEqual({ from: 'nell', text: 'ok!' })
  })

  it('a reply for a chat that is gone (or another ending) is dropped', () => {
    const asked = step(moved(), { type: 'chat', text: 'hi' })
    const id = chatPending(asked)[0].id
    const swapped = { ...asked, postgame: emptyChat('stay') }
    const result = step(swapped, { type: 'voice', id, lines: ['hello'] })
    expect(result.postgame).toEqual(emptyChat('stay'))
    expect(result.pendingVoices).toEqual([])
    expect(screenText(result)).toBe(screenText(swapped))
  })

  it('ignores empty messages, caps long ones, and needs the Move chat', () => {
    expect(step(moved(), { type: 'chat', text: ' \n ' })).toEqual(moved())
    expect(chatPending(step(moved(), { type: 'chat', text: 'x'.repeat(900) }))[0].request.text).toHaveLength(200)
    const s = stayed()
    expect(step(s, { type: 'chat', text: 'hi' })).toBe(s)
    const before = atChoice()
    expect(step(before, { type: 'chat', text: 'hi' })).toBe(before)
  })

  it('writing to her on vax3 gets a pre-written note, not the AI', () => {
    const g = play(moved(), ['write nell', 'hello?'])
    expect(g.pendingVoices).toEqual([])
    const notes = NELL.movedAway.map((v) => v[0])
    expect(notes.some((n) => screenText(g).includes(n))).toBe(true)
  })

  it('sends the keepsake flag (not the line)', () => {
    const g = play(withKeepsake(), ['come with me', 'EOF', 'tar cvf /dev/rmt0 ~nell'])
    const request = chatPending(step(g, { type: 'chat', text: 'hi' }))[0].request
    expect(request.keepsake).toBe(true)
    expect(JSON.stringify(request)).not.toContain('be kind to the ghost')
  })
})

describe('Stay ending: the old terminal', () => {
  it('write nell asks the AI with the Stay context; the chat remembers both sides', () => {
    const g = play(stayed(), ['nice to see you'])
    const [pending] = g.pendingVoices
    expect(pending.target).toBeUndefined()
    expect(pending.request).toMatchObject({ ending: 'stay', beat: 'end', text: 'nice to see you' })
    expect(pending.fallback.length).toBeGreaterThan(0)
    const answered = step(g, { type: 'voice', id: pending.id, lines: ['all quiet on vax3 :-)'] })
    expect(screenText(answered)).toContain('all quiet on vax3 :-)')
    expect(answered.postgame?.messages.map((m) => [m.from, m.text])).toEqual([
      ['player', 'nice to see you'],
      ['nell', 'all quiet on vax3 :-)'],
    ])
    // The next message carries that as context.
    expect(play(answered, ['bye'])).toMatchObject({ pendingVoices: [{ request: { history: [{ text: 'nice to see you' }, { text: 'all quiet on vax3 :-)' }] } }] })
  })

  it('a failed reply prints and remembers the fallback', () => {
    const g = play(stayed(), ['hi'])
    const failed = step(g, { type: 'voice', id: g.pendingVoices[0].id, lines: null })
    expect(screenText(failed)).toContain(g.pendingVoices[0].fallback[0])
    expect(failed.postgame?.messages.at(-1)?.text).toBe(g.pendingVoices[0].fallback.join(' '))
  })

  it('her .plan says she is on duty; commands in write mode still get the nudge', () => {
    expect(finger(stayed())).toContain('on duty: night operator, vax3')
    expect(play(stayed(), ['ls -a']).pendingVoices).toEqual([])
  })
})

describe('later visits', () => {
  it('an old version-1 save without stored chat gets a fresh chat and the right .plan', () => {
    const g = newGame({ save: save('move') })
    expect(g.postgame?.messages.map((m) => m.text)).toEqual([...NELL.moveOpen[0]])
    expect(finger(g)).toContain('gone traveling')
    expect(g.screen.filter((l) => l.kind === 'hint').at(-1)?.text).toContain('"Chat"')
    const s = newGame({ save: save('stay') })
    expect(s.postgame).toEqual(emptyChat('stay'))
    expect(finger(s)).toContain('on duty')
  })

  it('restores the stored chat, and Move Nell says welcome back', () => {
    const asked = step(moved(), { type: 'chat', text: 'hi' })
    const answered = step(asked, { type: 'voice', id: chatPending(asked)[0].id, lines: ['hey!'] })
    const stored = parsePostgame(serializePostgame(answered.postgame!))
    const later = newGame({ save: answered.save, postgame: stored })
    const texts = later.postgame?.messages.map((m) => m.text) ?? []
    expect(texts.slice(0, -1)).toEqual(answered.postgame?.messages.map((m) => m.text))
    expect(NELL.moveWelcomeBack.map((v) => v[0])).toContain(texts.at(-1))
    expect(later.pendingVoices).toEqual([])
  })

  it('a message left unanswered by a reload gets one fallback reply, without a new request', () => {
    // Move: the page closed while Nell was typing.
    const asked = step(moved(), { type: 'chat', text: 'are you there?' })
    const later = newGame({ save: asked.save, postgame: parsePostgame(serializePostgame(asked.postgame!)) })
    const texts = later.postgame!.messages.map((m) => m.text)
    expect(texts.slice(0, -2)).toEqual(asked.postgame!.messages.map((m) => m.text))
    // The same line the live fallback would have used, then the welcome back.
    expect(texts.at(-2)).toBe(chatPending(asked)[0].fallback.join(' '))
    expect(NELL.moveWelcomeBack.map((v) => v[0])).toContain(texts.at(-1))
    expect(later.pendingVoices).toEqual([])

    // Stay: the terminal chat is answered with an epilogue line.
    const stayAsked = play(stayed(), ['still guarding?'])
    const stayLater = newGame({ save: stayAsked.save, postgame: parsePostgame(serializePostgame(stayAsked.postgame!)) })
    expect(stayLater.postgame!.messages.map((m) => m.from)).toEqual(['player', 'nell'])
    expect(NELL.endChatter.map((v) => v.join(' '))).toContain(stayLater.postgame!.messages[1].text)
    expect(stayLater.pendingVoices).toEqual([])
  })

  it('the interrupted reply follows the current language; answered chats are untouched', () => {
    const asked = step(moved(), { type: 'chat', text: 'hi' })
    const zh = newGame({ save: asked.save, postgame: parsePostgame(serializePostgame(asked.postgame!)), settings: ZH })
    expect(hasCjk(zh.postgame!.messages.at(-2)!.text)).toBe(true)

    const answered = step(asked, { type: 'voice', id: chatPending(asked)[0].id, lines: ['hey!'] })
    const later = newGame({ save: answered.save, postgame: parsePostgame(serializePostgame(answered.postgame!)) })
    expect(later.postgame!.messages).toHaveLength(answered.postgame!.messages.length + 1)
    const stayChat = addMessage(addMessage(emptyChat('stay'), 'player', 'hi'), 'nell', 'hi!!')
    expect(newGame({ save: save('stay'), postgame: stayChat }).postgame).toEqual(stayChat)
  })

  it('a chat from the other ending, or a malformed one, is not reused', () => {
    const stayChat = addMessage(emptyChat('stay'), 'player', 'from another run')
    expect(newGame({ save: save('move'), postgame: stayChat }).postgame?.messages.map((m) => m.text)).toEqual([...NELL.moveOpen[0]])
    expect(newGame({ save: save('stay'), postgame: parsePostgame('{"version":1,"ending":"stay","messages":[{"from":"x"}]}') }).postgame).toEqual(emptyChat('stay'))
  })

  it('Stay Nell mentions the keepsake in her reunion', () => {
    const g = newGame({ save: save('stay', { legacy: 'hello stranger' }) })
    expect(screenText(g)).toContain("you're back!!")
    expect(screenText(g)).toContain(NELL.keepsakeStay[0][0])
    expect(newGame({ save: save('move', { legacy: 'hello stranger' }) }).postgame?.messages.at(-1)?.text).toBe(NELL.keepsakeMove[0][0])
  })

  it('a new game has no chat (the stored one is cleared)', () => {
    expect(newGame().postgame).toBeNull()
    expect(newGame({ legacy: 'hi' }).postgame).toBeNull()
  })
})

describe('postgame in Chinese', () => {
  it('Nell writes, falls back and gets the revisit hint in Chinese', () => {
    const g = moved(ZH)
    for (const m of g.postgame!.messages) expect(hasCjk(m.text), m.text).toBe(true)
    const asked = step(g, { type: 'chat', text: '你好' })
    expect(chatPending(asked)[0].request.lang).toBe('zh')
    const failed = step(asked, { type: 'voice', id: chatPending(asked)[0].id, lines: null })
    expect(hasCjk(failed.postgame!.messages.at(-1)!.text)).toBe(true)
    for (const kind of ['move', 'stay'] as const) {
      const hint = translate(`You finished the game (ending: ${kind === 'move' ? 'Moved to 2026' : 'The guardian of vax3'}). ${REVISIT_HINT[kind]}`, 'zh')
      expect(hint.replace(/`[^`]+`/g, ''), hint).not.toMatch(/[A-Za-z]{4,}/)
    }
  })
})
