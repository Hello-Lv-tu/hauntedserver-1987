import { useCallback, useEffect, useReducer, useRef } from 'react'
import { SAVE_KEY, serializeSave } from '../game/save.js'
import { SETTINGS_KEY } from '../game/settings.js'
import type { Card, GameInput, GameState } from '../game/types.js'
import { Assistant } from './Assistant.js'
import { CardView } from './Cards.js'
import { GearIcon } from './icons.js'
import { JackPopup } from './JackPopup.js'
import { SettingsPanel, SpellbookPanel } from './Panels.js'
import { Terminal } from './Terminal.js'
import { initialTerminal, terminalReducer } from './terminalState.js'
import { useNellVoice } from './useNellVoice.js'
import { writeStorage } from './storage.js'
import './game.css'

const cardKey = (card: Card) => (card.kind === 'spell' ? `spell:${card.spell.command}` : `lesson:${card.card.title}`)

export function Game({ initial }: { initial: GameState }) {
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
    <div className={hasOverlay ? 'game has-overlay' : 'game'}>
      <div className="toolbar">
        <button type="button" className="tool" onClick={() => send({ type: 'panel', panel: 'spellbook' })}>
          Spellbook ({game.spells.length})
        </button>
        <button type="button" className="tool" onClick={() => send({ type: 'panel', panel: 'settings' })} aria-label="Settings">
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

      {game.panel === 'spellbook' ? <SpellbookPanel learned={game.spells} onClose={closePanel} /> : null}
      {game.panel === 'settings' ? (
        <SettingsPanel settings={game.settings} onChange={(settings) => send({ type: 'settings', settings })} onClose={closePanel} />
      ) : null}
    </div>
  )
}
