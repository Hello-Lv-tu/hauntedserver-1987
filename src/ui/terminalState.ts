import { COMMAND_NAMES } from '../engine/commands/registry'
import { columns } from '../engine/commands/ls'
import { print, prompt, step } from '../game/game'
import type { GameInput, GameState } from '../game/types'
import { complete } from './completion'

/** UI-only state around the game: the input line and history browsing. */
export interface TerminalState {
  game: GameState
  input: string
  /** Position while browsing history with Up/Down; null when editing. */
  historyIndex: number | null
  /** What the player was typing before they started browsing history. */
  draft: string
}

export type TerminalAction =
  | { type: 'input'; value: string }
  | { type: 'submit' }
  | { type: 'historyUp' }
  | { type: 'historyDown' }
  | { type: 'complete' }
  | { type: 'interrupt' }
  | { type: 'game'; input: GameInput }

export function initialTerminal(game: GameState): TerminalState {
  return { game, input: '', historyIndex: null, draft: '' }
}

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'input':
      return { ...state, input: action.value, historyIndex: null }

    case 'submit':
      return { ...state, game: step(state.game, { type: 'line', text: state.input }), input: '', historyIndex: null, draft: '' }

    case 'historyUp': {
      const { history } = state.game.session
      if (history.length === 0 || state.game.mode.kind === 'write') return state
      const index = state.historyIndex === null ? history.length - 1 : Math.max(0, state.historyIndex - 1)
      const draft = state.historyIndex === null ? state.input : state.draft
      return { ...state, historyIndex: index, input: history[index], draft }
    }

    case 'historyDown': {
      if (state.historyIndex === null) return state
      const { history } = state.game.session
      if (state.historyIndex >= history.length - 1) return { ...state, historyIndex: null, input: state.draft }
      const index = state.historyIndex + 1
      return { ...state, historyIndex: index, input: history[index] }
    }

    case 'complete': {
      const { game } = state
      if (game.mode.kind === 'write') return state
      const result = complete(state.input, game.vfs, game.session, COMMAND_NAMES)
      const next = { ...state, input: result.line, historyIndex: null }
      if (result.options.length === 0) return next
      const listed = print(game, [['prompt', prompt(game) + state.input], ...columns(result.options).map((t) => ['stdout', t] as const)])
      return { ...next, game: listed }
    }

    case 'interrupt':
      return { ...state, game: step(state.game, { type: 'interrupt', text: state.input }), input: '', historyIndex: null }

    case 'game':
      return { ...state, game: step(state.game, action.input) }
  }
}
