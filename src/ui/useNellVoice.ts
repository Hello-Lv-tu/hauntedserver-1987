import { useEffect } from 'react'
import { sanitizeReply } from '../ai/sanitize'
import type { GameInput, PendingVoice } from '../game/types'

export const VOICE_ENDPOINT = '/api/ghost'
/** A little longer than the server's own provider timeout. */
const CLIENT_TIMEOUT_MS = 8000

/** Accept only `{ lines: string[] }`, re-sanitized (defense in depth). */
function linesFrom(data: unknown): string[] | null {
  if (typeof data !== 'object' || data === null) return null
  const lines = (data as { lines?: unknown }).lines
  if (!Array.isArray(lines) || !lines.every((l) => typeof l === 'string')) return null
  return sanitizeReply(lines.join('\n'))
}

/**
 * Resolve the oldest pending voice request, one at a time. Any failure
 * (no server in `npm run dev`, no key, timeout, rate limit) resolves it with
 * null so the game prints Nell's pre-written fallback.
 */
export function useNellVoice(pending: PendingVoice | undefined, send: (input: GameInput) => void) {
  const id = pending?.id
  const body = pending ? JSON.stringify(pending.request) : null

  useEffect(() => {
    if (id === undefined || body === null) return
    let cancelled = false
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)

    fetch(VOICE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!cancelled) send({ type: 'voice', id, lines: linesFrom(data) })
      })
      .catch(() => {
        // Cleanup aborts (e.g. React StrictMode re-running effects) must not resolve.
        if (!cancelled) send({ type: 'voice', id, lines: null })
      })
      .finally(() => window.clearTimeout(timer))

    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [id, body, send])
}
