import { beatInfo } from './beats.js'
import { buildMessages } from './prompt.js'
import { RateLimiter } from './rateLimit.js'
import { parseVoiceRequest } from './request.js'
import { sanitizeReply } from './sanitize.js'

export const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
export const DEFAULT_MODEL = 'deepseek-flash'
const MAX_BODY_BYTES = 4096
const PROVIDER_TIMEOUT_MS = 6000

export interface HandlerDeps {
  fetch: typeof fetch
  env: Readonly<Record<string, string | undefined>>
  now: () => number
  limiter?: RateLimiter
  log?: (message: string) => void
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

/** `{ lines: null }` means "use your fallback line"; the browser never sees errors in detail. */
const noReply = () => json({ lines: null })

/**
 * POST /api/ghost: write Nell's reply to one player message.
 * Pure apart from the injected fetch, so it is unit-tested without network.
 */
export function createHandler(deps: HandlerDeps) {
  const limiter = deps.limiter ?? new RateLimiter()
  const log = deps.log ?? ((m: string) => console.warn(m))

  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)

    const raw = await request.text()
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ error: 'too large' }, 413)

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return json({ error: 'bad json' }, 400)
    }
    const voice = parseVoiceRequest(body)
    if (voice === null) return json({ error: 'bad request' }, 400)
    const beat = beatInfo(voice.level, voice.beat)
    if (beat === null) return json({ error: 'unknown beat' }, 400)

    const client = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
    if (!limiter.allow(client, deps.now())) return json({ lines: null, limited: true }, 429)

    const key = deps.env.DEEPSEEK_API_KEY
    if (!key) return noReply()

    try {
      const response = await deps.fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: deps.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
          messages: buildMessages(voice, beat),
          max_tokens: 120,
          temperature: 0.9,
          thinking: { type: 'disabled' },
          stream: false,
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      })
      if (!response.ok) {
        // Never log the player's text or the key; status is enough to debug.
        log(`ghost: provider returned ${response.status}`)
        return noReply()
      }
      const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] }
      const content = data.choices?.[0]?.message?.content
      if (typeof content !== 'string') return noReply()
      return json({ lines: sanitizeReply(content) })
    } catch (error) {
      log(`ghost: provider call failed (${error instanceof Error ? error.name : 'unknown'})`)
      return noReply()
    }
  }
}
