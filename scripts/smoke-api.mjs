// Loads the compiled Vercel function with plain Node ESM (as Vercel runs it)
// and sends requests without an API key. Catches module-resolution crashes
// like FUNCTION_INVOCATION_FAILED before they reach production.
const mod = await import('../node_modules/.tmp/api/api/ghost.js')
delete process.env.DEEPSEEK_API_KEY

const requests = [
  // A level beat, and the postgame chat after the Move ending.
  { level: 0, beat: 'hunt', chats: 1, text: 'hi', history: [] },
  { level: 8, beat: 'end', chats: 1, text: 'hi', history: [{ from: 'nell', text: 'hi!!' }], ending: 'move', keepsake: true },
]
for (const body of requests) {
  const response = await mod.default.fetch(
    new Request('https://local.test/api/ghost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
  const data = await response.json()
  if (response.status !== 200 || data.lines !== null) {
    console.error('api smoke test failed', body.beat, response.status, data)
    process.exit(1)
  }
}
console.log('api smoke test ok')
