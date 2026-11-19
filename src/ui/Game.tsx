import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { POSTGAME_KEY, serializePostgame } from '../game/postgame.js'
import { SAVE_KEY, serializeSave } from '../game/save.js'
import { SETTINGS_KEY } from '../game/settings.js'
import type { Card, GameInput, GameState } from '../game/types.js'
import { Assistant } from './Assistant.js'
import { CardView } from './Cards.js'
import { EndScreen } from './EndScreen.js'
import { adoptGhostIcon } from './favicon.js'
import { GearIcon, GhostIcon, SpeakerIcon } from './icons.js'
import { NellChat } from './NellChat.js'
import { chatPending, hasUnread, lastNellId } from './chatView.js'
import { sound } from './sound.js'
import { useSound } from './useSound.js'
import { JackPopup } from './JackPopup.js'
import { SettingsPanel, SpellbookPanel } from './Panels.js'
import { Terminal } from './Terminal.js'
import { initialTerminal, terminalReducer } from './terminalState.js'
import { useNellVoice } from './useNellVoice.js'
import { LangProvider } from './lang.js'
import { t } from '../i18n/index.js'
import { removeStorage, writeStorage } from './storage.js'
import { JackPresence, NellPresence } from './characters/Presence.js'
import { lastJackLine } from './characters/screen.js'
import './game.css'
import './scene.css'

const cardKey = (card: Card) => (card.kind === 'spell' ? `spell:${card.spell.command}` : `lesson:${card.card.title}`)

