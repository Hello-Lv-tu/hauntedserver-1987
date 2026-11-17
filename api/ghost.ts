/**
 * Vercel function: POST /api/ghost writes Nell's reply with DeepSeek.
 * All logic lives in src/ai/handler.ts (unit-tested); this only wires it up.
 * Needs the DEEPSEEK_API_KEY environment variable; without it the game falls
 * back to pre-written lines.
 */
import { createHandler } from '../src/ai/handler'

const handle = createHandler({
  fetch: (input, init) => fetch(input, init),
  env: process.env,
  now: () => Date.now(),
})

export default {
  fetch(request: Request) {
    return handle(request)
  },
}
