# How we used Kiro

hauntedserver-1987 was built by one person who does not write code, working
with Kiro. The human decided what the game should be, played every build
(mostly on a phone) and reported what went wrong. Kiro wrote all of the code,
tests and documentation, and opened a pull request for each change. The repo
history shows the result: over 20 merged pull requests, each either a spec-driven feature
or a fix from a play-test.

Everything Kiro used lives in [`.kiro/`](../.kiro) at the repository root.

| Kiro feature | Where | What it did for this project |
|---|---|---|
| Steering | `.kiro/steering/` (4 files) | Kept the story, the ghost's personality and 1987 accuracy consistent across dozens of sessions |
| Specs | `.kiro/specs/` (4 specs) | Planned each large feature as requirements, design and tasks before any code |
| Hooks | `.kiro/hooks/` (4 hooks) | Ran tests and reviews automatically, so no change was handed back broken |
| Property-based tests | `*.prop.test.ts` (fast-check) | Proved that every level stays solvable and the shell never crashes, for any input |
| Vibe sessions | play-test fixes | Short conversational sessions turned each play-test report into a tested fix |

## Steering: one source of truth for the story and the rules

Four steering files are loaded into Kiro's context:

- **`project.md`** (always loaded): who the game is for, the judging criteria,
  the tech stack and the architecture rules. Examples: "No real shell. Never
  execute user input anywhere." "The game engine is pure TypeScript with no
  React imports." "The story is deterministic; the AI only writes the
  ghost's wording." It also records lessons learned. After the AI endpoint
  crashed on Vercel because of extensionless ES module imports, a rule was
  added here ("relative imports end in `.js`") together with a check script,
  so the mistake could not come back.
- **`story.md`** (always loaded): the story bible. Every level, its trick,
  the commands that beat it, the lesson, the endings and what the judges
  should see. When a level was built, Kiro worked from this table instead of
  inventing new plot.
- **`period-accuracy.md`** (always loaded): what a 4.3BSD system in 1987
  really had. `ls -l` shows the owner but not the group, `ps aux` needs no
  dash, mail lives in `/usr/spool/mail`, there is one system crontab, and
  there is no `sudo`, `less` or `/home`. It also states the exception: Jack's
  popups and assistant are modern on purpose, because the contrast is the
  point.
- **`ghost-persona.md`** (loaded only when story, mail, write or `api/` files
  are open, using `fileMatch`): Nell's voice (lowercase, ASCII smileys from
  1982, no emoji, at most 3 lines), her pranks, and the hard rule that splits
  knowledge between the characters. **Nell only knows 1987. She never says
  that something is a scam; the player brings the modern judgment.** The same
  file defines the safety rules for AI-written lines.

**Benefit:** the project ran across many separate sessions, but Nell sounds
like the same character in Level 0 and in the boss fight, and the machine
output stays 1987-accurate. A new session did not need the story explained
again.

## Specs: plan first, then build

Each large feature started as a spec with three documents: requirements in
EARS form ("WHEN ..., THE system SHALL ..."), a design, and a numbered task
list linked back to the requirements.

| Spec | What it covered |
|---|---|
| `vfs-and-shell` | The virtual filesystem, path rules, csh-style tokenizer, the first 16 commands and `man` |
| `story-levels-0-1` | The story state machine, `ps`/`kill`/`write`, Levels 0 and 1, Spellbook, saves, settings |
| `levels-2-5` | `finger`, `mail`, `chmod`, `rm`, `diff`, `last`, `su`, Levels 2 to 5 and the boss |
| `nell-ai-voice` | The AI voice: what the AI may and may not do, request limits, the server, fallbacks |

Examples of requirements that shaped the code:

- "WHEN any path component does not exist, THE system SHALL return a 'No
  such file or directory' error." (Real Unix errors, so what players learn
  transfers.)
- "THE AI SHALL NOT change story state, unlock clues, or decide whether a
  level is complete."
- "THE server SHALL build the prompt from story data it imports itself ...
  SHALL NOT accept prompt text, hints or facts from the browser."

**Benefit:** the design decisions were made once, written down, and reviewed
before code existed. The tasks list made progress visible to a
non-programmer: each pull request named the spec and the tasks it finished.

## Hooks: automatic checks on every change

