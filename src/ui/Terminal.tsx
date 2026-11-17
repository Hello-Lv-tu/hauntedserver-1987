import { useEffect, useReducer, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { Session } from '../engine/shell/types'
import type { Vfs } from '../engine/vfs/Vfs'
import { initialState, prompt, terminalReducer } from './terminalState'
import './terminal.css'

interface TerminalProps {
  vfs: Vfs
  session: Session
  /** Lines shown before the first prompt (boot banner, messages). */
  intro: string[]
}

export function Terminal({ vfs, session, intro }: TerminalProps) {
  const [state, dispatch] = useReducer(terminalReducer, undefined, () => initialState(vfs, session, intro))
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [state.lines.length])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const focusInput = () => {
    // Don't steal focus while the player is selecting text to copy.
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      dispatch({ type: 'submit' })
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      dispatch({ type: 'historyUp' })
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      dispatch({ type: 'historyDown' })
    } else if (event.key === 'Tab') {
      event.preventDefault()
      dispatch({ type: 'complete' })
    } else if (event.ctrlKey && event.key === 'c') {
      event.preventDefault()
      dispatch({ type: 'interrupt' })
    } else if (event.ctrlKey && event.key === 'l') {
      event.preventDefault()
      dispatch({ type: 'clear' })
    }
  }

  return (
    <div className="terminal" onClick={focusInput}>
      <div className="terminal-output" role="log" aria-live="polite" aria-label="Terminal output">
        {state.lines.map((line) => (
          <div key={line.id} className={`line line-${line.kind}`}>
            {line.kind === 'hint' ? <span className="hint-label">hint: </span> : null}
            {line.text || '\u00a0'}
          </div>
        ))}
      </div>
      <div className="terminal-input-row">
        <label htmlFor="terminal-input" className="prompt">
          {prompt(state.session)}
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          className="terminal-input"
          aria-label="Command"
          value={state.input}
          onChange={(e) => dispatch({ type: 'input', value: e.target.value })}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div ref={endRef} />
    </div>
  )
}
