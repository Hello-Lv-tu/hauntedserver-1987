import { useContext } from 'react'
import { t, translate } from '../i18n/index.js'
import { LangContext } from './langContext.js'

/** Translate UI labels and story text in components. */
export function useT() {
  const lang = useContext(LangContext)
  return {
    lang,
    /** UI label, with {n}-style placeholders. */
    t: (text: string, vars?: Record<string, string | number>) => t(lang, text, vars),
    /** Story text (lesson cards, popup messages, spells). */
    tr: (text: string) => translate(text, lang),
  }
}
