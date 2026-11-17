import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Settings } from '../game/settings.js'
import { SPELLS } from '../story/spells.js'
import { LANGS } from '../i18n/index.js'
import { useT } from './useT.js'
import { LineText } from './LineText.js'

interface PanelProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** A small modal panel: focus moves in, Escape closes, focus returns on close. */
function Panel({ title, onClose, children }: PanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <div className="panel-header">
          <h2 id="panel-title">{title}</h2>
          <button type="button" ref={closeRef} className="panel-close" onClick={onClose} aria-label="Close">
            [x]
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SpellbookPanel({ learned, onClose }: { learned: string[]; onClose: () => void }) {
  const { t, tr } = useT()
  return (
    <Panel title={`${t('Spellbook')} (${learned.length}/${SPELLS.length})`} onClose={onClose}>
      <ul className="spell-list">
        {SPELLS.map((spell) => {
          const known = learned.includes(spell.command)
          return (
            <li key={spell.command} className={known ? 'spell known' : 'spell unknown'}>
              {known ? (
                <>
                  <code>{spell.command}</code> <span className="spell-name">{tr(spell.name)}</span>
                  <span className="spell-desc">
                    <LineText text={tr(spell.description)} commands />
                  </span>
                </>
              ) : (
                <>
                  <code>???</code> <span className="spell-name">{t('not yet learned')}</span>
                  {spell.tip ? <span className="spell-desc">{t('Try:')} <code className="cmd">{spell.tip}</code></span> : null}
                </>
              )}
            </li>
          )
        })}
      </ul>
      <p className="panel-note">
        <LineText text={t('Type `man name` in the terminal to read about any spell you know.')} commands />
      </p>
    </Panel>
  )
}

export function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}) {
  const { t, lang } = useT()
  return (
    <Panel title={t('Settings')} onClose={onClose}>
      <fieldset className="setting">
        <legend>{lang === 'zh' ? '语言 / Language' : 'Language'}</legend>
        {LANGS.map((option) => (
          <label key={option} className="setting-option">
            <input type="radio" name="lang" value={option} checked={settings.lang === option} onChange={() => onChange({ ...settings, lang: option })} />{' '}
            {/* Language names are shown in their own language, so each player can find theirs. */}
            {option === 'en' ? 'English' : '中文'}
          </label>
        ))}
        <p className="panel-note">{t('Commands and machine output stay in English, like a real 1987 terminal.')}</p>
      </fieldset>
      <fieldset className="setting">
        <legend>{t('Text speed')}</legend>
        <label className="setting-option">
          <input type="checkbox" checked={settings.typewriter} onChange={(e) => onChange({ ...settings, typewriter: e.target.checked })} />{' '}
          {t('Slow 1987 text (types out letter by letter; any key skips)')}
        </label>
      </fieldset>
      <fieldset className="setting">
        <legend>{t("Jack's popup countdown")}</legend>
        {([60, 30] as const).map((seconds) => (
          <label key={seconds} className="setting-option">
            <input
              type="radio"
              name="popupSeconds"
              value={seconds}
              checked={settings.popupSeconds === seconds}
              onChange={() => onChange({ ...settings, popupSeconds: seconds })}
            />{' '}
            {t(seconds === 60 ? '60 seconds (relaxed, default)' : '30 seconds (tense)')}
          </label>
        ))}
        <p className="panel-note">{t('Applies from the next countdown. The countdown pauses while panels and cards are open.')}</p>
      </fieldset>
    </Panel>
  )
}
