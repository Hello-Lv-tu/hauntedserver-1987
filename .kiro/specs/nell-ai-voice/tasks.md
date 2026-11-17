# Tasks: Nell's AI voice

- [ ] 1. Shared AI modules (`src/ai/`)
  - [ ] 1.1 `request.ts` types and validation, with tests.
  - [ ] 1.2 `beats.ts` server-side beat lookup.
  - [ ] 1.3 `prompt.ts` system/user messages, with tests.
  - [ ] 1.4 `sanitize.ts`, with unit and property tests.
  - _Requirements: 1.3, 1.4, 2.1–2.4_

- [ ] 2. Server function `api/ghost.ts`
  - [ ] 2.1 POST handler, size limit, validation, rate limit, timeout.
  - [ ] 2.2 DeepSeek call; missing key → `{ lines: null }`.
  - [ ] 2.3 Handler tests with a fake fetch.
  - _Requirements: 2.2, 3.1, 3.3, 4.1, 5.1, 5.2_

- [ ] 3. Game integration
  - [ ] 3.1 `nellVoice` effect for chatter; `chats` counter in story state.
  - [ ] 3.2 `pendingVoices`, `chatLog`, `voice` input in the game.
  - [ ] 3.3 Tests for pending/resolve/fallback; property tests still pass.
  - _Requirements: 1.1, 1.2, 4.2_

- [ ] 4. UI
  - [ ] 4.1 `useNellVoice` hook (one request at a time, failure → fallback).
  - [ ] 4.2 "(nell is writing...)" label.
  - _Requirements: 3.2, 4.1, 4.3_

- [ ] 5. Docs and checkpoint
  - [ ] 5.1 README: configuring `DEEPSEEK_API_KEY`; works without it.
  - [ ] 5.2 `npm run check` passes; after deploy, verify a real reply on the
    preview URL.
  - _Requirements: 5.3_
