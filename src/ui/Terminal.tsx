import { useEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { prompt } from '../game/game.js'
import type { GameState } from '../game/types.js'
import type { TerminalAction } from './terminalState.js'
import { PumpkinIcon } from './icons.js'
import { LineText } from './LineText.js'
import { useT } from './useT.js'
import { useTypewriter } from './useTypewriter.js'
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
  const { t, lang } = useT()
  const endRef = useRef<HTMLDivElement>(null)
  const typed = useTypewriter(game.screen, game.settings.typewriter)
  const typingLength = typed.typing?.visible.length ?? 0

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [game.screen.length, overlay, typed.shown.length, typingLength])

  const focusInput = () => {
    // Don't steal focus while the player is selecting text to copy.
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Any key finishes the slow 1987 text at once.
    if (typed.typing) typed.skip()
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
      <div className="terminal-output" role="log" aria-live="polite" aria-label={t('Terminal output')}>
        {typed.shown.map((line) => (
          <div key={line.id} className={`line line-${line.kind}`}>
            {line.kind === 'hint' ? <span className="hint-label">{t('hint: ')}</span> : null}
            {line.kind === 'jack' && line.text ? <PumpkinIcon size={14} className="line-icon" /> : null}
            <LineText text={line.text} commands={line.kind === 'hint' || line.kind === 'nell'} />
          </div>
        ))}
        {typed.typing ? (
          <div key={typed.typing.line.id} className={`line line-${typed.typing.line.kind} typing`}>
            {/* Screen readers get the whole line once; the animation is visual only. */}
            <span className="sr-only">{typed.typing.line.text}</span>
            <span aria-hidden="true">
              {typed.typing.line.kind === 'hint' ? <span className="hint-label">{t('hint: ')}</span> : null}
              {typed.typing.visible}
              <span className="type-cursor" />
            </span>
          </div>
        ) : null}
      </div>
      <div className="terminal-input-row">
        <label htmlFor="terminal-input" className={writing ? 'prompt prompt-writing' : 'prompt'}>
          {/* Real write shows no prompt; this label is a UI aid so players know where their words go. */}
          {writing && game.mode.kind === 'write'
            ? game.pendingVoices.some((p) => p.target !== 'chat')
              ? lang === 'zh'
                ? `（${game.mode.to} 正在输入…）`
                : `(${game.mode.to} is writing...) `
              : lang === 'zh'
                ? `（写给 ${game.mode.to}，Ctrl-D/EOF 结束）`
                : `(to ${game.mode.to}, Ctrl-D/EOF ends) `
            : promptText}
        </label>
        {/* Each key press makes the phosphor flare a little. */}
        <span key={input.length} className="key-glow" aria-hidden="true" />
        <input
          id="terminal-input"
          ref={inputRef}
          className={`terminal-input${writing ? ' writing' : ''}`}
          aria-label={writing ? `Message to ${game.mode.kind === 'write' ? game.mode.to : ''}` : game.mode.kind === 'password' ? t('Password') : t('Command')}
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
