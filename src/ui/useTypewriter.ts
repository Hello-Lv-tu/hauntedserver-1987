import { useCallback, useEffect, useState } from 'react'
import type { ScreenLine } from '../game/types.js'

/** About 2400 baud: fast enough to read along, slow enough to feel 1987. */
const BASE_CPS = 240
/** Long output (ps aux, man pages) never takes longer than this. */
const MAX_SECONDS = 1.6

const lengthOf = (line: ScreenLine) => Math.max(1, [...line.text].length)

export interface Typed {
  /** Lines fully shown. */
  shown: ScreenLine[]
  /** The line being typed, with how much of it is visible. */
  typing: { line: ScreenLine; visible: string } | null
  /** Show everything now (any key press). */
  skip: () => void
}

/**
 * Reveal new screen lines character by character, like a slow 1987 serial
 * line. Lines already on screen when the terminal mounts appear at once.
 */
export function useTypewriter(lines: readonly ScreenLine[], enabled: boolean): Typed {
  const lastId = lines.length > 0 ? lines[lines.length - 1].id : -1
  const [done, setDone] = useState(lastId)
  const [chars, setChars] = useState(0)

  const pending = enabled ? lines.filter((l) => l.id > done) : []
  const pendingKey = pending.length > 0 ? `${pending[0].id}-${lastId}` : ''

  useEffect(() => {
    if (pendingKey === '') return
    const total = pending.reduce((sum, l) => sum + lengthOf(l), 0)
    const cps = Math.max(BASE_CPS, total / MAX_SECONDS)
    let progress = chars
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      progress += ((now - last) / 1000) * cps
      last = now
      if (progress >= total) {
        setDone(lastId)
        setChars(0)
        return
      }
      setChars(Math.floor(progress))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // Restart only when new lines arrive; `chars` is read as the start point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey])

  const skip = useCallback(() => {
    setDone(lastId)
    setChars(0)
  }, [lastId])

  if (pending.length === 0) return { shown: [...lines], typing: null, skip }

  // Walk the pending lines until the cursor position.
  const shown = lines.filter((l) => l.id <= done)
  let left = chars
  for (const line of pending) {
    const length = lengthOf(line)
    if (left >= length) {
      shown.push(line)
      left -= length
      continue
    }
    return { shown, typing: { line, visible: [...line.text].slice(0, left).join('') }, skip }
  }
  return { shown, typing: null, skip }
}
