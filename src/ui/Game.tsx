import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { SAVE_KEY, serializeSave } from '../game/save.js'
import { SETTINGS_KEY } from '../game/settings.js'
import type { Card, GameInput, GameState } from '../game/types.js'
import { Assistant } from './Assistant.js'
import { CardView } from './Cards.js'
import { EndScreen } from './EndScreen.js'
import { adoptGhostIcon } from './favicon.js'
import { GearIcon } from './icons.js'
import { JackPopup } from './JackPopup.js'
import { SettingsPanel, SpellbookPanel } from './Panels.js'
import { Terminal } from './Terminal.js'
import { initialTerminal, terminalReducer } from './terminalState.js'
import { useNellVoice } from './useNellVoice.js'
import { LangProvider } from './lang.js'
import { t } from '../i18n/index.js'
import { writeStorage } from './storage.js'
import './game.css'

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

  // Nell's AI voice: resolves pending replies one at a time.
  useNellVoice(game.pendingVoices[0], send)

  // Persist progress and settings.
  useEffect(() => {
    writeStorage(SAVE_KEY, serializeSave(game.save))
  }, [game.save])
  useEffect(() => {
    writeStorage(SETTINGS_KEY, JSON.stringify(game.settings))
  }, [game.settings])

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

  // One bottom overlay at a time: a card first, then the assistant.
  // On phones two overlays covered the terminal input (play-test).
  const showCard = game.cards.length > 0
  const showAssistant = game.assistant !== null && !showCard
  const hasOverlay = showCard || showAssistant

  return (
    <LangProvider lang={game.settings.lang}>
    <div className={['game', hasOverlay ? 'has-overlay' : '', game.save.ending === 'stay' ? 'amber' : ''].filter(Boolean).join(' ')}>
      <div className="toolbar">
        <button type="button" className="tool" onClick={() => send({ type: 'panel', panel: 'spellbook' })}>
          {t(game.settings.lang, 'Spellbook')} ({game.spells.length})
        </button>
        {endingKind ? (
          <button type="button" className="tool" onClick={() => setReopened(true)}>
            {t(game.settings.lang, 'Ending')}
          </button>
        ) : null}
        <button type="button" className="tool" onClick={() => send({ type: 'panel', panel: 'settings' })} aria-label={t(game.settings.lang, 'Settings')}>
          <GearIcon size={16} />
        </button>
      </div>

      <Terminal game={game} input={state.input} dispatch={dispatch} inputRef={inputRef} onEscape={onEscape} overlay={hasOverlay} />

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

      {showEnding ? (
        <EndScreen
          game={game}
          kind={endingKind ?? 'stay'}
          onBack={() => {
            setEndingClosed(true)
            setReopened(false)
            inputRef.current?.focus()
          }}
          onPlayAgain={() => onPlayAgain(game.legacy)}
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
