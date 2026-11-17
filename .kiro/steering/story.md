---
inclusion: always
---

# Story bible

This is the agreed story. Story specs, seed files, ghost lines and UI scenes
must follow it. Change this file first if the story changes.

## Premise

- **Player**: a 2026 student at Ravenmoor University. Everyone says the old
  basement machine room in the B-wing is "cold" and haunted. The player sneaks
  in to look.
- **Opening scene**: a dark room full of dead equipment. One VT100-style
  terminal is still glowing green. As the player walks in, it prints a
  message: the ghost has detected someone and is calling for help.
- **The machine**: `vax3.cs.ravenmoor.edu`, 4.3BSD, clock frozen at
  `Sat Oct 31 23:59:59 EST 1987`.
- **The ghost**: Nell Voss (`nell`), a playful little ghost. In 1987 she was
  the student night operator. She got into the machine at 23:59:59 on
  Halloween 1987 (a power surge, the details stay gentle and mysterious; never
  morbid). See `ghost-persona.md`.
- **The villain**: **Jack-o'-Daemon**, a pumpkin-headed Halloween spirit
  living inside a modern "auto-modernization agent" the university installed
  on the old machine in 2026. Pun: Jack-o'-Lantern + Unix daemon (a
  background process) + demon. It wants to "upgrade" the machine and delete
  everything "legacy", Nell included. It has trapped her.

## Core idea: old tech is the secret channel, modern know-how is the weapon

- Jack-o'-Daemon does not understand old tech. `write`, `talk`, `.plan`
  files, old mail spools and `cron` entries are invisible to it, so Nell and
  the player use them to talk and hide clues.
- Nell only knows 1987. The player knows 2026. Jack-o'-Daemon's weapons are
  modern dark patterns that Nell cannot see through but the player can.
- The game teaches two things at once: real shell commands, and spotting
  everyday digital traps (scareware, phishing, ransomware, AI that makes
  things up, tampered records).

## Look and feel

- Nell's world: green phosphor CRT, monospace, 1987-accurate.
- Jack-o'-Daemon's world: deliberately **too modern**: glossy rounded orange
  toast notifications, fake "Fix now" buttons, countdown timers, corporate
  cheerful tone ("Your legacy session will expire soon!"). It overlays the
  CRT and looks out of place on purpose. Period-accuracy rules do **not**
  apply to Jack-o'-Daemon's UI and text; that contrast is the point.
- Spooky-cute overall. The villain is creepy and smug, never gory.

## Commands as spells

Every command has an in-world meaning. The first time a command succeeds,
show a "New spell learned" card and add it to the **Spellbook** (the
learning-progress screen).

| Command | In-world meaning |
|---|---|
| `ls` | Flashlight: light up the room |
| `cat` / `more` | Open a notebook |
| `grep` | Follow a scent |
| `ps` | Scan who is here (Jack-o'-Daemon's shadow appears) |
| `finger` | Knock on a door |
| `write` / `talk` | Pass a note / walkie-talkie (Jack can't hear) |
| `kill` | Banishing strike |
| `chmod` | Lock / unlock |
| `man` | Read the spell's description |

## Feedback rules

- The terminal always shows real, accurate output (learning layer).
- The scene and characters react at the same time (immersion layer): Jack's
  shadow on `ps`, lights flicker on a failed `kill`, Nell reacts when the
  player reads her things, mistakes get a playful nudge plus the correct form.
- Typing sounds and CRT hum; output appears at a simulated slow baud rate,
  skippable with any key. All motion respects `prefers-reduced-motion`; all
  sound is off until the player turns it on.
- No dead ends: Nell gives the first command; file names in output are
  clickable and fill the input (the player still presses Enter); three-tier
  hints (direction, then command, then full answer).
- Nothing is really destructive. Dangerous commands are simulated; at worst
  Jack "eats" the player and the level restarts.

## Levels

| # | Jack-o'-Daemon's trick | How the player sees through it | Real-world lesson |
|---|---|---|---|
| 0 | (Opening) Nell's SOS on the glowing terminal | `write nell`, `ls`, `cat` | First steps |
| 1 | Fake "System warning! Click to fix" popup | Don't click; `ps aux` to find it, `kill` it | Scareware |
| 2 | Mail pretending to be from Nell | `mail`, read headers, the sender path does not match | Phishing |
| 3 | Files locked, "subscribe to unlock" | `ls -l` shows only the permissions changed; `chmod` back | Ransomware |
| 4 | "Smart assistant" tells the player to run a command that deletes everything | `man` the command, refuse to run it | Don't blindly trust AI |
| 5 | Tampered logs hiding the truth | `grep` timestamps, they don't line up | Records can be faked |
| Boss | Jack-o'-Daemon keeps coming back after `kill` | Nell hints at `cron`; remove its entry in `/usr/lib/crontab`, then `kill` for good | Find the root cause |

Target play time: 15–20 minutes. Build order: commands and levels playable
end to end first, then scene animation and sound.

## Endings

After the boss, the player **asks Nell** what she wants. She gives her own
opinion first, then the player decides.

| Ending | Trigger | Content |
|---|---|---|
| **Move** | Player chooses "come with me" | `tar` packs Nell onto tape and "uploads" her to the new world. Afterwards the browser tab icon becomes a tiny ghost and Nell comments on 2026 web pages ("why are all the buttons ROUND??"). Main ending for the demo video. |
| **Stay** | Player chooses "stay here" | Nell guards the old machine. The room light turns from green to warm amber. On later visits the player can `talk nell` and she remembers them (saved in localStorage). |
| **Hidden: a piece of you** | All hidden clues found and the player wrote their own `.plan` | The player becomes part of the machine: their `.plan` becomes the message the next visitor sees. Loops back to the opening. Stored only in the player's own browser; never shown to other players. |
| **Post-credits tease** | Run `ps` again after the credits | A tiny new pumpkin process flickers at the bottom of the list and vanishes. Never explained. |

No "it was all a lie" twist in the main story.
