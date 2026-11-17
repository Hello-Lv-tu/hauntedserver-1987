import { describe, expect, it } from 'vitest'
import { devWorld } from '../test/helpers'
import type { TerminalAction, TerminalState } from './terminalState'
import { initialState, prompt, terminalReducer } from './terminalState'

function start(): TerminalState {
  const { vfs, session } = devWorld()
  return initialState(vfs, session, ['boot'])
}

function apply(state: TerminalState, ...actions: TerminalAction[]) {
  return actions.reduce(terminalReducer, state)
}

const type = (value: string): TerminalAction[] => [{ type: 'input', value }, { type: 'submit' }]

describe('terminal state', () => {
  it('shows the prompt with the current directory', () => {
    const state = apply(start(), ...type('cd /tmp'))
    expect(prompt(state.session)).toBe('vax3:/tmp% ')
    expect(prompt(start().session)).toBe('vax3:~% ')
  })

  it('echoes the command, then the output', () => {
    const state = apply(start(), ...type('whoami'))
    expect(state.lines.map((l) => [l.kind, l.text])).toEqual([
      ['system', 'boot'],
      ['prompt', 'vax3:~% whoami'],
      ['stdout', 'guest'],
    ])
    expect(state.events).toHaveLength(1)
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
    expect(apply(start(), ...type('clear')).lines).toEqual([])
  })

  it('cancels the line with ^C', () => {
    const state = apply(start(), { type: 'input', value: 'cat x' }, { type: 'interrupt' })
    expect(state.input).toBe('')
    expect(state.lines.at(-1)?.text).toBe('vax3:~% cat x^C')
  })

  it('lists ambiguous completions under the prompt', () => {
    const state = apply(start(), { type: 'input', value: 'h' }, { type: 'complete' })
    expect(state.input).toBe('h')
    expect(state.lines.at(-1)?.text).toContain('history')
  })
})
