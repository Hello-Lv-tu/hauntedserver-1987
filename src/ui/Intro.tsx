import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../i18n/index.js'
import { t } from '../i18n/index.js'
import { GhostIcon } from './icons.js'
import './scene.css'

/** Where the glowing terminal sits in the artwork (percent of width/height). */
const TERMINAL_FOCUS = { x: 53, y: 49 }
const ZOOM_MS = 1800

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * The opening: the dark machine room, one glowing terminal. Enter (or a tap)
 * steps inside: the camera pushes into the terminal, then the game starts.
 */
export function Intro({ lang, onEnter }: { lang: Lang; onEnter: () => void }) {
  const [entering, setEntering] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const enter = () => {
    if (entering) return
    if (reducedMotion()) {
      onEnter()
      return
    }
    setEntering(true)
    window.setTimeout(onEnter, ZOOM_MS)
  }

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  return (
    <div
      ref={rootRef}
      className={entering ? 'intro entering' : 'intro'}
      role="button"
      tabIndex={0}
      aria-label={t(lang, 'Step inside')}
      onClick={enter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          enter()
        }
      }}
      style={{ ['--fx' as string]: `${TERMINAL_FOCUS.x}%`, ['--fy' as string]: `${TERMINAL_FOCUS.y}%` }}
    >
      <div className="intro-art">
        <picture>
          <source media="(max-width: 700px)" srcSet="/art/machine-room-900.webp" />
          <img src="/art/machine-room.webp" alt={t(lang, 'A dark basement machine room. One old terminal still glows green.')} />
        </picture>
        <div className="intro-glow" aria-hidden="true" />
        <div className="intro-ghost" aria-hidden="true">
          <GhostIcon size={22} />
        </div>
      </div>
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-text">
        <p className="intro-place">{t(lang, 'Ravenmoor University · B-wing basement · 2026')}</p>
        <p className="intro-cta">{t(lang, 'Press Enter (or tap) to step inside')}</p>
      </div>
    </div>
  )
}
