import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Settings } from '../game/settings.js'
import { SPELLS } from '../story/spells.js'

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
  return (
    <Panel title={`Spellbook (${learned.length}/${SPELLS.length})`} onClose={onClose}>
      <ul className="spell-list">
        {SPELLS.map((spell) => {
          const known = learned.includes(spell.command)
          return (
            <li key={spell.command} className={known ? 'spell known' : 'spell unknown'}>
              {known ? (
                <>
                  <code>{spell.command}</code> <span className="spell-name">{spell.name}</span>
                  <span className="spell-desc">{spell.description}</span>
                </>
              ) : (
                <>
                  <code>???</code> <span className="spell-name">not yet learned</span>
                  {spell.tip ? <span className="spell-desc">Try: <code className="cmd">{spell.tip}</code></span> : null}
                </>
              )}
            </li>
          )
        })}
      </ul>
      <p className="panel-note">Type `man name` in the terminal to read about any spell you know.</p>
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
  return (
    <Panel title="Settings" onClose={onClose}>
      <fieldset className="setting">
        <legend>Jack's popup countdown</legend>
        {([60, 30] as const).map((seconds) => (
          <label key={seconds} className="setting-option">
            <input
              type="radio"
              name="popupSeconds"
              value={seconds}
              checked={settings.popupSeconds === seconds}
              onChange={() => onChange({ ...settings, popupSeconds: seconds })}
            />{' '}
            {seconds} seconds{seconds === 60 ? ' (relaxed, default)' : ' (tense)'}
          </label>
        ))}
        <p className="panel-note">Applies from the next countdown. The countdown pauses while panels and cards are open.</p>
      </fieldset>
    </Panel>
  )
}
