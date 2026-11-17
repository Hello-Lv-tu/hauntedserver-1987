# Tasks: Virtual filesystem and shell

- [x] 1. Test tooling
  - Add Vitest and fast-check as dev dependencies; add `test` (`vitest --run`)
    and `test:watch` scripts.
  - Add a smoke test so `npm test` passes.
  - _Requirements: all (enables testing)_

- [x] 2. VFS types, seed loader and validation
  - [x] 2.1 Create `src/engine/vfs/types.ts` with the data model from the design.
  - [x] 2.2 Implement `loadSeed` with validation (duplicate names, invalid modes)
    and unit tests.
  - [x] 2.3 Create a small development seed `src/story/seed/dev.json`
    (`/etc/passwd`, `/usr/users/guest`, `/usr/users/nell` with a `.plan`
    and one unreadable file, `/usr/adm/messages`).
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Path resolution
  - [x] 3.1 Implement `normalize` and `resolve` (`.`, `..`, `~`, `~user`, slashes).
  - [x] 3.2 Property tests 1 and 2 (normalize idempotent and well-formed).
  - [x] 3.3 Unit tests for ENOENT and ENOTDIR.
  - _Requirements: 2.1–2.4_

- [x] 4. Permissions and read API
  - [x] 4.1 Implement `canRead`, `readFile`, `listDir`, `stat`.
  - [x] 4.2 Unit tests including root bypass.
  - _Requirements: 3.1–3.3_

- [x] 5. Immutable write API for the story engine
  - [x] 5.1 Implement `write` and `remove` with structural sharing.
  - [x] 5.2 Property test 8 (original instance unchanged).
  - _Requirements: 1.4_

- [x] 6. Tokenizer
  - [x] 6.1 Implement the quote/escape state machine, pipes and unsupported
    operator detection.
  - [x] 6.2 Unit tests for `Unmatched '.` / `Unmatched ".`.
  - [x] 6.3 Property test 3 (round-trip).
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 7. `execute`, sessions, pipelines and command events
  - [x] 7.1 Implement `execute` with the panic fallback, pipelines, history and
    events.
  - [x] 7.2 `parseFlags` helper with usage errors.
  - [x] 7.3 Unknown-command handling and the modern-commands hint table.
  - [x] 7.4 Property test 5 (never throws, never panics).
  - _Requirements: 4.3, 4.6, 4.7, 5.7, 6.1, 6.2, 8.1, 8.2_

- [x] 8. Navigation commands: `ls`, `cd`, `pwd`
  - [x] 8.1 Implement with 4.3BSD formats (`ls -l` without group unless `-g`).
  - [x] 8.2 Unit tests for formats and errors; property test 6 (cd then pwd).
  - _Requirements: 5.1, 5.2_

- [x] 9. Reading commands: `cat`, `more`, `head`, `tail`, `wc`, `grep`
  - [x] 9.1 Implement, all reading from files or stdin.
  - [x] 9.2 Unit tests; property test 4 (grep partition) and
    property test 7 (no leaks of unreadable files).
  - _Requirements: 3.3, 5.1, 5.3, 5.4_

- [x] 10. Misc commands: `echo`, `date`, `whoami`, `history`, `clear`, `help`
  - _Requirements: 5.1, 5.5, 5.6, 8.2_

- [x] 11. man pages
  - [x] 11.1 Write pages for every implemented command, each with a MODERN NOTE.
  - [x] 11.2 Test that every registry command has a page.
  - _Requirements: 7.1, 7.2_

- [x] 12. Terminal UI
  - [x] 12.1 `Terminal.tsx` with reducer, scrollback, prompt, focus handling.
  - [x] 12.2 History navigation and Tab completion in `ui/completion.ts`, with
    unit tests.
  - [x] 12.3 Styles for stdout/stderr/hint, reduced-motion, screen reader
    support.
  - [x] 12.4 Wire into `App.tsx` with the dev seed.
  - _Requirements: 9.1–9.5_

- [x] 13. Checkpoint
  - Run `npm run lint`, `npm test` and `npm run build`; all must pass.
  - Manually play: `cd ~nell; ls -la; cat .plan; grep -n ttyh3 /usr/adm/messages | head -3`.
