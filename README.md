# hauntedserver-1987

> A haunted 4.3BSD server, frozen at 23:59:59 on Halloween 1987.
> Use real Unix commands to rescue a little ghost from a pumpkin-headed
> "modernization" daemon.

Built for **Kiroween 2026** (Resurrection category) with [Kiro](https://kiro.dev).

## The story

Everyone at Ravenmoor University says the old basement machine room is
haunted. You sneak in. One terminal is still glowing green, its clock stuck
at `Sat Oct 31 23:59:59 EST 1987`, and as you step closer it prints:

```
Message from nell@vax3 on ttyp0 at 23:59 ...
is someone there?? please. the pumpkin thing locked me in.
```

Nell, a playful little ghost, is trapped in the machine by
**Jack-o'-Daemon**, a pumpkin-headed spirit living in a modern
"auto-modernization agent" that wants to delete everything legacy.

Jack can't understand old tech, so you and Nell talk through `write`,
`talk`, `.plan` files and old mail. Nell knows the old machine. You know
2026, so you can see through Jack's tricks: fake warning popups, phishing
mail, files held for ransom, an "AI assistant" that lies, and tampered logs.
Beat Jack, then decide with Nell whether she stays or comes with you.

## Why

Many people learning the command line find it dry. This game teaches two
things through a story: real shell commands (`ls`, `cat`, `grep`, `ps`,
`kill`, `chmod`, `mail`, `cron`...), and how to spot everyday digital traps.
Every command you learn goes into your Spellbook, has an in-game `man` page
with a note on how it works on modern Linux and macOS, and shows up in the
summary at the end.

## Status

Playable now: the opening and Level 1.

- `write nell` to talk to Nell (Ctrl-D or `EOF` to stop), find her hidden note
  with `ls -a`, then beat Jack-o'-Daemon's fake virus popup with `ps aux` and
  `kill`, without ever clicking it.
- Spellbook, three-level `hint`, autosave (continue or new game), a 60 s / 30 s
  popup timer setting.
- 22 commands with 4.3BSD output, pipes, quoting, history and Tab completion.

Levels 2-5, the boss, the endings, the machine-room scene and Nell's AI voice
are next. See `.kiro/specs/` for the plan.

## Run locally

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

### Nell's AI voice (optional)

Nell's replies to whatever you write her come from DeepSeek through the
Vercel function `api/ghost.ts`. Set `DEEPSEEK_API_KEY` in the Vercel project's
environment variables (optionally `DEEPSEEK_MODEL`, default `deepseek-flash`).
The key stays on the server. Without it, or when the AI is slow or fails, Nell
uses her pre-written lines and the game plays exactly the same. The AI only
words her small talk; the story, clues and level logic are deterministic.

Other scripts: `npm test` (unit and property-based tests), `npm run check`
(lint + test + build), `npm run build`, `npm run preview`.

## How this project uses Kiro

- **Steering** (`.kiro/steering/`): project rules, the story bible (levels
  and endings), 4.3BSD period-accuracy rules, and the ghost's persona and
  safety rules.
- **Specs** (`.kiro/specs/`): requirements (EARS), design and tasks for each
  feature, starting with the virtual filesystem and shell.
- **Hooks** (`.kiro/hooks/`): run tests on save, validate story seeds on
  save, review in-world text for period accuracy, and run the full check
  before the agent finishes.
- **Property-based tests** (fast-check, `*.prop.test.ts`): path normalization,
  tokenizer round-trips, grep partitioning, "the shell never crashes", and
  "no command leaks a file you cannot read".

A full write-up will be added before submission.

## License

[MIT](LICENSE)
