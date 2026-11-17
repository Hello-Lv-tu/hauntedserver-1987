import type { ChatEntry, VoiceRequest } from '../ai/request'
import type { ProcTable } from '../engine/procs/types'
import type { Session, Stream, WriteMode } from '../engine/shell/types'
import type { Vfs } from '../engine/vfs/Vfs'
import type { Spell } from '../story/spells'
import type { Flags, LessonCard, StoryState } from '../story/types'
import type { SaveData } from './save'
import type { Settings } from './settings'

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
}

export type Mode = { kind: 'shell' } | WriteMode

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
}

export type GameInput =
  | { type: 'line'; text: string }
  | { type: 'eof' }
  | { type: 'interrupt'; text: string }
  | { type: 'popup'; action: 'fix' | 'close' }
  /** One second passed. `paused` is true while the UI wants time stopped. */
  | { type: 'tick'; paused?: boolean }
  | { type: 'dismissCard' }
  | { type: 'settings'; settings: Settings }
  | { type: 'panel'; panel: Panel }
  | { type: 'clearScreen' }
  /** The AI answered (`lines`) or failed (`null`: use the fallback). */
  | { type: 'voice'; id: number; lines: string[] | null }
