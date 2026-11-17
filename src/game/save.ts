import { LEGACY_MAX, isControl } from '../story/levels/choice.js'
import { SPELLS } from '../story/spells.js'
import type { EndingKind } from '../story/types.js'

/**
 * What is stored between visits. No filesystem snapshot and no player-typed
 * text: the world is rebuilt from the seed and the level's entry effects.
 */
export interface SaveData {
  version: 1
  level: number
  spells: string[]
  flags: Record<string, boolean>
  /** Which ending the player reached, if any. */
  ending?: EndingKind
  /** The hidden ending's line for the next visitor (only in this browser). */
  legacy?: string
}

export const SAVE_KEY = 'hauntedserver:save'

const KNOWN_SPELLS = new Set(SPELLS.map((s) => s.command))
const MAX_LEVEL = 100

/** Parse untrusted saved data. Returns null if anything is off. */
export function parseSave(raw: string | null): SaveData | null {
  if (raw === null) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  if (v.version !== 1) return null
  if (typeof v.level !== 'number' || !Number.isInteger(v.level) || v.level < 0 || v.level > MAX_LEVEL) return null
  if (!Array.isArray(v.spells) || !v.spells.every((s) => typeof s === 'string' && KNOWN_SPELLS.has(s))) return null
  if (typeof v.flags !== 'object' || v.flags === null || Array.isArray(v.flags)) return null
  const flags: Record<string, boolean> = {}
  for (const [key, flag] of Object.entries(v.flags)) {
    if (typeof flag !== 'boolean' || key.length > 40) return null
    flags[key] = flag
  }
  if (v.ending !== undefined && v.ending !== 'move' && v.ending !== 'stay') return null
  if (v.legacy !== undefined && (typeof v.legacy !== 'string' || v.legacy.length > LEGACY_MAX || [...v.legacy].some(isControl))) return null
  return {
    version: 1,
    level: v.level,
    spells: [...new Set(v.spells as string[])],
    flags,
    ...(v.ending ? { ending: v.ending } : {}),
    ...(v.legacy ? { legacy: v.legacy } : {}),
  }
}

export function serializeSave(save: SaveData): string {
  return JSON.stringify(save)
}
