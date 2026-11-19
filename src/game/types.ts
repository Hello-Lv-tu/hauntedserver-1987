import type { ChatEntry, VoiceRequest } from '../ai/request.js'
import type { ProcTable } from '../engine/procs/types.js'
import type { Session, Stream, TerminalMode } from '../engine/shell/types.js'
import type { Vfs } from '../engine/vfs/Vfs.js'
import type { Spell } from '../story/spells.js'
import type { EndingKind, Flags, LessonCard, StoryState } from '../story/types.js'
import type { PostgameChat } from './postgame.js'
import type { SaveData } from './save.js'
import type { Settings } from './settings.js'

/**
 * - prompt: an echoed command line   - written: a line the player wrote to Nell
 * - nell / jack: character messages   - system: boot text and game notices
 */
export type LineKind = Stream | 'prompt' | 'system' | 'nell' | 'jack' | 'written'

export interface ScreenLine {
  id: number
  kind: LineKind
  text: string
}

export type Card = { kind: 'spell'; spell: Spell } | { kind: 'lesson'; card: LessonCard }

export interface PopupState {
  /** Index into POPUP_MESSAGES. */
  message: number
  secondsLeft: number
  /** Seconds until a closed popup comes back; 0 means it is visible. */
  hiddenFor: number
}

export interface Checkpoint {
  vfs: Vfs
  procs: ProcTable
  session: Session
  level: number
  flags: Flags
}

/** A reply from Nell waiting for her AI voice (or for the fallback). */
export interface PendingVoice {
  id: number
  request: VoiceRequest
  fallback: string[]
  /** Where the reply goes: the terminal (default) or the postgame chat window. */
  target?: 'chat'
}

export type Mode = { kind: 'shell' } | TerminalMode

/** Jack's "Smart Assistant" bubble (Level 4). */
export interface AssistantState {
  /** Index into ASSISTANT_MESSAGES. */
  message: number
}

export type Panel = 'spellbook' | 'settings' | null

export interface GameState {
  vfs: Vfs
  procs: ProcTable
  session: Session
  mode: Mode
  story: StoryState
  /** Learned spells, in the order they were learned. */
  spells: string[]
  popup: PopupState | null
  assistant: AssistantState | null
  /** Spell and lesson cards waiting to be shown, oldest first. */
  cards: Card[]
  screen: ScreenLine[]
  nextId: number
  settings: Settings
  checkpoint: Checkpoint
  /** What should be in localStorage now (updated at each level start). */
  save: SaveData
  /** Increments each time Jack eats the player (the UI plays a glitch). */
  glitch: number
  finished: boolean
  panel: Panel
  /** Replies waiting for the AI, oldest first. The UI resolves them one at a time. */
  pendingVoices: PendingVoice[]
  nextVoiceId: number
  /** Recent conversation with Nell (last 8 messages), sent as AI context. */
  chatLog: ChatEntry[]
  /** The ending reached in this session (shows the ending screen). */
  ending: EndingKind | null
  /** The visitor line from the hidden ending, kept across games. */
  legacy: string | null
  /** The conversation with Nell after an ending (stored in this browser). */
  postgame: PostgameChat | null
  /** When this session started (ms), for the summary. */
  startedAt: number
}

export type GameInput =
  | { type: 'line'; text: string }
  | { type: 'eof' }
  | { type: 'interrupt'; text: string }
  | { type: 'popup'; action: 'fix' | 'close' }
  | { type: 'assistant'; action: 'run' | 'decline' }
  /** One second passed. `paused` is true while the UI wants time stopped. */
  | { type: 'tick'; paused?: boolean }
  | { type: 'dismissCard' }
  | { type: 'settings'; settings: Settings }
  | { type: 'panel'; panel: Panel }
  | { type: 'clearScreen' }
  /** The AI answered (`lines`) or failed (`null`: use the fallback). */
  | { type: 'voice'; id: number; lines: string[] | null }
  /** The player sent a message in the postgame chat window (Move ending). */
  | { type: 'chat'; text: string }
