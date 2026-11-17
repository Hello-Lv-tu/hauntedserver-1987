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

Early development. The current build shows a placeholder boot screen.
See `.kiro/specs/` for what is being built next.

## Run locally

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## How this project uses Kiro

- **Steering** (`.kiro/steering/`): project rules, the story bible (levels
  and endings), 4.3BSD period-accuracy rules, and the ghost's persona and
  safety rules.
- **Specs** (`.kiro/specs/`): requirements (EARS), design and tasks for each
  feature, starting with the virtual filesystem and shell.
- **Hooks** and **property-based tests**: coming next.

A full write-up will be added before submission.

## License

[MIT](LICENSE)
