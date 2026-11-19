import { useEffect, useRef } from 'react'
import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { CHAT_LIMITS } from '../game/postgame.js'
import type { PostgameChat } from '../game/postgame.js'
import { canSend, charactersLeft, isImeEnter, trapFocus } from './chatView.js'
import { GhostIcon } from './icons.js'
import { useT } from './useT.js'
import './chat.css'

interface NellChatProps {
  chat: PostgameChat
  /** Nell's reply is on its way. */
  pending: boolean
  draft: string
  onDraft: (draft: string) => void
  onSend: (text: string) => void
  onClose: () => void
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Phones: size the window to the visible viewport, so the on-screen keyboard
 * never covers the input (100dvh does not shrink for it on every browser).
 */
function useVisibleViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport
    const element = ref.current
    if (!viewport || !element) return
    const update = () => {
      element.style.setProperty('--chat-height', `${viewport.height}px`)
      element.style.setProperty('--chat-top', `${viewport.offsetTop}px`)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [ref])
}

/**
 * The Move ending: Nell lives in the browser now, in a 2026-style chat window
 * (original styling, round everything; she has opinions about that).
 * Rendered into document.body, outside the CRT and its scanlines; React
 * context (the language) still reaches it through the portal.
 */
export function NellChat({ chat, pending, draft, onDraft, onSend, onClose }: NellChatProps) {
  const { t } = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLOListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  /** Between compositionstart and compositionend (input methods). */
  const composing = useRef(false)
  useVisibleViewport(rootRef)

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  // Keep the newest message in view.
  const count = chat.messages.length
  useEffect(() => {
    const log = logRef.current
    log?.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [count, pending])

  const sendable = canSend(draft, pending)
  const left = charactersLeft(draft)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    // Keep the keyboard open on phones: focus stays in the input.
    inputRef.current?.focus({ preventScroll: true })
    if (sendable) onSend(draft)
  }

  const onDialogKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    // aria-modal: Tab and Shift+Tab stay inside the window.
    if (e.key !== 'Tab' || rootRef.current === null) return
    const focusables = [...rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    const target = trapFocus(focusables.indexOf(document.activeElement as HTMLElement), focusables.length, e.shiftKey)
    if (target !== null) {
      e.preventDefault()
      focusables[target].focus()
    }
  }

  return createPortal(
    <div className="nell-chat-backdrop" onClick={onClose}>
      <div
        ref={rootRef}
        className="nell-chat"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nell-chat-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKey}
      >
        <header className="nell-chat-head">
          <button type="button" className="nell-chat-close" onClick={onClose} aria-label={t('Close chat')}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="nell-chat-avatar" aria-hidden="true">
            <GhostIcon size={32} />
          </span>
          <div className="nell-chat-who">
            <h2 id="nell-chat-title" className="nell-chat-name">
              Nell
            </h2>
            <p className={pending ? 'nell-chat-status typing' : 'nell-chat-status'}>{t(pending ? 'typing...' : 'online · new to 2026')}</p>
          </div>
        </header>

        <ol ref={logRef} className="nell-chat-log" role="log" aria-live="polite" aria-label={t('Conversation with Nell')} tabIndex={0}>
          {chat.messages.map((m) => (
            <li key={m.id} className={`nell-msg nell-msg-${m.from}`}>
              <span className="sr-only">{m.from === 'nell' ? 'Nell: ' : `${t('You')}: `}</span>
              {m.text}
            </li>
          ))}
          {pending ? (
            <li className="nell-msg nell-msg-nell nell-typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </li>
          ) : null}
        </ol>
        <p className="sr-only" role="status">
          {pending ? t('Nell is typing...') : ''}
        </p>

        <form className="nell-chat-compose" onSubmit={submit}>
          <input
            ref={inputRef}
            className="nell-chat-input"
            type="text"
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={() => {
              composing.current = false
            }}
            onKeyDown={(e) => {
              // The Enter that commits an input method's text must not send.
              // Blocking its default stops the form's implicit submit.
              if (isImeEnter({ key: e.key, isComposing: e.nativeEvent.isComposing, keyCode: e.nativeEvent.keyCode }, composing.current)) e.preventDefault()
            }}
            maxLength={CHAT_LIMITS.send}
            placeholder={t('Write a message...')}
            aria-label={t('Message to Nell')}
            aria-describedby="nell-chat-note"
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="submit" className="nell-chat-send" disabled={!sendable} aria-label={t('Send')}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 19V6M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p id="nell-chat-note" className="nell-chat-note">
          {left !== null ? t('{n} characters left', { n: left }) : t('Only in this browser. Nell answers one message at a time.')}
        </p>
      </div>
    </div>,
    document.body,
  )
}
