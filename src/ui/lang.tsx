import type { ReactNode } from 'react'
import type { Lang } from '../i18n/index.js'
import { LangContext } from './langContext.js'

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}
