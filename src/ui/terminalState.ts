import { COMMAND_NAMES } from '../engine/commands/registry'
import { execute } from '../engine/shell/execute'
import type { CommandEvent, Session, Stream } from '../engine/shell/types'
import { tildify } from '../engine/vfs/path'
import type { Vfs } from '../engine/vfs/Vfs'
import { complete } from './completion'
import { columns } from '../engine/commands/ls'

export type LineKind = Stream | 'prompt' | 'system'

export interface ScreenLine {
  id: number
  kind: LineKind
  text: string
}

export interface TerminalState {
  vfs: Vfs
  session: Session
  lines: ScreenLine[]
  input: string
  /** Position while browsing history with Up/Down; null when editing. */
  historyIndex: number | null
  /** What the player was typing before they started browsing history. */
  draft: string
  nextId: number
  /** Every command event so far (for the Spellbook later). */
  events: CommandEvent[]
}

export type TerminalAction =
  | { type: 'input'; value: string }
  | { type: 'submit' }
  | { type: 'historyUp' }
  | { type: 'historyDown' }
  | { type: 'complete' }
  | { type: 'interrupt' }
  | { type: 'clear' }

export function prompt(session: Session): string {
  return `vax3:${tildify(session.cwd, session.home)}% `
}

export function initialState(vfs: Vfs, session: Session, intro: string[]): TerminalState {
  return {
    vfs,
    session,
    lines: intro.map((text, id) => ({ id, kind: 'system', text })),
    input: '',
    historyIndex: null,
    draft: '',
    nextId: intro.length,
    events: [],
  }
}

function append(state: TerminalState, lines: { kind: LineKind; text: string }[]): TerminalState {
  const added = lines.map((line, i) => ({ ...line, id: state.nextId + i }))
  return { ...state, lines: [...state.lines, ...added], nextId: state.nextId + added.length }
}

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'input':
      return { ...state, input: action.value, historyIndex: null }

    case 'submit': {
      const echoed = append(state, [{ kind: 'prompt', text: prompt(state.session) + state.input }])
      const result = execute(state.input, state.vfs, state.session)
      const base: TerminalState = {
        ...echoed,
        vfs: result.vfs,
        session: result.session,
        input: '',
        historyIndex: null,
        draft: '',
        events: [...state.events, ...result.events],
      }
      if (result.clear) return { ...base, lines: [] }
      return append(base, result.lines.map((l) => ({ kind: l.stream, text: l.text })))
    }

    case 'historyUp': {
      const { history } = state.session
      if (history.length === 0) return state
      const index = state.historyIndex === null ? history.length - 1 : Math.max(0, state.historyIndex - 1)
      const draft = state.historyIndex === null ? state.input : state.draft
      return { ...state, historyIndex: index, input: history[index], draft }
    }

    case 'historyDown': {
      if (state.historyIndex === null) return state
      const { history } = state.session
      if (state.historyIndex >= history.length - 1) {
        return { ...state, historyIndex: null, input: state.draft }
      }
      const index = state.historyIndex + 1
      return { ...state, historyIndex: index, input: history[index] }
    }

    case 'complete': {
      const result = complete(state.input, state.vfs, state.session, COMMAND_NAMES)
      const next = { ...state, input: result.line, historyIndex: null }
      if (result.options.length === 0) return next
      return append(next, [
        { kind: 'prompt', text: prompt(state.session) + state.input },
        ...columns(result.options).map((text) => ({ kind: 'stdout' as const, text })),
      ])
    }

    case 'interrupt':
      return { ...append(state, [{ kind: 'prompt', text: prompt(state.session) + state.input + '^C' }]), input: '', historyIndex: null }

    case 'clear':
      return { ...state, lines: [] }
  }
}
