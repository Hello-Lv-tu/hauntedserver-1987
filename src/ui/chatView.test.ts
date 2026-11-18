import { describe, expect, it } from 'vitest'
import { addMessage, emptyChat } from '../game/postgame.js'
import type { PendingVoice } from '../game/types.js'
import { canSend, charactersLeft, chatPending, hasUnread, isImeEnter, lastNellId, trapFocus } from './chatView.js'

const voice = (target?: 'chat'): PendingVoice => ({ id: 1, request: { level: 8, beat: 'end', chats: 1, text: 'hi', history: [] }, fallback: ['x'], ...(target ? { target } : {}) })

describe('chat window logic', () => {
  it('send needs text and no reply in flight', () => {
    expect(canSend('hi', false)).toBe(true)
    expect(canSend('  \n', false)).toBe(false)
    expect(canSend('hi', true)).toBe(false)
  })

  it('only chat replies count as pending (terminal ones do not block the chat)', () => {
    expect(chatPending({ pendingVoices: [voice()] })).toBe(false)
    expect(chatPending({ pendingVoices: [voice(), voice('chat')] })).toBe(true)
  })

  it('shows the character counter only near the 200 limit', () => {
    expect(charactersLeft('hi')).toBeNull()
    expect(charactersLeft('x'.repeat(170))).toBe(30)
    expect(charactersLeft('x'.repeat(250))).toBe(0)
  })

  it('marks new messages from Nell as unread', () => {
    let chat = addMessage(emptyChat('move'), 'nell', 'hi!')
    expect(hasUnread(chat, -1)).toBe(true)
    const seen = lastNellId(chat)
    expect(hasUnread(chat, seen)).toBe(false)
    chat = addMessage(chat, 'player', 'hello')
    expect(hasUnread(chat, seen)).toBe(false)
    chat = addMessage(chat, 'nell', 'yo')
    expect(hasUnread(chat, seen)).toBe(true)
    expect(hasUnread(null, -1)).toBe(false)
  })
})

describe('chat keyboard handling', () => {
  const enter = (isComposing = false, keyCode = 13) => ({ key: 'Enter', isComposing, keyCode })

  it('an Enter that commits an input method composition never sends', () => {
    // Chrome / Edge / Firefox: keydown during composition.
    expect(isImeEnter(enter(true, 229), false)).toBe(true)
    // Safari: compositionend first, then keydown with keyCode 229.
    expect(isImeEnter(enter(false, 229), false)).toBe(true)
    // Between compositionstart and compositionend.
    expect(isImeEnter(enter(), true)).toBe(true)
    // A plain Enter sends; other keys are not Enter.
    expect(isImeEnter(enter(), false)).toBe(false)
    expect(isImeEnter({ key: 'a', isComposing: true, keyCode: 229 }, true)).toBe(false)
  })

  it('Tab and Shift+Tab wrap inside the dialog', () => {
    expect(trapFocus(2, 3, false)).toBe(0)
    expect(trapFocus(0, 3, true)).toBe(2)
    expect(trapFocus(1, 3, false)).toBeNull()
    expect(trapFocus(1, 3, true)).toBeNull()
    // Focus somehow outside the dialog: pull it back in.
    expect(trapFocus(-1, 3, false)).toBe(0)
    expect(trapFocus(-1, 3, true)).toBe(2)
    expect(trapFocus(-1, 0, false)).toBeNull()
  })
})
