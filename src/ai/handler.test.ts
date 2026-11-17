import { describe, expect, it, vi } from 'vitest'
import { DEEPSEEK_URL, createHandler } from './handler'
import { RateLimiter } from './rateLimit'

const body = { level: 0, beat: 'hunt', chats: 1, text: 'what now?', history: [] }

const post = (data: unknown, headers: Record<string, string> = {}) =>
  new Request('https://example.test/api/ghost', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4', ...headers },
    body: typeof data === 'string' ? data : JSON.stringify(data),
  })

const providerReply = (content: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }))

function setup(fetchImpl: ReturnType<typeof vi.fn>, env: Record<string, string> = { DEEPSEEK_API_KEY: 'sk-test' }) {
  const log = vi.fn()
  const handle = createHandler({ fetch: fetchImpl as unknown as typeof fetch, env, now: () => 0, log, limiter: new RateLimiter({ perMinute: 2, perDay: 100 }) })
  return { handle, log }
}

describe('/api/ghost handler', () => {
  it('calls DeepSeek with the key, model and capped output, and returns sanitized lines', async () => {
    const fetchImpl = providerReply('"Nell: psst... `ls -a` 👻"')
    const { handle } = setup(fetchImpl)
    const response = await handle(post(body))
    expect(await response.json()).toEqual({ lines: ['psst... `ls -a`'] })

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(DEEPSEEK_URL)
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-test')
    const sent = JSON.parse(init.body as string)
    expect(sent.model).toBe('deepseek-flash')
    expect(sent.max_tokens).toBe(120)
    expect(sent.messages[0].role).toBe('system')
  })

  it('returns lines: null without a key, so the game uses its fallback', async () => {
    const fetchImpl = providerReply('hi')
    const { handle } = setup(fetchImpl, {})
    expect(await (await handle(post(body))).json()).toEqual({ lines: null })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns lines: null when the provider fails or answers out of character', async () => {
    expect(await (await setup(providerReply('x', 500)).handle(post(body))).json()).toEqual({ lines: null })
    expect(await (await setup(providerReply('As an AI, I cannot')).handle(post(body))).json()).toEqual({ lines: null })
    const throwing = vi.fn(async () => {
      throw new DOMException('timeout', 'TimeoutError')
    })
    const { handle, log } = setup(throwing)
    expect(await (await handle(post(body))).json()).toEqual({ lines: null })
    expect(log.mock.calls[0][0]).toContain('TimeoutError')
    expect(log.mock.calls[0][0]).not.toContain('what now')
  })

  it('rejects bad requests without calling the provider', async () => {
    const fetchImpl = providerReply('hi')
    const { handle } = setup(fetchImpl)
    expect((await handle(new Request('https://example.test/api/ghost'))).status).toBe(405)
    expect((await handle(post('{not json'))).status).toBe(400)
    expect((await handle(post({ ...body, beat: 'made-up' }))).status).toBe(400)
    expect((await handle(post({ ...body, text: 'x'.repeat(5000) }))).status).toBe(413)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rate-limits per client', async () => {
    const { handle } = setup(providerReply('hi :-)'))
    await handle(post(body))
    await handle(post(body))
    expect((await handle(post(body))).status).toBe(429)
    expect((await handle(post(body, { 'x-forwarded-for': '5.6.7.8' }))).status).toBe(200)
  })
})