| Hook | Trigger | Action |
|---|---|---|
| `test-on-save` | A `.ts`/`.tsx` file under `src/` is saved | Runs the Vitest + fast-check suite |
| `seed-check` | A story seed JSON file is saved | Loads every seed through the real validator; checks 80 columns and no emoji |
| `period-accuracy-review` | A file under `src/story/`, `src/engine/man/` or `src/engine/commands/` is saved | Asks the agent to review the change against the period-accuracy and story rules (no anachronisms, 4.3BSD output formats, 80 columns, all-ages tone) and fix problems |
| `check-before-stop` | The agent finishes a turn | Runs `npm run check`: lint, all tests, type-checked build and the API smoke test |

**Benefit:** a broken command, a malformed seed, or a line of in-world text
that mentions the web shows up the moment it is written, not when a player
finds it. `check-before-stop` means every result handed back to the human
had passed lint, 227 tests and a production build.

## Property-based testing: "every level is always solvable"

A text adventure with a real shell has a huge input space. Players type
anything, in any order. Example-based tests cannot cover that, so the key
guarantees are property tests with fast-check:

| Property | File |
|---|---|
| Path normalization is idempotent, always yields a well-formed absolute path, and `..` never climbs above `/` | `src/engine/vfs/path.prop.test.ts` |
| The shell never throws and never reaches its panic fallback, for random command lines | `src/engine/shell/execute.prop.test.ts` |
| After a successful `cd`, `pwd` prints the normalized path | `src/engine/shell/execute.prop.test.ts` |
| No command ever leaks the content of a file the player cannot read | `src/engine/shell/execute.prop.test.ts` |
| `grep -n p` and `grep -vn p` partition the input lines | `src/engine/commands/grep.prop.test.ts` |
| Every level completes even with random commands mixed in between the solution steps | `src/game/game.prop.test.ts` |
| From every story beat, the level can still be completed (no dead ends) | `src/game/game.prop.test.ts` |
| The game step function never throws, whatever the inputs and their order | `src/game/game.prop.test.ts` |
| AI replies after cleaning are always at most 3 lines, under 200 characters, with no emoji | `src/ai/ai.test.ts` |

**Benefit:** "no dead ends" is a design promise in `story.md`. The property
tests turn it into something checked on every save. The suite grew from 74
tests (first spec) to 168 (story levels) to 227 today.

## AI voice design: the AI writes words, the script decides

Nell's chat replies come from an AI model (DeepSeek, through one Vercel
function). The design came from the `nell-ai-voice` spec and the
`ghost-persona.md` steering file:

1. **The story is deterministic.** The scripted state machine in
   `src/story/` decides every clue, file change and level result. The AI only
   writes how Nell phrases her answer to what the player typed.
2. **The server owns the facts.** The browser sends only the level number,
   the beat id, a chat count, the player's text and recent chat. The server
   looks up the beat's goal and allowed hints from its own copy of the story
   and builds the prompt from the persona rules. A player cannot inject new
   facts.
3. **Hints are rationed.** The AI may nudge toward a command, and may give
   the full answer only after the player has asked three times in the same
   beat.
4. **Replies are cleaned.** `sanitize.ts` strips names and quotes, removes
   emoji, wraps at 72 columns without splitting commands, keeps 3 lines, and
   rejects any reply that mentions AI, models, prompts or URLs (in English
   and Chinese). Nell never breaks the fourth wall.
5. **Fallbacks everywhere.** Every story beat has at least two pre-written
   lines. If the key is missing, the request takes over 6 seconds, the rate
   limit is hit (12 per minute, 200 per day per client), or the reply is
   rejected, the player sees a pre-written line. The game plays the same
   without the AI.
6. **Bilingual.** In Chinese mode Nell answers in Chinese, keeps her ASCII
   smileys, and keeps every command exactly as typed.

Play-testing changed the design too. In Level 4, the AI told the player to
run Level 0 steps, so the chat context now resets each level and the current
task is restated after the chat history. The prompt also forbids Nell from
judging whether something is a scam, to keep the knowledge split intact.

## From play-test to fix

Most of the polish came from short Kiro sessions after a real beginner
played on a phone and sent screenshots. Each report became a pull request
with a fix and a regression test in `src/game/playtest.test.ts`. Examples:
full-width characters from a Chinese input method, `l` versus `1` in the
terminal font, a space hidden by line wrapping, `/user` instead of `/usr`,
and phone-keyboard typos in file names. The full list is in the
[README](../README.md#shaped-by-real-beginner-play-tests).
