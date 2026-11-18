# Tasks: Nell's AI voice

- [x] 1. Shared AI modules (`src/ai/`)
  - [x] 1.1 `request.ts` types and validation, with tests.
  - [x] 1.2 `beats.ts` server-side beat lookup.
  - [x] 1.3 `prompt.ts` system/user messages, with tests.
  - [x] 1.4 `sanitize.ts`, with unit and property tests.
  - _Requirements: 1.3, 1.4, 2.1–2.4_

- [x] 2. Server function `api/ghost.ts`
  - [x] 2.1 POST handler, size limit, validation, rate limit, timeout.
  - [x] 2.2 DeepSeek call; missing key → `{ lines: null }`.
  - [x] 2.3 Handler tests with a fake fetch.
  - _Requirements: 2.2, 3.1, 3.3, 4.1, 5.1, 5.2_

- [x] 3. Game integration
  - [x] 3.1 `nellVoice` effect for chatter; `chats` counter in story state.
  - [x] 3.2 `pendingVoices`, `chatLog`, `voice` input in the game.
  - [x] 3.3 Tests for pending/resolve/fallback; property tests still pass.
  - _Requirements: 1.1, 1.2, 4.2_

- [x] 4. UI
  - [x] 4.1 `useNellVoice` hook (one request at a time, failure → fallback).
  - [x] 4.2 "(nell is writing...)" label.
  - _Requirements: 3.2, 4.1, 4.3_

- [x] 5. Docs and checkpoint
  - [x] 5.1 README: configuring `DEEPSEEK_API_KEY`; works without it.
  - [x] 5.2 `npm run check` passes; after deploy, verify a real reply on the
    preview URL. (Verified on production, 2026-11-18.)
  - _Requirements: 5.3_
