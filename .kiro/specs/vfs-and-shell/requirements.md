# Requirements: Virtual filesystem and shell

## Introduction

This spec covers the game's foundation: an in-memory 4.3BSD-style filesystem,
a csh-like command line, the first set of commands, and a minimal terminal UI
so the result is playable in the browser. Story, ghost AI, `ps`, `finger`,
`mail` and `last` are out of scope and get their own specs.

Requirements use EARS phrasing. "The system" means the game engine
(`src/engine/`) unless a requirement names the UI.

## Glossary

- **VFS**: the in-memory virtual filesystem.
- **Session**: per-player shell state (current user, cwd, home, history).
- **Command event**: a record emitted for every executed command, used later
  for learning progress.
- **Hint line**: a UI-only line, styled differently from terminal output,
  that suggests a period-correct alternative.

## Requirement 1: Filesystem model

**User story:** As a game designer, I want an in-memory Unix filesystem
built from a seed file, so that I can author the server's contents as data.

1. THE system SHALL represent files and directories with name, owner, group,
   permission mode (octal), modification time and, for files, text content.
2. WHEN the system is given a JSON seed, THE system SHALL build the VFS from
   it and SHALL reject seeds with duplicate names in one directory or invalid
   modes, reporting the offending path.
3. THE system SHALL compute file size as the byte length of the content.
4. THE system SHALL expose a write API (create, overwrite, delete, change
   mode) used by the story engine and by later player commands (`chmod`,
   `kill`, editing `/usr/lib/crontab`, the player's `.plan`). The commands
   in this spec are read-only; WHEN later commands write, THE system SHALL
   apply the same permission checks as for reads, using write bits.

## Requirement 2: Path resolution

**User story:** As a player, I want paths to behave like a real Unix shell,
so that what I learn transfers to real systems.

1. THE system SHALL resolve absolute paths, relative paths, `.`, `..`, `~`,
   `~user`, and repeated or trailing slashes.
2. WHEN `..` is applied at `/`, THE system SHALL stay at `/`.
3. WHEN any path component does not exist, THE system SHALL return a
   "No such file or directory" error.
4. WHEN a non-final component is a file, THE system SHALL return a
   "Not a directory" error.

## Requirement 3: Permissions

**User story:** As a game designer, I want some files to be unreadable at
first, so that I can gate clues.

1. THE system SHALL check read permission on files and read+execute
   permission on directories using owner/other bits for the session user.
2. WHEN the session user is `root`, THE system SHALL allow all reads.
3. WHEN permission is denied, THE system SHALL return a "Permission denied"
   error and SHALL NOT reveal file content or directory entries.

## Requirement 4: Command line parsing

**User story:** As a player, I want quoting and pipes to work, so that I can
write commands like `grep -i "ttyh3" /usr/adm/messages | head`.

1. THE system SHALL split input on unquoted whitespace.
2. THE system SHALL support single quotes (literal), double quotes, and
   backslash escapes.
3. THE system SHALL support pipelines with `|`, passing each stage's stdout
   to the next stage's stdin.
4. WHEN quotes are unbalanced, THE system SHALL print the csh error
   `Unmatched '.` or `Unmatched ".` and run nothing.
5. WHEN the input contains `>`, `>>`, `<`, `;`, `&&` or backticks,
   THE system SHALL print `Sorry, that is not supported on this terminal.`
   and run nothing.
6. WHEN the input is empty or only whitespace, THE system SHALL print a new
   prompt and record nothing.
7. FOR ALL input strings, THE system SHALL return a result and SHALL NOT
   throw.

## Requirement 5: Commands

**User story:** As a player, I want the basic commands of a 1987 BSD system,
so that I can explore the server.

1. THE system SHALL implement: `ls` (`-l`, `-a`, `-g`), `cd`, `pwd`, `cat`,
   `more`, `head` (`-n`), `tail` (`-n`), `wc` (`-l`, `-w`, `-c`), `grep`
   (`-i`, `-n`, `-v`, `-c`), `echo`, `date`, `whoami`, `history`, `clear`,
   `man`, `help`.
2. THE system SHALL format output and error messages as described in
   `.kiro/steering/period-accuracy.md`, including `ls -l` without group
   unless `-g` is given.
3. `more` SHALL print the whole file (no paging) in this version.
4. `grep` SHALL treat the pattern as a basic regular expression; WHEN the
   pattern is invalid, THE system SHALL print `grep: RE error` instead of
   throwing.
5. `date` SHALL print the frozen clock `Sat Oct 31 23:59:59 EST 1987`.
6. `help` SHALL list available commands and point to `man`.
7. WHEN a command is given an unknown flag, THE system SHALL print a
   usage line in the style `usage: ls [-agl] [file ...]`.

## Requirement 6: Unknown and modern commands

**User story:** As a learner, I want a nudge when I type a modern command,
so that I learn both the old and the current way.

1. WHEN the command name is unknown, THE system SHALL print
   `<name>: Command not found.`
2. WHEN the unknown name is in the modern-commands table (`sudo`, `less`,
   `vim`, `nano`, `top`, `apt`, `curl`, `ssh`, `git`, `python`, `bash`,
   and DOS habits such as `cls` and `dir`), THE system SHALL also return a
   hint naming the 1987 equivalent.

## Requirement 7: man pages

**User story:** As a learner, I want `man <command>` to explain each
command, so that I can learn without leaving the game.

1. THE system SHALL provide a man page for every implemented command with
   NAME, SYNOPSIS, DESCRIPTION and a MODERN NOTE section relating it to
   today's Linux/macOS.
2. WHEN no page exists, THE system SHALL print `No manual entry for <name>.`

## Requirement 8: Command events

**User story:** As a learner, I want the game to track which commands I have
used, so that I can see my progress.

1. WHEN a non-empty line is executed, THE system SHALL emit one command event
   per pipeline stage with the command name, arguments, exit status, cwd and
   a sequence number.
2. THE system SHALL keep the session history in order and expose it to the
   `history` command.

## Requirement 9: Minimal terminal UI

**User story:** As a player, I want to type into a CRT-styled terminal, so
that I can play right away.

1. THE UI SHALL show scrollback, a prompt with the current directory, and an
   input line that keeps focus when the player clicks the terminal.
2. WHEN the player presses Up/Down, THE UI SHALL walk through history.
3. WHEN the player presses Tab, THE UI SHALL complete a unique command name
   or path; WHEN several matches exist, THE UI SHALL list them.
4. THE UI SHALL render stderr and hint lines in distinct styles and SHALL
   honor `prefers-reduced-motion`.
5. THE UI SHALL be usable with a screen reader: output in a live region and a
   labelled input.
