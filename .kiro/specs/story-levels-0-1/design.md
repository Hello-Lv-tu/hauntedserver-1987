# Design: Story engine, Level 0 and Level 1

## Overview

```
                  ┌──────────────── src/ui/ ────────────────┐
 keyboard ──────► │ Terminal  WriteMode  JackPopup  Spellbook │
                  └───────┬─────────────────────▲──────────┘
                          │ inputs              │ effects
                  ┌───────▼─────────────────────┴──────────┐
                  │ src/game/game.ts  (glue, pure)          │
                  │   execute() ──► CommandEvents ──► story │
                  └───────┬───────────────┬────────────────┘
                          │               │
               src/engine/ (shell, vfs,   src/story/ (beats, levels,
               procs: new process table)  lines, seed)
```

One new pure module, `src/game/game.ts`, owns the whole game state and is the
only thing React talks to. It runs commands through the existing engine,
feeds the resulting command events to the story engine, and applies the
story's effects. React renders `GameState` and dispatches `GameInput`.

## Game state

```ts
// src/game/types.ts
interface GameState {
  world: { vfs: Vfs; procs: ProcTable }
  session: Session
  mode: { kind: 'shell' } | { kind: 'write'; to: string }
  story: StoryState
  spells: string[]                // learned, in order
  popup: PopupState | null        // Jack's popup, if shown
  pendingCards: Card[]            // spell and lesson cards to show
  screen: ScreenLine[]            // what the terminal shows
}

type GameInput =
  | { type: 'line'; text: string }          // Enter in shell or write mode
  | { type: 'eof' }                         // Ctrl-D
  | { type: 'popup'; action: 'fix' | 'close' }
  | { type: 'tick'; now: number }           // 1 s timer for countdowns
  | { type: 'dismissCard' }

function step(state: GameState, input: GameInput): GameState
```

`step` is pure and deterministic (`tick` carries the time), so whole
play-throughs can be property-tested without a browser.

## Process table — `src/engine/procs/`

```ts
interface Proc {
  pid: number; user: string; tty: string; stat: string
  time: string; command: string; cpu: number; mem: number
}
type ProcTable = readonly Proc[]
```

Immutable like the VFS. `CommandCtx` gains `procs` and `CommandOutput` gains
an optional new `procs`, so `kill` can return a changed table. The seed adds
a short `procs.json` with period-correct system processes (`swapper`,
`pagedaemon`, `init`, `update`, `cron`, `inetd`, `getty`) plus `nell`'s
`-csh (csh)` on `ttyp0`.

## Story engine — `src/story/`

```ts
// src/story/types.ts
type StoryInput =
  | { type: 'command'; event: CommandEvent; ok: boolean }
  | { type: 'wrote'; to: string; text: string }
  | { type: 'popup'; action: 'fix' | 'close' | 'timeout' }
  | { type: 'hint' }

type Effect =
  | { type: 'nell'; lines: string[] }               // printed as a write message
  | { type: 'jack'; lines: string[] }               // printed in Jack's style
  | { type: 'writeFile'; path: string; node: VNode }
  | { type: 'startProc'; proc: Proc }
  | { type: 'stopProc'; pid: number }
  | { type: 'popup'; popup: PopupState | null }
  | { type: 'lesson'; card: LessonCard }
  | { type: 'checkpoint' }
  | { type: 'eaten' }                               // glitch, then restart level

interface Beat {
  id: string
  hints: [string, string, string]
  /** Return null to ignore the input. */
  on(input: StoryInput, flags: Flags): { next: string; effects: Effect[]; flags?: Flags } | null
  /** Effects when the beat is entered. */
  enter?: Effect[]
}
```

Levels are plain data in `src/story/levels/level0.ts` and `level1.ts`. All
lines (Nell, Jack, lessons) live in `src/story/lines.ts`, each beat with at
least two variants, so spec 3 can reuse them as AI fallbacks.

### Matching commands

Beats match on the **command event** (name, args, status), never on raw
text, so `cat ~/.from_nell`, `cat .from_nell` and `more ./.from_nell` all
count. A small helper, `readsFile(event, ctx, '/usr/users/guest/.from_nell')`,
resolves the argument paths against the event's `cwd`.

### Level 0 beats

| Beat | Waits for | Then |
|---|---|---|
| `sos` | `wrote` to nell | Nell: Jack watches files, she hid a note "that starts with a dot"; suggests `ls -a` |
| `hunt` | `ls` with `-a` in home | Nell: "there! read it." |
| `read` | `cat`/`more` of `~/.from_nell` (also accepted in `hunt`) | Nell reacts; checkpoint; go to Level 1 |

