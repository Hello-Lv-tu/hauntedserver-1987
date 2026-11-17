import { createContext } from 'react'
import type { Lang } from '../i18n/index.js'

export const LangContext = createContext<Lang>('en')
