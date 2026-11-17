---
inclusion: always
---

# Project: hauntedserver-1987

## What we are building

A browser game for the **Kiroween 2026** hackathon, **Resurrection** category.

A 2026 student sneaks into a haunted basement machine room at the (fictional)
Ravenmoor University and finds one terminal still glowing: `vax3`, a VAX
running **4.3BSD**, clock frozen at **Sat Oct 31 1987 23:59:59**. Nell, a
playful little ghost trapped inside, is calling for help. She has been
trapped by **Jack-o'-Daemon**, a pumpkin-headed spirit living in a modern
"auto-modernization agent" that wants to delete everything legacy.

The player talks to Nell through old Unix channels Jack cannot see (`write`,
`talk`, `.plan`, mail, `cron`) and uses real commands plus their 2026
know-how to see through Jack's modern tricks and defeat it.

The full story, levels and endings are in `story.md`. Follow it.

## Who it is for and why it matters

Target user: people learning the command line (students, bootcamp learners,
new developers). The game teaches two things through a story:

1. Real, transferable shell commands.
2. Spotting everyday digital traps: scareware, phishing, ransomware, AI that
   makes things up, tampered records.

Every feature should make that learning value visible: the Spellbook
(command progress), an in-game `man`, and an end-of-game summary.

## Judging criteria (each 20%) — keep these in mind

1. Potential Impact: real users, real problem (learning the CLI).
2. Technological Implementation: deep, deliberate use of Kiro (specs,
   steering, hooks, property-based tests, MCP/powers where useful).
3. Design: a finished product, not a tech demo.
4. Innovation/Idea: period-accurate 4.3BSD details, "old tech as the secret
   channel vs. modern dark patterns", and digital-safety lessons set us
   apart from generic "haunted terminal" projects.
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
- **Persistence is local only.** Endings, Spellbook progress and the
  player's `.plan` are stored in `localStorage`. Never send player-written
  text to other players.
- **Story is deterministic.** Clues, file changes and ghost events are driven
  by a scripted state machine (`src/story/`). The AI only writes the ghost's
  *wording*. It never decides game state, never reveals clues the script has
  not unlocked, and the game must stay fully playable when the AI is
  unavailable (fall back to pre-written lines).
- The serverless function must validate input, cap message length, and
  rate-limit per client. The live site must survive judging until
  2027-01-29 on a small budget.
- **Relative imports end in `.js`** (`import { x } from './y.js'`), even for
  `.ts` files. Vercel runs `api/` as plain Node ES modules, which cannot
  resolve extensionless paths; this crashed the AI endpoint once
  (FUNCTION_INVOCATION_FAILED). `npm run check:api` guards it.
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
