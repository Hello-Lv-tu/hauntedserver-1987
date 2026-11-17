import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types.js'
import { SPELLS } from '../story/spells.js'
import { GhostIcon } from './icons.js'
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
  onBack: () => void
  onPlayAgain: () => void
}

function minutes(ms: number): number {
  return Math.max(1, Math.round(ms / 60000))
}

/**
 * The ending. Move: the CRT fades to white and Nell, now a little ghost in a
 * 2026 chat app, types her first messages. Stay: the same layout in amber.
 */
export function EndScreen({ game, onBack, onPlayAgain }: EndScreenProps) {
  const backRef = useRef<HTMLButtonElement>(null)
  const [now] = useState(() => Date.now())
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true })
  }, [])

  const move = game.ending === 'move'
  const messages = move ? MOVE_MESSAGES : STAY_MESSAGES
  const learned = SPELLS.filter((s) => game.spells.includes(s.command))
  const today = learned.filter((s) => s.today).length
  const time = minutes(now - game.startedAt)

  return (
    <div className={`ending ending-${game.ending}`} role="dialog" aria-modal="true" aria-labelledby="ending-title">
      {move ? <div className="ending-whiteout" aria-hidden="true" /> : null}
      <div className="ending-sheet">
        <section className="chat" aria-label="Messages from Nell">
          <div className="chat-head">
            <span className="avatar">
              <GhostIcon size={44} />
            </span>
            <div>
              <p className="chat-name">Nell</p>
              <p className="chat-status">{move ? 'online · from 1987' : 'on vax3 · ttyp0'}</p>
            </div>
          </div>
          <div className="chat-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {messages.map((m, i) => (
            <p key={m} className="bubble" style={{ animationDelay: `${3.2 + i * 0.7}s` }}>
              {m}
            </p>
          ))}
        </section>

        <header className="ending-header">
          <p className="ending-kicker">Ending</p>
          <h1 id="ending-title" className="ending-title">
            {move ? 'Moved to 2026' : 'The guardian of vax3'}
          </h1>
          <p className="ending-sub">{move ? 'Nell rode a tape into the future, and into your browser tab.' : 'Nell stayed home. vax3 glows amber now.'}</p>
        </header>

        {game.legacy ? (
          <section className="tile legacy">
            <p className="tile-label">Your words, left inside vax3</p>
            <p className="legacy-text">“{game.legacy}”</p>
            <p className="tile-note">The next person who sneaks in will see them.</p>
          </section>
        ) : null}

        <section className="stats" aria-label="Your run">
          <div className="tile stat">
            <p className="stat-number">{learned.length}</p>
            <p className="tile-label">spells learned</p>
          </div>
          <div className="tile stat">
            <p className="stat-number">{today}</p>
            <p className="tile-label">still work today</p>
          </div>
          <div className="tile stat">
            <p className="stat-number">{time}</p>
            <p className="tile-label">{time === 1 ? 'minute' : 'minutes'}</p>
          </div>
          <div className="tile stat">
            <p className="stat-number">{game.glitch}</p>
            <p className="tile-label">times eaten</p>
          </div>
        </section>

        <section className="tile" aria-label="Spells">
          <p className="tile-label">Your spellbook</p>
          <ul className="chips">
            {learned.map((s) => (
              <li key={s.command} className={s.today ? 'chip' : 'chip retired'} title={s.today ? s.name : `${s.name} (retired)`}>
                <code>{s.command}</code>
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
          <p className="tile-note">Grey ones are retired. The rest work in any Mac or Linux terminal today.</p>
        </section>

        <section aria-label="Lessons">
          <p className="section-title">You saw through 6 tricks</p>
          <ol className="lessons">
            {LESSONS.map(([name, lesson], i) => (
              <li key={name} className="tile lesson">
                <span className="lesson-number">{i + 1}</span>
                <p className="lesson-name">{name}</p>
                <p className="lesson-text">{lesson}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="ending-buttons">
          <button type="button" ref={backRef} className="ending-button primary" onClick={onBack}>
            Back to the terminal
          </button>
          <button type="button" className="ending-button" onClick={onPlayAgain}>
            Play again
          </button>
        </div>

        <p className="ending-credits">hauntedserver-1987 · made for Kiroween 2026 with Kiro · Nell's voice: DeepSeek · VT323 font (OFL)</p>
      </div>
    </div>
  )
}
