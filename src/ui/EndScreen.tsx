import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types.js'
import { SPELLS } from '../story/spells.js'
import { GhostIcon } from './icons.js'
import { useT } from './useT.js'
import './ending.css'

const LESSONS = [
  ['Scareware', "Real warnings don't count down or beg you to click."],
  ['Phishing', 'Check the real sender. Nobody needs your password by mail.'],
  ['Ransomware', "Don't pay first. Look at what really happened, and keep backups."],
  ['AI can be wrong', "Don't run advice you don't understand. Check the manual."],
  ['Faked records', 'Compare with an independent copy before you believe it.'],
  ['Persistence', 'If it keeps coming back, find what restarts it.'],
] as const

const MOVE_MESSAGES = ['whoa. am i in 2026??', 'why are all the buttons ROUND??', 'and this font is so... soft :-P', 'thank you, partner.']
const STAY_MESSAGES = ["i'll keep vax3 company.", 'no pumpkins on my watch ;-)', 'come back anytime: write nell']

interface EndScreenProps {
  game: GameState
  kind: 'move' | 'stay'
  onBack: () => void
  onPlayAgain: () => void
  /** Move ending: open Nell's chat window. */
  onChat?: () => void
}

function minutes(ms: number): number {
  return Math.max(1, Math.round(ms / 60000))
}

/**
 * The ending. Move: the CRT fades to white and Nell, now a little ghost in a
 * 2026 chat app, types her first messages. Stay: the same layout in amber.
 */
export function EndScreen({ game, kind, onBack, onPlayAgain, onChat }: EndScreenProps) {
  const backRef = useRef<HTMLButtonElement>(null)
  const chatRef = useRef<HTMLButtonElement>(null)
  const { t } = useT()
  const [now] = useState(() => Date.now())
  useEffect(() => {
    // Move: replying to Nell is the natural next step.
    const first = chatRef.current ?? backRef.current
    first?.focus({ preventScroll: true })
  }, [])

  const move = kind === 'move'
  const messages = move ? MOVE_MESSAGES : STAY_MESSAGES
  const learned = SPELLS.filter((s) => game.spells.includes(s.command))
  const today = learned.filter((s) => s.today).length
  const time = minutes(now - game.startedAt)

  return (
    <div className={`ending ending-${kind}`} role="dialog" aria-modal="true" aria-labelledby="ending-title">
      {move ? <div className="ending-whiteout" aria-hidden="true" /> : null}
      <div className="ending-sheet">
        <section className="chat" aria-label={t('Messages from Nell')}>
          <div className="chat-head">
            <span className="avatar">
              <GhostIcon size={44} />
            </span>
            <div>
              <p className="chat-name">Nell</p>
              <p className="chat-status">{t(move ? 'online · from 1987' : 'on vax3 · ttyp0')}</p>
            </div>
          </div>
          <div className="chat-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {messages.map((m, i) => (
            <p key={m} className="bubble" style={{ animationDelay: `${3.2 + i * 0.7}s` }}>
              {t(m)}
            </p>
          ))}
        </section>

        <header className="ending-header">
          <p className="ending-kicker">{t('Ending')}</p>
          <h1 id="ending-title" className="ending-title">
            {t(move ? 'Moved to 2026' : 'The guardian of vax3')}
          </h1>
          <p className="ending-sub">{t(move ? 'Nell rode a tape into the future, and into your browser tab.' : 'Nell stayed home. vax3 glows amber now.')}</p>
        </header>

        {game.legacy ? (
          <section className="tile legacy">
            <p className="tile-label">{t('Your words, left inside vax3')}</p>
            <p className="legacy-text">“{game.legacy}”</p>
            <p className="tile-note">{t('The next person who sneaks in will see them.')}</p>
          </section>
        ) : null}

        <section className="stats" aria-label="Your run">
          <div className="tile stat">
            <p className="stat-number">{learned.length}</p>
            <p className="tile-label">{t('spells learned')}</p>
          </div>
          <div className="tile stat">
            <p className="stat-number">{today}</p>
            <p className="tile-label">{t('still work today')}</p>
          </div>
          {/* Time and times eaten belong to the run that just ended, not a later visit. */}
          {game.ending !== null ? (
            <>
              <div className="tile stat">
                <p className="stat-number">{time}</p>
                <p className="tile-label">{t(time === 1 ? 'minute' : 'minutes')}</p>
              </div>
              <div className="tile stat">
                <p className="stat-number">{game.glitch}</p>
                <p className="tile-label">{t('times eaten')}</p>
              </div>
            </>
          ) : null}
        </section>

        <section className="tile" aria-label="Spells">
          <p className="tile-label">{t('Your spellbook')}</p>
          <ul className="chips">
            {learned.map((s) => (
              <li key={s.command} className={s.today ? 'chip' : 'chip retired'} title={t(s.name)}>
                <code>{s.command}</code>
                <span>{t(s.name)}</span>
              </li>
            ))}
          </ul>
          <p className="tile-note">{t('Grey ones are retired. The rest work in any Mac or Linux terminal today.')}</p>
        </section>

        <section aria-label="Lessons">
          <p className="section-title">{t('You saw through 6 tricks')}</p>
          <ol className="lessons">
            {LESSONS.map(([name, lesson], i) => (
              <li key={name} className="tile lesson">
                <span className="lesson-number">{i + 1}</span>
                <p className="lesson-name">{t(name)}</p>
                <p className="lesson-text">{t(lesson)}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="ending-buttons">
          {move && onChat ? (
            <button type="button" ref={chatRef} className="ending-button primary" onClick={onChat}>
              {t('Reply to Nell')}
            </button>
          ) : null}
          <button type="button" ref={backRef} className={move && onChat ? 'ending-button' : 'ending-button primary'} onClick={onBack}>
            {t('Back to the terminal')}
          </button>
          <button type="button" className="ending-button" onClick={onPlayAgain}>
            {t('Play again')}
          </button>
        </div>

        <p className="ending-credits">hauntedserver-1987 · made for Kiroween 2026 with Kiro · Nell's voice: DeepSeek · VT323 font (OFL)</p>
      </div>
    </div>
  )
}
