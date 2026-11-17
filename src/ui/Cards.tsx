import { useEffect } from 'react'
import type { Card } from '../game/types.js'
import { useT } from './useT.js'

/** How long a spell card stays before it dismisses itself. */
const SPELL_CARD_MS = 5000

interface CardViewProps {
  card: Card
  onDismiss: () => void
}

/** Spell and lesson cards. Non-modal: typing continues while one is shown. */
export function CardView({ card, onDismiss }: CardViewProps) {
  const { t, tr } = useT()
  useEffect(() => {
    if (card.kind !== 'spell') return
    const timer = window.setTimeout(onDismiss, SPELL_CARD_MS)
    return () => window.clearTimeout(timer)
  }, [card, onDismiss])

  if (card.kind === 'spell') {
    return (
      <aside className="card card-spell" role="status" aria-label={t('New spell learned')}>
        <p className="card-kicker">{t('* New spell learned *')}</p>
        <p className="card-title">
          <code>{card.spell.command}</code> · {tr(card.spell.name)}
        </p>
        <p className="card-body">{tr(card.spell.description)}</p>
        <button type="button" className="card-button" onClick={onDismiss}>
          {t('OK (Esc)')}
        </button>
      </aside>
    )
  }

  return (
    <aside className="card card-lesson" role="dialog" aria-labelledby="lesson-title">
      <p className="card-kicker">{t('Real-world lesson')}</p>
      <h2 id="lesson-title" className="card-title">
        {tr(card.card.title)}
      </h2>
      <p className="card-body">{tr(card.card.body)}</p>
      <ul className="card-tips">
        {card.card.tips.map((tip) => (
          <li key={tip}>{tr(tip)}</li>
        ))}
      </ul>
      <button type="button" className="card-button" onClick={onDismiss}>
        {t('Got it (Esc)')}
      </button>
    </aside>
  )
}