### Level 1 beats

| Beat | Waits for | Then |
|---|---|---|
| `popup` | (enter) start proc `pumpkin_upd8r` (PID 6667) + show popup | Nell: "DON'T click that!!" |
| `popup` | `ps` showing it | Nell: "see it? that's not mine. get rid of it" |
| `popup` | `kill` of its PID | popup gone, Nell cheers, scareware lesson card, "to be continued" |
| any | popup `fix` or `timeout` | `eaten`: restart Level 1 from checkpoint |
| any | popup `close` | popup comes back after 3 s with a new message |

The popup countdown is 60 s or 30 s (player setting, default 60) and pauses
while a card, the Spellbook or the settings panel is open, so slow readers
are never punished for reading.

## Settings — `src/game/settings.ts`

`{ version: 1, popupSeconds: 60 | 30 }` in
`localStorage["hauntedserver:settings"]`, validated on load (anything else
falls back to the default). `GameState` carries `settings`; a
`{ type: 'settings'; settings }` input changes them. `Settings.tsx` is a
small gear button in the top-right corner that opens a panel with a
two-option radio group. Getting eaten restarts the level from its
checkpoint and keeps spells and flags (Requirement 8.4).

## Write mode

`write nell` is a real command that returns a `mode` change. While in write
mode, `step` sends each line to the story as `{ type: 'wrote' }` and echoes it
with no prompt. Ctrl-D or a line `EOF` leaves write mode. Nell's replies come
from story effects and are printed as:

```
Message from nell@vax3 on ttyp0 at 23:59 ...
<lines>
EOF
```

## Spellbook

`src/story/spells.ts` lists spells (command, in-world name from `story.md`,
one-line description). After each line, `game.ts` checks the new command
events: the first successful event for a spell adds a card. The Spellbook
panel and the `spellbook` command read the same list.

## Save points — `src/game/save.ts`

`{ version: 1, level: number, spells: string[], flags: Record<string, boolean> }`
in `localStorage["hauntedserver:save"]`, validated field by field on load.
Restoring rebuilds the world from the seed and replays the level's `enter`
effects, so saves never contain filesystem snapshots.

## UI

- `JackPopup.tsx`: `role="alertdialog"`, focus goes to the close button (not
  "FIX NOW"), Escape = close. Style is deliberately modern (`jack.css`: system
  sans-serif font, rounded corners, orange gradient, drop shadow) to clash
  with the CRT.
- `Card.tsx`: spell and lesson cards; Enter or Escape dismisses.
- `Spellbook.tsx`: panel listing spells.
- "Eaten" effect: a 600 ms CSS glitch (skipped with reduced motion), then a
  Jack line and the restart.

## Testing strategy

- Unit tests for `ps`, `kill`, `who`, `write` formats and errors.
- Unit tests for each beat transition.
- Property tests:
  1. For random noise commands inserted between the steps of each level's
     solution, the level still completes (Req 1.3).
  2. From every beat, the level's solution suffix completes it (Req 1.4).
  3. `step` never throws for random inputs, including popup actions and
     ticks in any order.
  4. Save round-trip: `load(save(state))` gives the same level, spells and
     flags; random JSON never crashes `load`.
- A full scripted play-through of Levels 0–1 as an integration test.

## Implementation notes (deviations from the plan above)

- **Jack's popup does not take focus.** The plan said `role="alertdialog"` with
  focus on the close button, but then the player could not keep typing
  `ps aux` while it is shown (Requirement 5.7). It is a non-modal
  `role="alert"`; Escape in the terminal closes it.
- **No emoji anywhere.** Jack's pumpkin and the warning sign are inline SVG
  (`src/ui/icons.tsx`), because systems without an emoji font showed empty
  boxes. `src/story/lines.test.ts` enforces this and Nell's persona limits
  (3 lines, under 200 characters).
- **A line `EOF` is not echoed** when leaving write mode, just as Ctrl-D is not
  echoed by real `write`.
- **Spell cards dismiss themselves after 5 s**; lesson cards stay until
  dismissed. Escape dismisses a card first, then closes the popup.
- **Saves store spells immediately** (not only at level start), so a reload
  never loses a learned spell.
- **localStorage may throw** (private browsing, sandboxed pages). Reads and
  writes go through `src/ui/storage.ts` and fail silently; found by the
  browser play-test, where the game crashed without it.
- **Glitch** is a full-screen overlay keyed by `game.glitch`, so the CSS
  animation replays without setting React state in an effect.
- `hint` and `spellbook` are registry commands that return a `request` for the
  game, so they appear in `help`, Tab completion and `man`.
