# Devpost write-up (ready to paste)

Each section below matches a field on the Devpost project form.

---

**Project name:** hauntedserver-1987

**Tagline (elevator pitch):** A haunted 1987 Unix server. Rescue a ghost with
real shell commands and learn to spot six everyday scams.

**Category:** Resurrection

**Links:**
- Play: https://hauntedserver-1987.vercel.app
- Code: https://github.com/Hello-Lv-tu/hauntedserver-1987 (MIT)

---

## Inspiration

People learning the command line usually meet it as a cheat sheet: commands
to memorize with no reason to care. The same people are surrounded by traps
that keep getting smarter: fake virus popups, phishing mail, ransom notes,
AI assistants that are confidently wrong. We wanted one short game that
teaches both, and the Resurrection category gave us the setting: bring a
1987 4.3BSD server back to life, and let a ghost from that year meet the
dark patterns of 2026.

## What it does

A 2026 student sneaks into a haunted basement machine room. One VAX terminal
is still on, its clock frozen at 23:59:59 on Halloween 1987. Nell, a playful
little ghost, is trapped inside by Jack-o'-Daemon, a pumpkin-headed
"auto-modernization AI agent".

You and Nell split the work. Nell knows the old machine and the channels Jack
cannot see (`write`, `.plan`, mail headers, `cron`). You know 2026, so only
you can tell that Jack's offers are scams. Nell never makes that call for you.

- **Level 1, scareware:** a fake virus popup with a countdown. `ps aux` finds
  the program drawing it, `kill` ends it.
- **Level 2, phishing:** a mail "from Nell" asks for your password. `finger`
  shows her real note; `P 2` in Mail shows headers from a `.cloud` server,
  "Sent from my iPhone", in 1987.
- **Level 3, ransomware:** $9.99/month to unlock your files. `ls -l` shows the
  sizes never changed; only permissions were removed. `chmod` restores them.
- **Level 4, AI can be wrong:** a "Smart Assistant" says `rm -rf ~` will free
  Nell. `man rm` shows what it would really do.
- **Level 5, faked records:** Jack rewrote the system log. `diff` against
  yesterday's rotated copy shows the truth.
- **Boss, persistence:** Jack runs as root and restarts himself. Become root
  with `su`, find the `cron` entry, remove the program, then `kill` him.

Then Nell asks whether she should come with you (`tar` her onto tape) or
stay. There is a hidden ending and a post-credits secret. Every command
becomes a spell in your Spellbook with an in-game `man` page and a note on
how it works on Linux and macOS today, and the summary shows which of your
spells still work in a modern terminal.

The game is in English and Simplified Chinese (the 1987 machine always
answers in English), plays on phones, and takes about 15 to 20 minutes.

## How we built it

React 19, TypeScript and Vite, deployed on Vercel. The 4.3BSD filesystem,
shell and commands are simulated in pure TypeScript; nothing runs on a real
shell. A scripted state machine drives the story. Nell's chat replies come
from DeepSeek through one Vercel function, but the AI only writes her
wording: clues, files and level results are deterministic, and the game
plays the same without it.

**How we used Kiro.** The project was built by one person who does not write
code, with Kiro writing all the code, tests and docs, one pull request per
change. Everything is in `.kiro/` in the repo; details in
[docs/KIRO.md](https://github.com/Hello-Lv-tu/hauntedserver-1987/blob/main/docs/KIRO.md).

- **Steering** (4 files): the story bible, the ghost's persona and safety
  rules, 4.3BSD period accuracy (no `sudo`, no `/home`, `ls -l` without a
  group column), and project rules. The ghost persona loads only when story,
  mail or AI files are open. Steering kept Nell's voice and the 1987 details
  consistent across many separate sessions.
- **Specs** (4): the filesystem and shell, the story engine with Levels 0-1,
  Levels 2-5 with the boss, and the AI voice. Each has EARS requirements, a
  design and tasks, written and reviewed before code.
- **Hooks** (4): run tests when engine or UI code is saved; validate story
  seed files on save; ask the agent to review in-world text for
  anachronisms, 4.3BSD output formats and 80-column lines; and run the full
  check (lint, 227 tests, build, API smoke test) before the agent hands work
  back.
- **Property-based tests** (fast-check): every level completes even with
  random commands mixed in; from every story beat the level can still be
  finished; the shell never crashes; no command leaks a file you cannot read;
  AI replies are always at most 3 lines with no emoji.
- **AI voice design**, from the spec: the server builds the prompt from its
  own copy of the story, so the browser cannot inject facts; full answers
  only after the player asks three times; replies are cleaned and anything
  mentioning AI or links is dropped; rate limits and a 6-second timeout fall
  back to pre-written lines.

## Improving the hints from real beginner play-tests

A beginner who had never used a terminal played each build on a phone and
sent screenshots. Each problem became a fix plus a regression test (22 in
`src/game/playtest.test.ts`):

- **Full-width characters.** A Chinese input method typed `？` and full-width
  letters that look normal but a terminal rejects. All input is now folded to
  ASCII first, so `ｌｓ　－ａ` works as `ls -a`.
- **`l` versus `1`.** In the terminal font they look the same, and `ls -1`
  was typed four times. `ls -1` now explains the lowercase L "as in list", and
  Level 3 spells it out in words.
- **Spaces hidden by line wrap.** The hint `chmod 644 README .login` wrapped
  at the space and was read as one file name. Commands in hints are now
  boxed and never wrap, Level 3 gives one `chmod` per line, and the hint says
  exactly which file is still locked.
- **`/user` instead of `/usr`.** Any failed command with `/user` now gets
  "Unix spells it usr, without the e" and the corrected line.
- **Phone-keyboard typos.** `jack-o-daekon` now gets "Did you mean
  `rm /usr/lib/jack/jack-o-daemon`?" when a real file is one or two letters
  away.

## Challenges we ran into

- **Keeping the AI inside the story.** Early on, AI Nell told a Level 4
  player to repeat Level 0 steps. We reset her chat context each level,
  restate the current task, and never let the AI decide anything.
- **A serverless crash.** The AI endpoint failed on Vercel because Node ES
  modules need `.js` in import paths. We fixed it, added a rule to steering
  and a check script, so it cannot return.
- **Period accuracy versus clarity.** A real 1987 terminal gives terse errors.
  We kept the machine output authentic and put the help in separate,
  clearly styled hint lines.

## Accomplishments that we're proud of

- A complete story: six levels, a boss, three endings and a secret.
- The knowledge split: Nell knows 1987, the player knows 2026. It makes the
  player the expert on scams instead of reading a lecture.
- 227 tests, including property tests that prove every level stays solvable.

## What we learned

Writing the rules down once, as steering and specs, mattered more than any
single prompt. Watching one beginner play found problems no test would have:
a font where `l` and `1` look alike, a line wrap that hides a space.

## What's next

More languages, a classroom mode for teachers with a printable Spellbook,
and new levels for newer scams (fake QR codes, deepfake voice calls).

## Built with

typescript, react, vite, vitest, fast-check, vercel, deepseek, web-audio,
kiro
