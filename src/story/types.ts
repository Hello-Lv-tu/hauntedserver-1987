import type { Proc, ProcTable } from '../engine/procs/types'
import type { CommandEvent } from '../engine/shell/types'
import type { Vfs } from '../engine/vfs/Vfs'
import type { VNode } from '../engine/vfs/types'

export type Flags = Readonly<Record<string, boolean>>

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
  | { type: 'startProc'; proc: Proc }
  | { type: 'stopProc'; pid: number }
  | { type: 'popup'; action: 'show' | 'hide' | 'nag' }
  | { type: 'lesson'; card: LessonCard }
  | { type: 'levelStart'; level: number }
  | { type: 'eaten' }
  | { type: 'finished' }

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
  /** Inputs any beat of this level reacts to (e.g. Jack's popup). */
  on?(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null
}
