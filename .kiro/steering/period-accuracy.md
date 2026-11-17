---
inclusion: always
---

# 1987 / 4.3BSD period accuracy

Period accuracy is a core selling point for the Resurrection category. When
writing commands, output formats, file contents or story text, follow these
rules. If a detail is uncertain, prefer the 4.3BSD behavior and leave a short
`// period:` comment explaining the choice.

**Exception:** Jack-o'-Daemon (the villain) and everything it produces
(popups, its agent process, its "smart assistant", its files) are
deliberately modern. These rules do not apply to it. See `story.md`.

## The machine

- Hardware: DEC VAX-11/785. OS: 4.3BSD (released 1986).
- Hostname: `vax3.cs.ravenmoor.edu`. Short name `vax3`.
- UUCP path also works in mail headers: `...!seismo!ravenmoor!nell`.
- System clock is frozen at `Sat Oct 31 23:59:59 EST 1987`. `date` prints
  that format.
- Login shell is `csh`. Prompt is `% ` for users and `# ` for root.

## Things that exist

- `ls`, `cd`, `pwd`, `cat`, `more`, `head`, `tail`, `wc`, `grep`, `echo`,
  `date`, `whoami`, `who`, `w`, `last`, `finger`, `ps`, `kill`, `mail`,
  `write`, `wall`, `man`, `su`, `vi`, `history` (csh builtin), `clear`.
- `ps` uses BSD flags: `ps aux`, no dash required.
- `ls -l` in 4.3BSD shows **owner but not group** (group needs `-g`):
  `-rw-r--r--  1 nell         1234 Oct 31 23:58 notes`
- Important paths: `/etc/passwd` (password hashes are visible, no shadow
  file), `/usr/spool/mail/<user>`, `/usr/adm/messages`, `/usr/adm/wtmp`
  (read via `last`), `/usr/lib/crontab` (a single system crontab),
  `/usr/spool/uucp/`, `/usr/spool/news/`, `~/.plan`, `~/.project`,
  `~/.login`, `~/.cshrc`.

## Things that do NOT exist (do not add them as working commands)

- `sudo`, `less`, `vim`, `nano`, `top`, `htop`, `apt`, `curl`, `wget`, `ssh`,
  `git`, `python`, `bash`, `crontab` (per-user crontab came later), `ls`
  colors, `/home` (users live under `/usr/users/` or `/u/`), `/var`.
- When the player types one of these, csh answers in period style
  (`sudo: Command not found.`) and the UI may add a separate, visually
  distinct **hint line** suggesting the 1987 equivalent (for example
  "in 1987, try `su`" or "try `more`"). The hint is a learning aid, not
  terminal output.

## Error message formats

- Unknown command (csh): `foo: Command not found.`
- `cd` to a missing dir (csh): `nope: No such file or directory.`
- `cat` missing file: `cat: nope: No such file or directory`
- `ls` missing path (4.3BSD): `nope not found`
- Permission: `cat: secret: Permission denied`

## Writing style for in-world text

- Mail, logs and notes use 1980s conventions: plain ASCII, no emoji, 80
  columns or fewer, `--` signatures, mail headers in RFC 822 style.
- No anachronisms in story files: no web, smartphones, cloud, Wi-Fi.
  Allowed: ARPANET/NSFNET, Usenet, UUCP, BITNET, 9-track tape, VT100
  terminals, DECwriters, line printers.
