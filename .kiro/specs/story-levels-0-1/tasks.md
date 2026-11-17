# Tasks: Story engine, Level 0 and Level 1

- [ ] 1. Process table and commands
  - [ ] 1.1 `src/engine/procs/` types, seed `procs.json`, add `procs` to
    `CommandCtx` / `CommandOutput` / `ExecResult`.
  - [ ] 1.2 `ps` (plain and `aux`), `kill`, `who` with 4.3BSD formats, man pages.
  - [ ] 1.3 Unit tests.
  - _Requirements: 3.1–3.5_

- [ ] 2. `write` command and write mode
  - [ ] 2.1 `write` command with usage and "not logged on" errors, man page.
  - [ ] 2.2 Mode change in `ExecResult`; message formatting helper.
  - _Requirements: 2.1–2.5_

- [ ] 3. Story engine core
  - [ ] 3.1 Types (`StoryInput`, `Effect`, `Beat`), `storyStep`, hints.
  - [ ] 3.2 `readsFile` / `ranCommand` matchers using command events.
  - [ ] 3.3 Lines file with at least two variants per beat.
  - _Requirements: 1.1, 1.2, 2.6, 4.5_

- [ ] 4. Level 0
  - [ ] 4.1 Seed `~/.from_nell`; beats `sos`, `hunt`, `read`.
  - [ ] 4.2 Beat unit tests.
  - _Requirements: 4.1–4.5_

- [ ] 5. Level 1
  - [ ] 5.1 Beats, popup state, countdown, close-and-return, eaten/restart.
  - [ ] 5.2 Scareware lesson card and "to be continued".
  - [ ] 5.3 Beat unit tests.
  - _Requirements: 5.1–5.6, 8.4, 9.1_

- [ ] 6. Game glue `src/game/`
  - [ ] 6.1 `GameState`, `step`, effect application.
  - [ ] 6.2 Spell detection and cards.
  - [ ] 6.3 Save/load with validation.
  - [ ] 6.4 Property tests 1–4 and the scripted play-through.
  - _Requirements: 1.3, 1.4, 6.1, 7.1–7.3_

- [ ] 7. UI
  - [ ] 7.1 Replace the terminal reducer with `game.step`; write-mode prompt;
    Ctrl-D; Nell and Jack line styles.
  - [ ] 7.2 `JackPopup` (accessible, deliberately modern style).
  - [ ] 7.3 Cards, Spellbook panel, `spellbook` command.
  - [ ] 7.4 Continue / new game screen; remove the dev-build line.
  - [ ] 7.5 Settings button and panel (popup countdown 60 s / 30 s), saved
    to localStorage, with tests for load validation.
  - _Requirements: 4.1, 5.1, 5.7, 6.1–6.3, 7.2, 8.1–8.4, 9.2_

- [ ] 8. Checkpoint
  - `npm run check` passes.
  - Play Levels 0–1 in a browser, including getting eaten once and reloading
    mid-level.
