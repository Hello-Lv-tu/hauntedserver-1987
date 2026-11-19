import type { Proc, ProcTable } from '../engine/procs/types.js'
import type { CommandEvent } from '../engine/shell/types.js'
import type { Vfs } from '../engine/vfs/Vfs.js'
import type { VNode } from '../engine/vfs/types.js'

export type Flags = Readonly<Record<string, boolean>>

export type EndingKind = 'move' | 'stay'

export interface StoryState {
  level: number
  beat: string
  flags: Flags
  /** Which of the beat's three hints comes next. */
  hintIndex: number
  /** Counts inputs; used to rotate between line variants deterministically. */
  turn: number
  /** Messages the player has written to Nell in the current beat. */
  chats: number
}

export type PopupAction = 'fix' | 'close' | 'timeout'

export type StoryInput =
  | { type: 'command'; event: CommandEvent }
  | { type: 'wrote'; to: string; text: string }
  | { type: 'popup'; action: PopupAction }
  | { type: 'mail'; action: 'print' | 'printAll' | 'delete' | 'undelete' | 'quit'; messageId?: string; kept?: string[] }
  | { type: 'assistant'; action: 'decline' }
  | { type: 'hint' }

/** Read-only view of the world the story uses to interpret inputs. */
export interface StoryCtx {
  vfs: Vfs
  procs: ProcTable
  home: string
  user: string
}

export interface LessonCard {
  title: string
  body: string
  tips: string[]
}

export type Effect =
  | { type: 'nell'; lines: string[] }
  /** A reply to the player's own words: the AI may reword it; `fallback` is used otherwise. */
  | { type: 'nellVoice'; fallback: string[]; text: string }
  | { type: 'jack'; lines: string[] }
  | { type: 'hint'; text: string }
  | { type: 'say'; lines: string[] }
  | { type: 'writeFile'; path: string; node: VNode }
  /** Change only the permission bits of an existing file. */
  | { type: 'setMode'; path: string; mode: number }
  | { type: 'startProc'; proc: Proc }
  | { type: 'stopProc'; pid: number }
  | { type: 'popup'; action: 'show' | 'hide' | 'nag' }
  | { type: 'assistant'; action: 'show' | 'hide' | 'nag' }
  | { type: 'lesson'; card: LessonCard }
  | { type: 'levelStart'; level: number }
  | { type: 'eaten' }
  | { type: 'finished' }
  /** A main ending was reached. */
  | { type: 'ending'; kind: EndingKind }
  /** The player's line for the next visitor (hidden ending). */
  | { type: 'legacy'; text: string }

export interface Transition {
  /** Next beat in the same level. */
  next?: string
  effects?: Effect[]
  flags?: Record<string, boolean>
  /** The level is done; the next level starts. */
  complete?: boolean
}

export interface Beat {
  id: string
  hints: readonly [string, string, string]
  /** Return null when the input means nothing in this beat. */
  on(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null
}

export interface Level {
  id: number
  title: string
  start: string
  beats: Readonly<Record<string, Beat>>
  /** Effects when the level starts (also replayed after being eaten). */
  enter: Effect[]
  /**
   * The level's goal is already met in the world when the level would start
   * (e.g. the boss was beaten early on a replay). Returns the effects that
   * close it instead of `enter`; the next level then starts right away.
   */
  alreadyDone?(ctx: StoryCtx): Effect[] | null
  /** Inputs any beat of this level reacts to (e.g. Jack's popup). */
  on?(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null
}
