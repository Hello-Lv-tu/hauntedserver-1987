# Requirements: Story engine, Level 0 and Level 1

## Introduction

This spec turns the terminal into a game. It adds the story engine (a
scripted state machine), talking to Nell with `write`, the process table
(`ps`, `kill`, `who`), Jack-o'-Daemon's first trick (a fake warning popup),
the Spellbook, hints and save points. It covers the opening (Level 0) and
Level 1 from `.kiro/steering/story.md`.

Out of scope: AI-generated wording (spec 3; this spec uses only pre-written
lines, which later become the AI fallbacks), Levels 2–5, the boss, endings,
the machine-room scene, sound and slow-baud text.

## Glossary

- **Beat**: one step of the story (e.g. "waiting for the player to find the
  hidden note"). The story engine is always in exactly one beat.
- **Effect**: something the story engine asks the game to do: show a Nell
  message, write a file, start or stop a process, show Jack's popup, show a
  lesson card, award a spell, save a checkpoint.
- **Write mode**: the state after `write nell`, where each line the player
  types is sent to Nell instead of being run as a command.
- **Spell**: a command the player has used successfully at least once.
- **Lesson card**: a short panel explaining the real-world lesson of a level.

## Requirement 1: Story engine

**User story:** As a designer, I want the story to be a deterministic state
machine, so that every level is always solvable and testable.

1. THE story engine SHALL be pure TypeScript with no React imports, taking
   the current story state and one input (a command event, a message sent to
   Nell, a popup action, or a timer tick) and returning the new state plus a
   list of effects.
2. THE story engine SHALL ignore inputs that are not relevant to the current
   beat, without changing state.
3. FOR ALL sequences of irrelevant or wrong commands interleaved with a
   level's solution, THE story engine SHALL still complete the level
   (property test).
4. THE story engine SHALL never reach a beat from which the level cannot be
   completed (property test over all beats).

## Requirement 2: Talking to Nell with `write`

**User story:** As a player, I want to message Nell the way 1987 users did,
so that the old channel feels real.

1. WHEN the player runs `write nell`, THE system SHALL enter write mode and
   show a line explaining how to stop: Ctrl-D (the real way), or a line
   containing only `EOF` (for phones, which have no Ctrl key).
2. WHILE in write mode, THE system SHALL send each line to Nell, SHALL NOT
   run it as a command, and SHALL show no shell prompt.
3. WHEN Nell replies, THE system SHALL print her reply in the 4.3BSD format
   (`Message from nell@vax3 on ttyp0 at 23:59 ...`, the lines, `EOF`).
4. WHEN Nell sends a message at any other time, THE system SHALL print it the
   same way, after the output of the current command.
5. `write` with no user SHALL print `usage: write user [ttyname]`; `write`
   to a user who is not logged in SHALL print `write: <user> is not logged on.`
6. In this spec Nell's replies SHALL be pre-written lines chosen by the
   current beat. What the player writes SHALL NOT change which clue is
   revealed.

## Requirement 3: Processes: `ps`, `kill`, `who`

**User story:** As a player, I want to see and stop running programs, so that
I can find what is drawing Jack's popup.

1. THE system SHALL keep a process table (PID, user, tty, state, CPU time,
   command) alongside the filesystem, changeable only by the story engine and
   by `kill`.
2. `ps` SHALL list the player's processes; `ps aux` (also `ps -aux`) SHALL
   list all processes in the 4.3BSD column layout
   (`USER PID %CPU %MEM SZ RSS TT STAT TIME COMMAND`).
3. `kill [-9] pid ...` SHALL stop processes the player owns. WHEN the PID does
   not exist, THE system SHALL print `kill: <pid>: No such process`; WHEN the
   player does not own it, `kill: <pid>: Not owner`.
4. `who` SHALL list logged-in users in the 4.3BSD format, including
   `nell ttyp0` and the player.
5. Every new command SHALL have a man page with a MODERN NOTE.

## Requirement 4: Level 0, the opening

**User story:** As a new player, I want a gentle start, so that I learn my
first commands while meeting Nell.

1. WHEN the game starts, THE system SHALL show the boot banner and Nell's SOS
   asking the player to `write nell`.
2. WHEN the player first writes to Nell, Nell SHALL explain (in at most three
   short messages) that Jack watches normal files and that she hid a note
   that "starts with a dot", and SHALL suggest `ls -a`.
3. THE seed SHALL contain the hidden note `~/.from_nell`, visible only with
   `ls -a`.
4. WHEN the player reads the note with `cat` or `more`, THE level SHALL be
   complete and Nell SHALL react.
5. WHILE the player has not found the note, typing `hint` SHALL give the
   next of three hints: direction, command, full answer.

## Requirement 5: Level 1, the fake warning popup (scareware)

**User story:** As a player, I want to beat Jack's first trick using real
commands, so that I learn `ps` and `kill` and how scareware works.

1. WHEN Level 1 starts, THE system SHALL show Jack's popup over the terminal:
   deliberately modern styling (rounded, glossy orange), a scary warning, a
   countdown, a big "FIX NOW" button and a small close button.
2. THE story engine SHALL start a process for the popup owned by the player,
   on the player's tty, with a cheeky Jack name, so it appears in `ps`.
3. WHEN the player clicks "FIX NOW" or the countdown reaches zero, Jack SHALL
   "eat" the player: a short glitch, a smug Jack line, then Level 1 restarts
   from its checkpoint. Nothing else is lost.
4. WHEN the player clicks close or presses Escape, THE popup SHALL reappear
   moments later with a new message (a dark pattern the player learns to
   notice).
5. Nell SHALL warn the player not to click it and nudge them toward
   `ps aux` and then `kill`.
6. WHEN the player kills the popup process, THE popup SHALL disappear, Nell
   SHALL cheer, a lesson card about scareware SHALL appear, and Level 1 SHALL
   be complete.
7. THE popup SHALL be keyboard-accessible and announced to screen readers,
   and the terminal SHALL stay usable while it is shown.

## Requirement 6: Spellbook

**User story:** As a learner, I want to see which commands I have learned, so
that progress feels real.

1. WHEN a command from the spell list in `story.md` succeeds (exit status 0)
   for the first time, THE UI SHALL show a "New spell learned" card with the
   command, its in-world name and a one-line description.
2. THE UI SHALL provide a Spellbook panel (button and `spellbook` command)
   listing learned and not-yet-learned spells, each with its `man` summary.
3. Cards and the panel SHALL be dismissible with the keyboard and SHALL not
   block typing for more than the moment it takes to read them.

## Requirement 7: Save points

**User story:** As a player, I want to keep my progress when I reload, so
that I can come back later.

1. WHEN a level starts, THE system SHALL save a checkpoint (level, learned
   spells, story flags) to `localStorage`.
2. WHEN the page loads with a checkpoint, THE system SHALL offer
   "continue" or "new game".
3. Saved data SHALL contain no player-typed text other than what the story
   explicitly stores, and SHALL be validated on load; invalid data SHALL be
   ignored.

## Requirement 8: End of this slice

1. WHEN Level 1 is complete, THE system SHALL show a short "to be continued"
   message from Nell that points toward Level 2 (mail), so playtesters have
   a clear end point.
2. THE "dev build" line from the previous spec SHALL be removed.
