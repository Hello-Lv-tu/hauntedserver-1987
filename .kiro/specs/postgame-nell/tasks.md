# Tasks: talking to Nell after the ending

- [x] 1. Steering: postgame sections in `story.md` and `ghost-persona.md`;
  persistence rule in `project.md`.

- [x] 2. Server side (`src/ai/`)
  - [x] 2.1 `ending` / `keepsake` request fields and `fitVoiceRequest`.
  - [x] 2.2 Server-owned Stay and Move contexts; postgame prompt.
  - [x] 2.3 Reject `ending` outside the epilogue beat; smoke test both.
  - _Requirements: 2.1–2.4, 3.1, 3.2_

- [x] 3. Game (`src/game/`, `src/story/`)
  - [x] 3.1 `postgame.ts` chat model, storage parsing.
  - [x] 3.2 Postgame lines and `.plan` files; fallbacks for both channels.
  - [x] 3.3 `chat` input, chat-targeted voices, Stay recording, revisits.
  - _Requirements: 1.1–1.5, 3.3–3.5, 4.1–4.3_

- [x] 4. UI (`src/ui/`)
  - [x] 4.1 `NellChat` messenger window and styles.
  - [x] 4.2 Toolbar button, unread dot, ending-screen button, persistence.
  - [x] 4.3 Chinese for every new string.
  - _Requirements: 1.2, 5.1–5.4_

- [x] 5. Tests, docs and checkpoint
  - [x] 5.1 Regression tests (see design).
  - [x] 5.2 README and `docs/KIRO.md`.
  - [x] 5.3 `npm run check` passes.
