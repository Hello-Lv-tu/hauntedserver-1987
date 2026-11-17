import { LEVELS, levelAt } from '../story/engine'

export interface BeatInfo {
  levelTitle: string
  hints: readonly [string, string, string]
  isEnd: boolean
}

/**
 * Look up a beat from the story's own data, so the server builds prompts
 * only from facts it owns (never from text the browser sent).
 */
export function beatInfo(level: number, beat: string): BeatInfo | null {
  if (level > LEVELS.length) return null
  const def = levelAt(level)
  const found = Object.hasOwn(def.beats, beat) ? def.beats[beat] : undefined
  if (found === undefined) return null
  return { levelTitle: def.title, hints: found.hints, isEnd: level >= LEVELS.length }
}
