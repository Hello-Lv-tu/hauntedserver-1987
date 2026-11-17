import type { ScreenLine } from '../../game/types.js'
import { JackMascot } from './Jack.js'
import { jackMoodOf, nellMoodOf } from './moods.js'
import { NellSprite } from './Nell.js'
import { lastJackLine, lastNellMessage } from './screen.js'
import './characters.css'



/**
 * Nell floats in beside the terminal for a few seconds whenever she writes.
 * Keyed by message id, so each message replays the CSS animation once.
 */
export function NellPresence({ screen }: { screen: readonly ScreenLine[] }) {
  const message = lastNellMessage(screen)
  if (message === null) return null
  return (
    <div key={message.id} className="presence presence-nell" aria-hidden="true">
      <NellSprite mood={nellMoodOf(message.text)} size={72} />
    </div>
  )
}

/** Jack slides in like a push notification; when beaten, he shatters. */
export function JackPresence({ screen }: { screen: readonly ScreenLine[] }) {
  const line = lastJackLine(screen)
  if (line === null) return null
  const mood = jackMoodOf(line.text)
  if (mood === 'angry') {
    // Four quarters of him fly apart: the modern mascot breaks into pieces.
    return (
      <div key={line.id} className="presence presence-jack shatter" aria-hidden="true">
        {(['tl', 'tr', 'bl', 'br'] as const).map((q) => (
          <span key={q} className={`shard shard-${q}`}>
            <JackMascot mood="angry" size={84} />
          </span>
        ))}
      </div>
    )
  }
  return (
    <div key={line.id} className="presence presence-jack" aria-hidden="true">
      <JackMascot mood={mood} size={84} />
    </div>
  )
}
