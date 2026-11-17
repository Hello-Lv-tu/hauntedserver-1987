# Design: Nell's AI voice

## Flow

```
player writes "what should i do next?"
  │
  ▼  game.step (pure)
story: beat chatter → Effect { type: 'nellVoice', fallback, level, beat }
game:  push PendingVoice { id, request, fallback } ; nothing printed yet
  │
  ▼  UI (useEffect on the first pending voice)
POST /api/ghost  { level, beat, chats, text, history }      ≤ 6 s
  │                      │
  │ ok: { lines }        │ error / timeout / { lines: null }
  ▼                      ▼
step({ type: 'voice', id, lines })   step({ type: 'voice', id, lines: null })
game prints lines, or the fallback, as a normal write message
```

## Shared, pure modules — `src/ai/`

- `prompt.ts`: `buildMessages(request, beatInfo)` returns the system and user
  messages. The system message is a condensed version of
  `.kiro/steering/ghost-persona.md` plus the beat's goal and allowed hints.
- `sanitize.ts`: `sanitizeReply(text): string[] | null`: strip quotes and
  "nell:" prefixes, drop emoji, split into lines, keep 3 lines and 200
  characters, reject AI/model/URL mentions.
- `request.ts`: `VoiceRequest` type and `parseVoiceRequest(unknown)`
  validation (Requirement 2.2).
- `beats.ts`: `beatInfo(level, beat)` looks up the level title and the beat's
  hints from `src/story/` so the server never trusts browser-sent facts.

All four are unit-tested in Vitest; the server is a thin wrapper.

## Server — `api/ghost.ts`

```ts
export default {
  async fetch(request: Request): Promise<Response>
}
```

1. Only `POST`; JSON body ≤ 4 KB.
2. Rate limit by `x-forwarded-for` (in-memory Map per instance).
3. `parseVoiceRequest` → 400 on failure.
4. No `DEEPSEEK_API_KEY` → `{ lines: null }` (200), so the browser falls back.
5. Call `https://api.deepseek.com/chat/completions` with
   `model`, `messages`, `max_tokens: 120`, `temperature: 0.9`,
   `thinking: { type: 'disabled' }`, `AbortSignal.timeout(6000)`.
6. `sanitizeReply` → `{ lines }` or `{ lines: null }`.

Errors are logged without the player's text.

## Game changes

```ts
interface PendingVoice { id: number; request: VoiceRequest; fallback: string[] }
GameState.pendingVoices: PendingVoice[]
GameState.chatLog: { from: 'player' | 'nell'; text: string }[]   // last 8
GameInput |= { type: 'voice'; id: number; lines: string[] | null }
StoryState.chats: number   // messages written in the current beat
```

- The story's chatter paths emit `nellVoice` instead of `nell`.
- `applyEffects` on `nellVoice` appends a pending voice (fallback included).
- `step` on `voice` removes it and prints `lines ?? fallback` as a Nell message.
- Leaving or restarting a level (eaten) keeps pending voices; they still print.

## UI

`useNellVoice(game, send)`: when `pendingVoices[0]` changes, POST it; on any
failure dispatch `lines: null`. The write-mode label shows
`(nell is writing...)` while a voice is pending. In development without the
server (`npm run dev`), the request fails and fallbacks are used.

## Testing

- `sanitize` unit tests and a property test: output always ≤ 3 lines,
  < 200 characters, no emoji, for any input.
- `parseVoiceRequest` rejects bad shapes; property test with random JSON.
- `buildMessages` includes the beat goal and hints, never the third hint
  before `chats >= 3`.
- Game tests: chatter creates a pending voice; resolving with lines prints
  them; resolving with null prints the fallback.
- `api/ghost.ts` handler tested with a fake `fetch` (no network).
