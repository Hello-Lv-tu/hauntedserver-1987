# Requirements: Levels 2-5 and the boss

Implements the "Levels (final design)" table in `.kiro/steering/story.md`.
Endings are a separate spec. EARS phrasing; "the system" is the engine.

## Requirement 1: New commands (4.3BSD behavior and formats)

1. `finger [user]`: without a user, list logged-in users; with a user, show
   login name, real name, office, directory, shell, "On since", and the
   user's `.plan` (or "No Plan.").
2. `mail`: interactive Berkeley Mail 5.2 on `/usr/spool/mail/<user>`, with an
   `& ` prompt. Commands: Enter/`n` (next), a number, `p N`, `P N` (all
   headers), `h`, `d N`, `q` (save and quit), `x` (quit, keep mail), `?`.
   WHEN there is no mail, print `No mail for <user>`.
3. `chmod mode file ...`: octal (`644`) and symbolic (`u+r`, `go-w`, `a=r`)
   modes. WHEN the user does not own the file and is not root, print
   `chmod: <file>: Not owner`.
4. `rm [-rf] file ...`: needs write permission on the parent directory;
   directories need `-r`. Errors in 4.3BSD wording (`rm: x nonexistent`,
   `rm: x directory`). `-f` silences errors. The system SHALL refuse to
   remove `/`, `/usr`, `/etc`, `/usr/users` and `/usr/users/nell`, with an
   in-character message.
5. `diff file1 file2`: normal diff output (`3c3`, `< `, `---`, `> `), exit
   status 0 when equal, 1 when different.
6. `last [user]`: login history from the story's records, newest first, with
   "still logged in" and a final `wtmp begins ...` line.
7. `su [user]` (default root): asks `Password:` with the input hidden; a wrong
   password prints `Sorry`; the root shell uses the `# ` prompt; `exit`
   returns to the previous user. `exit`/`logout` in the login shell does not
   leave the game.
8. Every new command SHALL have a man page with a MODERN NOTE.

## Requirement 2: Levels

1. Each level SHALL follow its row in `story.md`: trick, solution, spells and
   lesson card.
2. Level 2 SHALL NOT complete when the player deletes the fake mail before
   viewing its full headers; Nell SHALL ask them to check first.
3. Level 3 SHALL complete only when every locked file is readable again.
4. Level 4: running `rm -rf ~` (typed, or via the assistant's button) SHALL
   get the player eaten and restore the level; declining before reading
   `man rm` SHALL make the assistant push harder; declining after it SHALL
   complete the level.
5. Level 5 SHALL complete on a `diff` of `messages.0` and `messages` (either
   order).
6. Boss: killing `jack-o-daemon` while `/usr/lib/jack/jack-o-daemon` exists
   SHALL bring it back on the player's next command; after the file is
   removed, killing it SHALL complete the level.

## Requirement 3: Quality

1. Every level SHALL be completable despite random noise between solution
   steps and from every beat (existing property tests extended).
2. All in-world text SHALL follow the period-accuracy rules, except text that
   belongs to Jack.
3. Nell's lines SHALL follow the persona limits (enforced by tests).
