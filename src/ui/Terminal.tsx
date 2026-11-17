import { useEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { prompt } from '../game/game.js'
import type { GameState } from '../game/types.js'
import type { TerminalAction } from './terminalState.js'
import { PumpkinIcon } from './icons.js'
import { LineText } from './LineText.js'
import './terminal.css'

interface TerminalProps {
  game: GameState
  input: string
  dispatch: (action: TerminalAction) => void
  inputRef: RefObject<HTMLInputElement | null>
  /** Escape: dismiss a card or close Jack's popup. */
  onEscape: () => void
  /** A bottom overlay (card, assistant) is open: keep the input above it. */
  overlay: boolean
}

export function Terminal({ game, input, dispatch, inputRef, onEscape, overlay }: TerminalProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [game.screen.length, overlay])

  const focusInput = () => {
    // Don't steal focus while the player is selecting text to copy.
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = event.key
    const handled = () => event.preventDefault()
    if (key === 'Enter') {
      handled()
      dispatch({ type: 'submit' })
    } else if (key === 'ArrowUp') {
      handled()
      dispatch({ type: 'historyUp' })
    } else if (key === 'ArrowDown') {
      handled()
      dispatch({ type: 'historyDown' })
    } else if (key === 'Tab') {
      handled()
      dispatch({ type: 'complete' })
    } else if (key === 'Escape') {
      handled()
      onEscape()
    } else if (event.ctrlKey && key === 'c') {
      handled()
      dispatch({ type: 'interrupt' })
    } else if (event.ctrlKey && key === 'd') {
      handled()
      dispatch({ type: 'game', input: { type: 'eof' } })
    } else if (event.ctrlKey && key === 'l') {
      handled()
      dispatch({ type: 'game', input: { type: 'clearScreen' } })
    }
  }

  const promptText = prompt(game)
  const writing = game.mode.kind === 'write'

  return (
    <div className="terminal" onClick={focusInput}>
      <div className="terminal-output" role="log" aria-live="polite" aria-label="Terminal output">
        {game.screen.map((line) => (
          <div key={line.id} className={`line line-${line.kind}`}>
            {line.kind === 'hint' ? <span className="hint-label">hint: </span> : null}
            {line.kind === 'jack' && line.text ? <PumpkinIcon size={14} className="line-icon" /> : null}
            <LineText text={line.text} commands={line.kind === 'hint' || line.kind === 'nell'} />
          </div>
        ))}
      </div>
      <div className="terminal-input-row">
        <label htmlFor="terminal-input" className={writing ? 'prompt prompt-writing' : 'prompt'}>
          {/* Real write shows no prompt; this label is a UI aid so players know where their words go. */}
          {writing && game.mode.kind === 'write'
            ? game.pendingVoices.length > 0
              ? `(${game.mode.to} is writing...) `
              : `(to ${game.mode.to}, Ctrl-D/EOF ends) `
            : promptText}
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          className={`terminal-input${writing ? ' writing' : ''}`}
          aria-label={writing ? `Message to ${game.mode.kind === 'write' ? game.mode.to : ''}` : game.mode.kind === 'password' ? 'Password' : 'Command'}
          type={game.mode.kind === 'password' ? 'password' : 'text'}
          value={input}
          onChange={(e) => dispatch({ type: 'input', value: e.target.value })}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      {overlay ? <div className="overlay-spacer" aria-hidden="true" /> : null}
      <div ref={endRef} />
    </div>
  )
}
