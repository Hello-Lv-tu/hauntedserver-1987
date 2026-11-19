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
| `cd` | Doorway: step into another directory |
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

## Levels (final design)

Each level: one Jack trick, one or two new spells, one real-world lesson
card. Every level is always solvable (property-tested).

| # | Title | Jack's trick | How the player sees through it | New spells | Lesson |
|---|---|---|---|---|---|
| 0 | The note with a dot | (Opening) Nell's SOS | `write nell`, `ls -a`, `cat .from_nell` | write, ls, cat | First steps |
| 1 | The popup that would not close | Fake virus popup with countdown | Don't click; `ps aux`, `kill 6667` | ps, kill | Scareware |
| 2 | The letter that lied | Mail "from Nell" asking for your password | Nell hides instructions in her `.plan` (`finger nell`); `mail`, `P 2` shows the real headers (sent from a 2026 cloud domain, "Sent from my iPhone"), `d 2` deletes it | finger, mail | Phishing |
| 3 | Files held for ransom | `README` and `.login` "encrypted", ransom note asks $9.99/month | `ls -l`: sizes unchanged, only permission bits removed; `chmod 644` restores them | chmod | Ransomware |
| 4 | The assistant that lied | Jack's "Smart Assistant" says `rm -rf ~` will free Nell | `man rm` shows it deletes your whole home; decline. Running it gets you eaten | rm (by reading `man rm`) | AI can be confidently wrong |
| 5 | The log that lied | Jack rewrote `/usr/adm/messages`: "nell logged out, deleted her account" | `diff /usr/adm/messages.0 /usr/adm/messages` shows his edits; the original reveals a power surge and "tape 3 write of /usr/users/nell" | diff, last | Records can be faked |
| Boss | The daemon that came back | `jack-o-daemon` (PID 6666, root) | `su` (password: the bad tape, `tape3`, from Nell's notes); `kill 6666` and he respawns via `/usr/lib/crontab`; `rm /usr/lib/jack/jack-o-daemon`, then `kill 6666` for good | su | Find the root cause (persistence) |

Target play time: 15-20 minutes.

## Endings (final design)

After the boss, Nell is free but still in the machine. She writes first, gives
her own opinion, then asks. The player answers in write mode with words like
"come with me" or "stay" (keyword match, deterministic; the AI never decides).

| Ending | Trigger | What happens |
|---|---|---|
| **Move** | "come" | Nell: "pack me up then!" Player runs `tar cvf /dev/rmt0 ~nell`; files scroll by; the tape reel spins in the scene; the screen fades to white; the browser tab icon becomes a tiny ghost; Nell's last message arrives in a modern font she complains about ("why are all the buttons ROUND??"). Main ending for the demo video. |
| **Stay** | "stay" | Nell guards vax3. The room light turns from green to warm amber. On later visits `write nell` reaches her and she remembers the player (localStorage). |
| **Hidden: a piece of you** | Before choosing: read `~nell/.diary` as root and write the answer to `/tmp/riddle` ("keyboard") to Nell. Nell then asks for one line for the next visitor (written to her; the terminal has no `>` redirection) | The line is shown on the summary and greets the next visitor on a new game, as a write message from guest. Stored only in the player's browser, max 100 characters. |
| **Post-credits tease** | `ps` after the credits | A tiny `pumpkin_seed` process flickers at the bottom of the list and is gone on the next `ps`. Never explained. |

No "it was all a lie" twist in the main story.

## Postgame: talking to Nell after the ending

After an ending (in the same session and on every later visit) the player can
keep chatting with Nell. Where she lives decides the channel. Both Nells know
Jack-o'-Daemon is defeated for good and remember which ending happened.

| Ending | Channel | Nell |
|---|---|---|
| **Stay** | The old terminal: `write nell`. `finger nell` shows her guardian `.plan`. | Still a 1987 guardian of vax3. Clock still frozen, knows only 1987, amazed by any 2026 thing the player mentions. |
| **Move** | A modern messenger-style chat window in the browser (the "Chat" button; also "Reply to Nell" on the ending screen). Original styling, no real messenger brand. `write nell` on vax3 only gets her short "i moved out" note; `finger nell` shows her "gone traveling" `.plan`. | A newcomer to 2026. She learns about the modern world only from the player's messages and never pretends to already know modern facts. |

- The hidden visitor line is a keepsake, not a third place: Nell may mention
  that it is kept safe on vax3, but never quotes it.
- Postgame chat never changes story state, never adds clues, puzzles or
  secrets, and works with pre-written lines when the AI is unavailable.
- The short chat history (last 30 messages) is stored only in the player's
  browser and is cleared when a new game starts.

## Final presentation (what judges see)

1. **Start**: the machine-room pixel art fills the screen (door ajar, VAX
   cabinets, tape drives, line printer, one glowing terminal with a faint
   ghost reflection). "Press Enter to step inside."
2. **Zoom**: the camera pushes into the terminal; the CRT bezel frames the
   game; the room stays visible, dimmed, around it.
3. **Living room**: the scene reacts: lights flicker when Jack appears, the
   room tints orange during his tricks, the printer spits a page when Nell
   pranks, the tape reel spins in the Move ending, amber light in Stay.
4. **Sound** (off until enabled): CRT hum, key clicks, three BEL chimes when a
   `write` message arrives (as real `write` rang the bell), a synth sting for
   Jack.
5. **End screen**: Spellbook summary ("you learned 17 spells; 15 of them work
   on your laptop today"), the six lessons, credits.

Build order: levels 2-5 and boss, then endings, then scene/sound, then
submission material (README, Kiro write-up, 3-minute video).
