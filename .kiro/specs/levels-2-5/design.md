# Design: Levels 2-5 and the boss

## New terminal modes

`GameState.mode` gains two kinds, handled in `src/game/` (pure):

```ts
| { kind: 'mail'; mailbox: Mailbox; current: number }
| { kind: 'password'; user: string }
```

- **mail**: `src/engine/mail/` parses the mbox spool (`From ` separator
  lines) into messages with headers, and renders the 4.3BSD header list
  (`>N  1 hale@vax3  Sat Oct 31 22:10  14/402  "subject"`). Each mail command
  returns output lines plus a story input
  `{ type: 'mail'; action: 'print' | 'printAll' | 'delete'; message }`.
  `q` writes the remaining messages back to the spool.
- **password**: entered by `su`. The UI switches the input to
  `type="password"` and shows `Password:`. The game checks the password
  against `src/story/secrets.ts` and emits a normal `su` command event
  (status 0 or 1) for the story.

`Session` gains an optional `parent` (the session to return to on `exit`).
The prompt is `# ` style for root: `vax3:/usr/lib# `.

## Commands

`finger`, `chmod`, `rm`, `diff`, `last`, `exit`/`logout` are ordinary
registry commands. `mail` and `su` return a `mode` like `write` does.
`last` reads `LOGINS` from `src/story/seed/logins.ts` (wtmp is binary on a
real system; the story owns this data). `diff` uses an LCS line diff.

## Story

- New story inputs: `mail` (above) and `assistant` (`run` | `decline`).
- New effects: `assistant` (`show` | `hide` | `nag`), `mailArrives`
  (prints "You have new mail."), and `respawnArmed` handled as a flag.
- Levels live in `src/story/levels/level2.ts` … `boss.ts`; seed changes they
  need are `writeFile` effects on entry (so checkpoints and eaten-restarts
  replay them).
- Boss respawn is deterministic: after a kill with the binary present, the
  flag `jackRespawn` is set; the next command event starts the process again.

## UI

- `Assistant.tsx`: Jack's chat bubble (same "too modern" style as the
  popup), buttons "Run it for me" and "No thanks". Non-modal.
- Password input: `type="password"`, `autoComplete="off"`.

## Testing

- Unit tests for each new command's format and errors.
- Level tests through `game.step`, including the wrong orders in Req 2.2–2.6.
- `SOLUTIONS` in `game.prop.test.ts` extended for levels 2-5 and the boss.
