# Tasks: Story engine, Level 0 and Level 1

- [x] 1. Process table and commands
  - [x] 1.1 `src/engine/procs/` types, seed `procs.json`, add `procs` to
    `CommandCtx` / `CommandOutput` / `ExecResult`.
  - [x] 1.2 `ps` (plain and `aux`), `kill`, `who` with 4.3BSD formats, man pages.
  - [x] 1.3 Unit tests.
  - _Requirements: 3.1–3.5_

- [x] 2. `write` command and write mode
  - [x] 2.1 `write` command with usage and "not logged on" errors, man page.
  - [x] 2.2 Mode change in `ExecResult`; message formatting helper.
  - _Requirements: 2.1–2.5_

- [x] 3. Story engine core
  - [x] 3.1 Types (`StoryInput`, `Effect`, `Beat`), `storyStep`, hints.
  - [x] 3.2 `readsFile` / `ranCommand` matchers using command events.
  - [x] 3.3 Lines file with at least two variants per beat.
  - _Requirements: 1.1, 1.2, 2.6, 4.5_

- [x] 4. Level 0
  - [x] 4.1 Seed `~/.from_nell`; beats `sos`, `hunt`, `read`.
  - [x] 4.2 Beat unit tests.
  - _Requirements: 4.1–4.5_

- [x] 5. Level 1
  - [x] 5.1 Beats, popup state, countdown, close-and-return, eaten/restart.
  - [x] 5.2 Scareware lesson card and "to be continued".
  - [x] 5.3 Beat unit tests.
  - _Requirements: 5.1–5.6, 8.4, 9.1_

- [x] 6. Game glue `src/game/`
  - [x] 6.1 `GameState`, `step`, effect application.
  - [x] 6.2 Spell detection and cards.
  - [x] 6.3 Save/load with validation.
  - [x] 6.4 Property tests 1–4 and the scripted play-through.
  - _Requirements: 1.3, 1.4, 6.1, 7.1–7.3_

- [x] 7. UI
  - [x] 7.1 Replace the terminal reducer with `game.step`; write-mode prompt;
    Ctrl-D; Nell and Jack line styles.
  - [x] 7.2 `JackPopup` (accessible, deliberately modern style).
  - [x] 7.3 Cards, Spellbook panel, `spellbook` command.
  - [x] 7.4 Continue / new game screen; remove the dev-build line.
  - [x] 7.5 Settings button and panel (popup countdown 60 s / 30 s), saved
    to localStorage, with tests for load validation.
  - _Requirements: 4.1, 5.1, 5.7, 6.1–6.3, 7.2, 8.1–8.4, 9.2_

- [x] 8. Checkpoint
  - `npm run check` passes.
  - Play Levels 0–1 in a browser, including getting eaten once and reloading
    mid-level.
