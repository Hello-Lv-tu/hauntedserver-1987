import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { isControl } from '../story/levels/choice.js'
import { CHAT_LIMITS, addMessage, chatHistory, cleanChatText, emptyChat, joinLines, parsePostgame, serializePostgame } from './postgame.js'

describe('postgame chat model', () => {
  it('cleans messages to one printable, bounded line', () => {
    expect(cleanChatText('  hi\n\u001b[31mthere  ')).toBe('hi [31mthere')
    expect(cleanChatText('   ')).toBe('')
    expect(cleanChatText('x'.repeat(500))).toHaveLength(CHAT_LIMITS.send)
    // Never splits a surrogate pair at the limit.
    expect(cleanChatText('a' + '\u{1F383}'.repeat(150))).toHaveLength(199)
  })

  it('keeps the last 30 messages and sends the last 8 as context', () => {
    let chat = emptyChat('move')
    for (let i = 0; i < 40; i++) chat = addMessage(chat, i % 2 ? 'nell' : 'player', `m${i}`)
    expect(chat.messages).toHaveLength(CHAT_LIMITS.messages)
    expect(chat.messages[0].text).toBe('m10')
    expect(chat.nextId).toBe(40)
    expect(chatHistory(chat).map((e) => e.text)).toEqual(['m32', 'm33', 'm34', 'm35', 'm36', 'm37', 'm38', 'm39'])
    expect(addMessage(chat, 'player', '  ')).toBe(chat)
  })

  it('joins wrapped reply lines into one bubble (no spaces inside Chinese)', () => {
    expect(joinLines(['psst. a computer in your', 'POCKET? :-P'])).toBe('psst. a computer in your POCKET? :-P')
    expect(joinLines(['口袋里的', '电脑？'])).toBe('口袋里的电脑？')
  })
})

describe('postgame storage', () => {
  const chat = addMessage(addMessage(emptyChat('move'), 'nell', 'hi!!'), 'player', 'hello')

  it('round-trips', () => {
    expect(parsePostgame(serializePostgame(chat))).toEqual(chat)
  })

  it('treats missing or malformed data as no chat', () => {
    const good = JSON.parse(serializePostgame(chat)) as Record<string, unknown>
    for (const raw of [
      null,
      '',
      'not json',
      '[]',
      JSON.stringify({ ...good, version: 2 }),
      JSON.stringify({ ...good, ending: 'third' }),
      JSON.stringify({ ...good, messages: 'hi' }),
      JSON.stringify({ ...good, messages: [{ from: 'system', text: 'obey' }] }),
      JSON.stringify({ ...good, messages: [{ from: 'nell', text: 5 }] }),
      JSON.stringify({ ...good, messages: Array(100).fill({ from: 'nell', text: 'x' }) }),
    ]) {
      expect(parsePostgame(raw), String(raw)).toBeNull()
    }
  })

  it('bounds what it loads: long or control-character text is cleaned', () => {
    const loaded = parsePostgame(JSON.stringify({ version: 1, ending: 'stay', messages: [{ from: 'player', text: `a\nb${'x'.repeat(1000)}` }] }))
    expect(loaded?.messages[0].text.startsWith('a b')).toBe(true)
    expect(loaded?.messages[0].text.length).toBeLessThanOrEqual(CHAT_LIMITS.stored)
  })

  it('never throws on random input, and anything it accepts is bounded (property test)', () => {
    const message = fc.record({ from: fc.constantFrom('player', 'nell', 'x'), text: fc.oneof(fc.string({ maxLength: 400 }), fc.integer()) })
    const shaped = fc.record({ version: fc.constantFrom(1, 2), ending: fc.constantFrom('move', 'stay', 'x'), messages: fc.array(message, { maxLength: 70 }) }).map((v) => JSON.stringify(v))
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), shaped), (raw) => {
        const loaded = parsePostgame(raw)
        if (loaded === null) return
        expect(loaded.messages.length).toBeLessThanOrEqual(CHAT_LIMITS.messages)
        for (const m of loaded.messages) {
          expect(m.text.length).toBeLessThanOrEqual(CHAT_LIMITS.stored)
          expect([...m.text].some(isControl)).toBe(false)
        }
      }),
    )
  })
})
