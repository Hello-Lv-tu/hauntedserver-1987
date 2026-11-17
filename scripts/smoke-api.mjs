// Loads the compiled Vercel function with plain Node ESM (as Vercel runs it)
// and sends one request without an API key. Catches module-resolution
// crashes like FUNCTION_INVOCATION_FAILED before they reach production.
const mod = await import('../node_modules/.tmp/api/api/ghost.js')
delete process.env.DEEPSEEK_API_KEY
const response = await mod.default.fetch(
  new Request('https://local.test/api/ghost', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ level: 0, beat: 'hunt', chats: 1, text: 'hi', history: [] }),
  }),
)
const body = await response.json()
if (response.status !== 200 || body.lines !== null) {
  console.error('api smoke test failed', response.status, body)
  process.exit(1)
}
console.log('api smoke test ok')
