import type { Lang } from '../i18n/index.js'

export interface Settings {
  version: 1
  /** Seconds before Jack's popup "eats" the player. */
  popupSeconds: 60 | 30
  /** Language of characters, hints and UI (the machine always speaks English). */
  lang: Lang
}

export const DEFAULT_SETTINGS: Settings = { version: 1, popupSeconds: 60, lang: 'en' }
export const SETTINGS_KEY = 'hauntedserver:settings'

/** Parse untrusted stored settings; anything invalid falls back to defaults. */
export function parseSettings(raw: string | null, fallbackLang: Lang = 'en'): Settings {
  const defaults: Settings = { ...DEFAULT_SETTINGS, lang: fallbackLang }
  if (raw === null) return defaults
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return defaults
    const v = value as { popupSeconds?: unknown; lang?: unknown }
    return {
      version: 1,
      popupSeconds: v.popupSeconds === 30 || v.popupSeconds === 60 ? v.popupSeconds : defaults.popupSeconds,
      lang: v.lang === 'en' || v.lang === 'zh' ? v.lang : defaults.lang,
    }
  } catch {
    return defaults
  }
}
