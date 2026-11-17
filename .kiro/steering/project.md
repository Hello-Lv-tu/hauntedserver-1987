---
inclusion: always
---

# Project: hauntedserver-1987

## What we are building

A browser game for the **Kiroween 2026** hackathon, **Resurrection** category.

The player is a 2026 intern asked to migrate data off a preserved disk image of
`vax3.cs.ravenmoor.edu`, a VAX running **4.3BSD** at the (fictional) Ravenmoor
University CS department. The machine's clock is frozen at
**Sat Oct 31 1987 23:59:59**, the night its student night operator,
Nell Voss (`nell`), disappeared. Her ghost is still in the machine: a
playful, mischievous little ghost who treats the player as a new playmate.

The player investigates using real Unix commands (`ls`, `cat`, `grep`, `ps`,
`finger`, `mail`, `last`, ...) to read logs, mail and process tables and work
out what happened. The ghost sends `write` messages, plays pranks on the
filesystem, sets riddles, and both helps and teases.

## Who it is for and why it matters

Target user: people learning the command line (students, bootcamp learners,
new developers). The game teaches real, transferable shell skills through a
mystery. Every feature should make that learning value visible: a command
progress tracker, an in-game `man`, and an end-of-game summary of commands
learned.

## Judging criteria (each 20%) — keep these in mind

1. Potential Impact: real users, real problem (learning the CLI).
2. Technological Implementation: deep, deliberate use of Kiro (specs,
   steering, hooks, property-based tests, MCP/powers where useful).
3. Design: a finished product, not a tech demo.
4. Innovation/Idea: period-accurate 4.3BSD details set us apart from generic
   "haunted terminal" projects.
5. Presentation: a 3-minute demo video must show a full play-through.

Submission must be in **English**: UI text, README, code comments.

## Tech stack

- React 19 + TypeScript (strict) + Vite.
- Tests: Vitest + fast-check (property-based tests).
- Lint: oxlint.
- Deploy: Vercel. The AI call goes through one serverless function under
  `api/` so the API key never reaches the browser.
- AI provider: not decided (Gemini or DeepSeek). Hide it behind a small
  `GhostVoice` interface so it can be swapped.

## Architecture rules

- **No real shell.** The filesystem and commands are simulated in the browser.
  Never execute user input anywhere.
- **The game engine is pure TypeScript with no React imports.** Put it under
  `src/engine/` (vfs, shell, commands). React lives only in `src/ui/`.
- **Story is deterministic.** Clues, file changes and ghost events are driven
  by a scripted state machine (`src/story/`). The AI only writes the ghost's
  *wording*. It never decides game state, never reveals clues the script has
  not unlocked, and the game must stay fully playable when the AI is
  unavailable (fall back to pre-written lines).
- The serverless function must validate input, cap message length, and
  rate-limit per client. The live site must survive judging until
  2027-01-29 on a small budget.
- Prefer small pure functions that return results over throwing. Engine code
  returns `{ ok: true, value } | { ok: false, error }` style results.

## Code organization

```
src/engine/vfs/       virtual filesystem
src/engine/shell/     tokenizer, pipeline, session, command registry
src/engine/commands/  one file per command
src/engine/man/       man page text
src/story/            scripted story state machine and seed filesystem
src/ui/               React components (terminal, CRT effects, progress)
api/                  Vercel serverless functions
```

Tests sit next to the code as `*.test.ts`; property-based tests as
`*.prop.test.ts`.
