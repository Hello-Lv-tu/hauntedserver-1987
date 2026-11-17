import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types.js'
import { SPELLS } from '../story/spells.js'
import './ending.css'

const LESSONS = [
  ['Scareware', "Real warnings don't count down or beg you to click."],
  ['Phishing', 'Check the real sender; nobody needs your password by mail.'],
  ['Ransomware', "Don't pay first. Look at what really happened, and keep backups."],
  ['AI can be wrong', "Don't run advice you don't understand. Check the manual."],
  ['Faked records', 'Compare with an independent copy before you believe it.'],
  ['Persistence', 'If it keeps coming back, find what restarts it.'],
] as const

interface EndScreenProps {
  game: GameState
  onBack: () => void
  onPlayAgain: () => void
}

function duration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

/**
 * The ending: Move fades the CRT to white and shows Nell's first message in
 * a modern UI; Stay keeps the amber terminal. Then the summary.
 */
export function EndScreen({ game, onBack, onPlayAgain }: EndScreenProps) {
  const backRef = useRef<HTMLButtonElement>(null)
  // Captured once, when the ending appears.
  const [now] = useState(() => Date.now())
  useEffect(() => {
    // Keep Nell's message at the top in view; focus without scrolling to the buttons.
    backRef.current?.focus({ preventScroll: true })
  }, [])

  const learned = SPELLS.filter((s) => game.spells.includes(s.command))
  const today = learned.filter((s) => s.today).length
  const move = game.ending === 'move'

  return (
    <div className={`ending ending-${game.ending}`} role="dialog" aria-modal="true" aria-labelledby="ending-title">
      {move ? <div className="ending-whiteout" aria-hidden="true" /> : null}
      <div className="ending-sheet">
        {move ? (
          <div className="modern-message">
            <p className="modern-from">Nell · just now</p>
            <p>whoa. am i in 2026?? why are all the buttons ROUND??</p>
            <p>and this font is so... soft :-P</p>
            <p>thank you, partner.</p>
          </div>
        ) : null}

        <h1 id="ending-title" className="ending-title">
          {move ? 'Ending: Moved to 2026' : 'Ending: The guardian of vax3'}
        </h1>

        {game.legacy ? (
          <p className="ending-legacy">
            Your words are now part of vax3. The next person who sneaks in will see them:
            <br />
            <q>{game.legacy}</q>
          </p>
        ) : null}

        <section aria-label="Spells">
          <h2>
            You learned {learned.length} spells. {today} of them still work on a Mac or Linux machine today.
          </h2>
          <ul className="ending-spells">
            {learned.map((s) => (
              <li key={s.command}>
                <code>{s.command}</code> {s.name}
                {s.today ? '' : ' (retired)'}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Lessons">
          <h2>You saw through 6 tricks</h2>
          <ul className="ending-lessons">
            {LESSONS.map(([name, lesson]) => (
              <li key={name}>
                <strong>{name}:</strong> {lesson}
              </li>
            ))}
          </ul>
        </section>

        <p className="ending-stats">
          Time: {duration(now - game.startedAt)} · Eaten by Jack: {game.glitch} time{game.glitch === 1 ? '' : 's'}
        </p>
        <p className="ending-credits">
          hauntedserver-1987 · made for Kiroween 2026 with Kiro · Nell's voice: DeepSeek · font: VT323 (OFL)
        </p>

        <div className="ending-buttons">
          <button type="button" ref={backRef} className="ending-button" onClick={onBack}>
            Back to the terminal
          </button>
          <button type="button" className="ending-button" onClick={onPlayAgain}>
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}
