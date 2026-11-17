# hauntedserver-1987

> A haunted 4.3BSD server, frozen at 23:59:59 on Halloween 1987.
> Learn real Unix commands while a mischievous little ghost plays hide-and-seek with you.

Built for **Kiroween 2026** (Resurrection category) with [Kiro](https://kiro.dev).

## The story

You are a 2026 intern. Your task sounds boring: migrate the data off an old
disk image from the Ravenmoor University CS department. When you boot it, the
clock reads `Sat Oct 31 23:59:59 EST 1987`, your account says you last logged
in that same night, and someone on `ttyp0` starts writing to your terminal.

Use `ls`, `cat`, `grep`, `ps`, `finger`, `mail` and `last` to read the logs,
mail and process tables, keep up with her pranks, and piece together what
happened to Nell Voss, the student night operator who vanished that night.

## Why

Many people learning the command line find it dry. This game teaches real,
transferable shell skills through a mystery: every command you use is
tracked, every command has an in-game `man` page with a note on how it works
on modern Linux and macOS, and the ending shows what you learned.

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

- **Steering** (`.kiro/steering/`): project rules, 4.3BSD period-accuracy
  rules, and the ghost's persona and safety rules.
- **Specs** (`.kiro/specs/`): requirements (EARS), design and tasks for each
  feature, starting with the virtual filesystem and shell.
- **Hooks** and **property-based tests**: coming next.

A full write-up will be added before submission.

## License

[MIT](LICENSE)
