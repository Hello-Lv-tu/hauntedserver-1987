export interface Settings {
  version: 1
  /** Seconds before Jack's popup "eats" the player. */
  popupSeconds: 60 | 30
}

export const DEFAULT_SETTINGS: Settings = { version: 1, popupSeconds: 60 }
export const SETTINGS_KEY = 'hauntedserver:settings'

/** Parse untrusted stored settings; anything invalid falls back to defaults. */
export function parseSettings(raw: string | null): Settings {
  if (raw === null) return DEFAULT_SETTINGS
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS
    const seconds = (value as { popupSeconds?: unknown }).popupSeconds
    return seconds === 30 || seconds === 60 ? { version: 1, popupSeconds: seconds } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}
