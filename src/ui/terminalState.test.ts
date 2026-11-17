import { describe, expect, it } from 'vitest'
import { newGame, prompt } from '../game/game.js'
import type { TerminalAction, TerminalState } from './terminalState.js'
import { initialTerminal, terminalReducer } from './terminalState.js'

const start = (): TerminalState => initialTerminal(newGame())
const apply = (state: TerminalState, ...actions: TerminalAction[]) => actions.reduce(terminalReducer, state)
const type = (value: string): TerminalAction[] => [{ type: 'input', value }, { type: 'submit' }]
const texts = (state: TerminalState) => state.game.screen.map((l) => l.text)

describe('terminal state', () => {
  it('shows the prompt with the current directory', () => {
    expect(prompt(start().game)).toBe('vax3:~% ')
    expect(prompt(apply(start(), ...type('cd /tmp')).game)).toBe('vax3:/tmp% ')
  })

  it('echoes the command, then the output', () => {
    const state = apply(start(), ...type('whoami'))
    expect(texts(state).slice(-2)).toEqual(['vax3:~% whoami', 'guest'])
  })

  it('walks history with up and down, restoring the draft', () => {
    let state = apply(start(), ...type('ls'), ...type('pwd'), { type: 'input', value: 'dra' })
    state = apply(state, { type: 'historyUp' })
    expect(state.input).toBe('pwd')
    state = apply(state, { type: 'historyUp' }, { type: 'historyUp' })
    expect(state.input).toBe('ls')
    state = apply(state, { type: 'historyDown' }, { type: 'historyDown' })
    expect(state.input).toBe('dra')
  })

  it('clears the screen', () => {
    expect(apply(start(), ...type('clear')).game.screen).toEqual([])
  })

  it('cancels the line with ^C', () => {
    const state = apply(start(), { type: 'input', value: 'cat x' }, { type: 'interrupt' })
    expect(state.input).toBe('')
    expect(texts(state).at(-1)).toBe('vax3:~% cat x^C')
  })

  it('lists ambiguous completions under the prompt', () => {
    const state = apply(start(), { type: 'input', value: 'h' }, { type: 'complete' })
    expect(state.input).toBe('h')
    expect(texts(state).at(-1)).toContain('history')
  })

  it('does not complete or browse history in write mode', () => {
    let state = apply(start(), ...type('write nell'), { type: 'input', value: 'h' })
    state = apply(state, { type: 'complete' }, { type: 'historyUp' })
    expect(state.input).toBe('h')
    expect(prompt(state.game)).toBe('')
  })
})