export function Game({ initial, onPlayAgain }: { initial: GameState; onPlayAgain: (legacy: string | null) => void }) {
  const [state, dispatch] = useReducer(terminalReducer, initial, initialTerminal)
  const { game } = state
  const inputRef = useRef<HTMLInputElement>(null)
  const send = useCallback((input: GameInput) => dispatch({ type: 'game', input }), [])

  // One-second clock for Jack's countdown (the game ignores it when paused).
  const hasPopup = game.popup !== null
  useEffect(() => {
    if (!hasPopup) return
    const timer = window.setInterval(() => send({ type: 'tick' }), 1000)
    return () => window.clearInterval(timer)
  }, [hasPopup, send])

  // The ending screen shows once per ending; "Back to the terminal" closes it.
  const [endingClosed, setEndingClosed] = useState(false)
  // After an ending (now or on a past visit) the ending can be reopened.
  const endingKind = game.ending ?? game.save.ending ?? null
  const [reopened, setReopened] = useState(false)
  const showEnding = endingKind !== null && game.cards.length === 0 && (reopened || (game.ending !== null && !endingClosed))
  useEffect(() => {
    if (game.ending === 'move') adoptGhostIcon()
  }, [game.ending])

  useSound(game)
  const toggleSound = () => {
    sound.unlock() // inside the click: browsers allow audio only after a gesture
    send({ type: 'settings', settings: { ...game.settings, sound: !game.settings.sound } })
    inputRef.current?.focus()
  }

  // Nell's AI voice: resolves pending replies one at a time.
  useNellVoice(game.pendingVoices[0], send)

  // Persist progress and settings.
  useEffect(() => {
    writeStorage(SAVE_KEY, serializeSave(game.save))
  }, [game.save])
  useEffect(() => {
    writeStorage(SETTINGS_KEY, JSON.stringify(game.settings))
  }, [game.settings])
  // The postgame chat; a new game has none, which clears the old one.
  useEffect(() => {
    if (game.postgame) writeStorage(POSTGAME_KEY, serializePostgame(game.postgame))
    else removeStorage(POSTGAME_KEY)
  }, [game.postgame])

  // Move ending: Nell's chat window. The draft survives closing the window.
  const moveChat = game.postgame?.ending === 'move' ? game.postgame : null
  const [chatOpen, setChatOpen] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const [seenNellId, setSeenNellId] = useState(-1)
  /** What had focus when the chat opened; it gets focus back on close. */
  const chatOpener = useRef<HTMLElement | null>(null)
  const openChat = () => {
    chatOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEndingClosed(true)
    setReopened(false)
    setSeenNellId(lastNellId(moveChat))
    setChatOpen(true)
  }
  const closeChat = () => {
    setChatOpen(false)
    setSeenNellId(lastNellId(moveChat))
  }
  // Return focus after the close has rendered: until then the game is inert
  // and cannot take focus. An opener that is gone (the ending screen's
  // button) falls back to the terminal input.
  const chatWasOpen = useRef(false)
  useEffect(() => {
    if (chatOpen) {
      chatWasOpen.current = true
      return
    }
    if (!chatWasOpen.current) return
    chatWasOpen.current = false
    const opener = chatOpener.current
    if (opener?.isConnected) opener.focus()
    else inputRef.current?.focus()
  }, [chatOpen])
  const unread = moveChat !== null && !chatOpen && hasUnread(moveChat, seenNellId)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const closePanel = () => {
    send({ type: 'panel', panel: null })
    inputRef.current?.focus()
  }
  const dismissCard = useCallback(() => send({ type: 'dismissCard' }), [send])
  const onEscape = () => {
    if (game.cards.length > 0) dismissCard()
    else if (game.popup && game.popup.hiddenFor === 0) send({ type: 'popup', action: 'close' })
  }

  // The room reacts: orange while Jack's tricks are on screen, lighter once
  // he is gone, amber after the Stay ending.
  const mood =
    game.save.ending === 'stay'
      ? 'amber'
      : game.popup !== null || game.assistant !== null
        ? 'jack'
        : game.story.level >= 7
          ? 'free'
          : 'dark'
  const jackLine = lastJackLine(game.screen)

  // Being eaten shakes the monitor.
  const bezelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (game.glitch === 0 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    bezelRef.current?.animate(
      [{ transform: 'none' }, { transform: 'translate(-8px, 3px) rotate(-0.6deg)' }, { transform: 'translate(7px, -4px) rotate(0.5deg)' }, { transform: 'translate(-4px, 2px)' }, { transform: 'none' }],
      { duration: 500, easing: 'ease-out' },
    )
  }, [game.glitch])

  // One bottom overlay at a time: a card first, then the assistant.
  // On phones two overlays covered the terminal input (play-test).
  const showCard = game.cards.length > 0
  const showAssistant = game.assistant !== null && !showCard
  const hasOverlay = showCard || showAssistant

  return (
    <LangProvider lang={game.settings.lang}>
    {/* inert while the chat window is open (aria-modal): no focus, clicks or keys reach the terminal or toolbar. */}
    <div className={['game', 'scene', `mood-${mood}`, hasOverlay ? 'has-overlay' : '', game.save.ending === 'stay' ? 'amber' : ''].filter(Boolean).join(' ')} inert={chatOpen}>
      <div className="scene-backdrop" aria-hidden="true" />
      <div className="scene-tint" aria-hidden="true" />
      <div className="toolbar">
        <button type="button" className="tool" onClick={() => send({ type: 'panel', panel: 'spellbook' })}>
          {/* Glows once each time a spell is learned. */}
          <span key={game.spells.length} className={game.spells.length > 0 ? 'glow-once' : undefined}>
            {t(game.settings.lang, 'Spellbook')} ({game.spells.length})
          </span>
        </button>
        {moveChat ? (
          <button
            type="button"
            className="tool tool-chat"
            onClick={openChat}
            aria-label={t(game.settings.lang, unread ? 'Chat with Nell (new message)' : 'Chat with Nell')}
          >
            <GhostIcon size={16} />
            <span className="tool-chat-label">{t(game.settings.lang, 'Chat')}</span>
            {unread ? <span className="chat-dot" aria-hidden="true" /> : null}
          </button>
        ) : null}
        {endingKind ? (
          <button type="button" className="tool" onClick={() => setReopened(true)}>
            {t(game.settings.lang, 'Ending')}
          </button>
        ) : null}
        <button
          type="button"
          className="tool"
          onClick={toggleSound}
          aria-pressed={game.settings.sound}
          aria-label={t(game.settings.lang, game.settings.sound ? 'Sound on' : 'Sound off')}
        >
          <SpeakerIcon size={16} on={game.settings.sound} />
        </button>
        <button type="button" className="tool" onClick={() => send({ type: 'panel', panel: 'settings' })} aria-label={t(game.settings.lang, 'Settings')}>
          <GearIcon size={16} />
        </button>
      </div>

      <div className="bezel" ref={bezelRef}>
        <div className="bezel-screen">
          <Terminal game={game} input={state.input} dispatch={dispatch} inputRef={inputRef} onEscape={onEscape} overlay={hasOverlay} />
        </div>
        <p className="bezel-label" aria-hidden="true">
          DIGITAL · VT100
        </p>
      </div>

      <NellPresence screen={game.screen} />
      <JackPresence screen={game.screen} />
      {jackLine ? <div key={jackLine.id} className="jack-flash" aria-hidden="true" /> : null}

      {game.popup ? (
        <JackPopup popup={game.popup} onFix={() => send({ type: 'popup', action: 'fix' })} onClose={() => send({ type: 'popup', action: 'close' })} />
      ) : null}

      {showAssistant && game.assistant ? (
        <Assistant
          assistant={game.assistant}
          onRun={() => send({ type: 'assistant', action: 'run' })}
          onDecline={() => send({ type: 'assistant', action: 'decline' })}
        />
      ) : null}

      {showCard ? <CardView key={cardKey(game.cards[0])} card={game.cards[0]} onDismiss={dismissCard} /> : null}

      {/* Being eaten: a new key remounts the overlay, which replays its CSS animation once. */}
      {game.glitch > 0 ? <div key={game.glitch} className="glitch-overlay" aria-hidden="true" /> : null}

      {showEnding && !chatOpen ? (
        <EndScreen
          game={game}
          kind={endingKind ?? 'stay'}
          onChat={moveChat ? openChat : undefined}
          onBack={() => {
            setEndingClosed(true)
            setReopened(false)
            inputRef.current?.focus()
          }}
          onPlayAgain={() => onPlayAgain(game.legacy)}
        />
      ) : null}

      {chatOpen && moveChat ? (
        <NellChat
          chat={moveChat}
          pending={chatPending(game)}
          draft={chatDraft}
          onDraft={setChatDraft}
          onSend={(text) => {
            send({ type: 'chat', text })
            setChatDraft('')
          }}
          onClose={closeChat}
        />
      ) : null}

      {game.panel === 'spellbook' ? <SpellbookPanel learned={game.spells} onClose={closePanel} /> : null}
      {game.panel === 'settings' ? (
        <SettingsPanel settings={game.settings} onChange={(settings) => send({ type: 'settings', settings })} onClose={closePanel} />
      ) : null}
    </div>
    </LangProvider>
  )
}
