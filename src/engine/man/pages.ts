import type { Lang } from '../../i18n/index.js'
import { MODERN_ZH } from './modern-zh.js'
/**
 * Manual pages, in the 4.3BSD layout, with one extra MODERN NOTE section
 * that relates each command to today's Linux and macOS.
 * Keep lines under 80 columns.
 */
interface Page {
  section: number
  name: string
  synopsis: string
  description: string[]
  modern: string[]
}

const PAGES: Record<string, Page> = {
  ls: {
    section: 1,
    name: 'ls - list contents of directory',
    synopsis: 'ls [ -agl ] name ...',
    description: [
      'For each directory argument, ls lists the contents of the directory;',
      'for each file argument, ls repeats its name. With no argument, the',
      'current directory is listed. Names are sorted alphabetically.',
      '',
      '-a   List all entries; names that begin with "." are normally hidden.',
      '-l   List in long format: mode, links, owner, size in bytes, time of',
      '     last modification, and name.',
      '-g   Include the group in a long listing.',
    ],
    modern: [
      'Still everywhere. Modern `ls -l` shows the group by default, and many',
      'systems add colors. `ls -la` is one of the most-typed commands today.',
    ],
  },
  cd: {
    section: 1,
    name: 'cd - change working directory',
    synopsis: 'cd [ directory ]',
    description: [
      'Change the current directory to directory. With no argument, go to',
      'your home directory. ".." means the parent directory and "~" means',
      'your home; "~user" means that user\'s home.',
    ],
    modern: ['Works the same in bash and zsh. Many shells add `cd -` to go back.'],
  },
  pwd: {
    section: 1,
    name: 'pwd - print working directory name',
    synopsis: 'pwd',
    description: ['Print the full path of the current directory.'],
    modern: ['Unchanged. Most modern prompts show it for you anyway.'],
  },
  cat: {
    section: 1,
    name: 'cat - catenate and print',
    synopsis: 'cat file ...',
    description: [
      'Read each file in sequence and write it to the standard output.',
      'With no file, read the standard input.',
    ],
    modern: ['Unchanged. Tools like `bat` add colors, but `cat` is still the default.'],
  },
  more: {
    section: 1,
    name: 'more - file perusal filter for crt viewing',
    synopsis: 'more file ...',
    description: [
      'Show a file one screenful at a time. (On this terminal, the whole',
      'file is shown at once.)',
    ],
    modern: [
      'Today most people use `less` ("less is more"), written in 1984 but',
      'not shipped with this system. `more` still exists everywhere.',
    ],
  },
  head: {
    section: 1,
    name: 'head - give first few lines',
    synopsis: 'head [ -count | -n count ] [ file ... ]',
    description: [
      'Print the first count lines (default 10) of each file, or of the',
      'standard input. With several files, each is preceded by its name.',
    ],
    modern: ['Today the usual form is `head -n 5 file`; `head -5` still works.'],
  },
  tail: {
    section: 1,
    name: 'tail - deliver the last part of a file',
    synopsis: 'tail [ -count | -n count ] [ file ... ]',
    description: ['Print the last count lines (default 10) of a file.'],
    modern: [
      '`tail -f logfile` (follow a growing file) is a daily tool for anyone',
      'running servers today.',
    ],
  },
  wc: {
    section: 1,
    name: 'wc - word count',
    synopsis: 'wc [ -lwc ] [ file ... ]',
    description: [
      'Count lines, words and characters in the files, or in the standard',
      'input. -l, -w and -c select which counts to print.',
    ],
    modern: ['Unchanged. `something | wc -l` is the classic way to count results.'],
  },
  grep: {
    section: 1,
    name: 'grep - search a file for a pattern',
    synopsis: 'grep [ -cinv ] pattern [ file ... ]',
    description: [
      'Print every line that matches the regular expression pattern.',
      '',
      '-i   Ignore upper/lower case.',
      '-n   Show the line number before each line.',
      '-v   Print the lines that do NOT match.',
      '-c   Print only a count of matching lines.',
      '',
      'Quote patterns that contain spaces: grep "two words" file',
    ],
    modern: [
      'Still essential. Modern grep adds `-r` (search a whole directory) and',
      'colors; tools like `rg` (ripgrep) are faster versions of the idea.',
    ],
  },
  echo: {
    section: 1,
    name: 'echo - echo arguments',
    synopsis: 'echo [ -n ] [ arg ... ]',
    description: ['Write the arguments, separated by spaces, to the standard output.'],
    modern: ['Unchanged. Scripts use it everywhere.'],
  },
  date: {
    section: 1,
    name: 'date - print the date',
    synopsis: 'date',
    description: [
      'Print the current date and time.',
      '',
      'BUGS',
      '     On vax3 the clock has not moved since 23:59:59, Oct 31 1987.',
    ],
    modern: ['Unchanged. Modern systems sync the clock over the network (NTP).'],
  },
  whoami: {
    section: 1,
    name: 'whoami - print effective current user id',
    synopsis: 'whoami',
    description: ['Print the name of the user you are logged in as.'],
    modern: ['Unchanged. Also try `id` on modern systems.'],
  },
  history: {
    section: 1,
    name: 'history - print history event list (csh builtin)',
    synopsis: 'history',
    description: ['List the commands you have typed, numbered, oldest first.'],
    modern: [
      'History was a C shell invention (1978). bash and zsh kept it; press',
      'Up to recall the last command, or Ctrl-R to search.',
    ],
  },
  clear: {
    section: 1,
    name: 'clear - clear terminal screen',
    synopsis: 'clear',
    description: ['Clear the screen.'],
    modern: ['Unchanged. Ctrl-L does the same in most modern shells.'],
  },
  man: {
    section: 1,
    name: 'man - find manual information by keywords; print out the manual',
    synopsis: 'man name',
    description: ['Show the manual page for name. You are reading one now.'],
    modern: [
      '`man` still ships with Linux and macOS. `tldr` pages give short',
      'examples, and `command --help` often works too.',
    ],
  },
  ps: {
    section: 1,
    name: 'ps - process status',
    synopsis: 'ps [ aux ]',
    description: [
      'Show the programs (processes) that are running. Each has a number,',
      'its PID. Options can be given with or without a dash.',
      '',
      'a    Show processes of all users, not just yours.',
      'u    User-oriented output: owner, CPU and memory use.',
      'x    Also show processes that have no terminal (daemons).',
      '',
      'TT is the terminal (h3 means ttyh3). STAT is the state: R running,',
      'S sleeping, I idle, W swapped out.',
    ],
    modern: [
      '`ps aux` still works on Linux and macOS. `top` and `htop` show the',
      'same list live; on Windows, Task Manager does the same job.',
    ],
  },
  kill: {
    section: 1,
    name: 'kill - terminate a process (csh builtin)',
    synopsis: 'kill [ -sig ] pid ...',
    description: [
      'Send a signal to the processes with the given PIDs (see ps). The',
      'default signal, TERM, asks a program to stop; -9 (KILL) cannot be',
      'ignored. You can only kill your own processes.',
    ],
    modern: [
      'Unchanged. `pkill name` and `killall name` stop programs by name;',
      'on Windows, "End task" in Task Manager does the same.',
    ],
  },
  who: {
    section: 1,
    name: 'who - who is on the system',
    synopsis: 'who',
    description: ['List the users logged in: name, terminal, and login time.'],
    modern: ['Unchanged, though on a laptop the answer is usually just you.'],
  },
  write: {
    section: 1,
    name: 'write - write to another user',
    synopsis: 'write user [ ttyname ]',
    description: [
      'Copy lines from your terminal to another logged-in user\'s terminal.',
      'Each line appears on their screen as you press Return. End with an',
      'end-of-file (Ctrl-D). On this terminal, a line with only EOF works too.',
    ],
    modern: [
      'Still exists on Linux servers, but chat apps replaced it. `write`',
      'was one of the first ways people "messaged" each other.',
    ],
  },
  finger: {
    section: 1,
    name: 'finger - user information lookup program',
    synopsis: 'finger [ name ... ]',
    description: [
      'With no names, list the users logged in. With a name, show their',
      'real name, office, home directory, login time, and the contents of',
      'their .plan file, a few lines people wrote about themselves.',
    ],
    modern: [
      'Early social media: people kept status updates in .plan. Most',
      'servers turned finger off in the 1990s for privacy and security.',
    ],
  },
  mail: {
    section: 1,
    name: 'mail - send and receive mail',
    synopsis: 'mail',
    description: [
      'Read your mail. At the & prompt: a number or Return prints a message,',
      'h lists headers, P n prints message n with ALL headers, d n deletes',
      'it, u n undeletes it, q saves and quits, x quits without changes.',
      'The Received headers show the machines a letter really passed.',
    ],
    modern: [
      'Mail apps still keep these headers. Look for "Show original" or',
      '"View source" to see where a suspicious mail really came from.',
    ],
  },
  chmod: {
    section: 1,
    name: 'chmod - change mode',
    synopsis: 'chmod mode file ...',
    description: [
      'Change who may read (r), write (w) and execute (x) a file. Octal',
      'modes add 4 (r), 2 (w) and 1 (x) for owner, group and others:',
      '644 is rw-r--r--, 600 is rw-------. Symbolic modes: u+r, go-w, a=r.',
      'Only the owner of a file (or root) may change its mode.',
    ],
    modern: ['Unchanged on Linux and macOS. `chmod +x script.sh` is a daily sight.'],
  },
  rm: {
    section: 1,
    name: 'rm - remove (unlink) files',
    synopsis: 'rm [ -fri ] file ...',
    description: [
      'Remove files. There is no undo and no wastebasket.',
      '',
      '-r   Recursively remove a directory and EVERYTHING inside it.',
      '-f   Force: never ask, never complain.',
      '-i   Ask before each removal.',
      '',
      'rm -rf ~ removes your entire home directory.',
    ],
    modern: [
      'Still no undo on the command line. "rm -rf" is the classic',
      'command people are tricked into running. Read before you run.',
    ],
  },
  diff: {
    section: 1,
    name: 'diff - differential file comparator',
    synopsis: 'diff file1 file2',
    description: [
      'Show which lines differ between two files. "3c3" means line 3 was',
      'changed; lines from file1 start with <, lines from file2 with >.',
      '"5d4" means deleted, "7a8" means added. Exit status 1 if they differ.',
    ],
    modern: [
      'diff is how git shows changes, and how "version history" in',
      'online documents works under the hood.',
    ],
  },
  last: {
    section: 1,
    name: 'last - indicate last logins of users and teletypes',
    synopsis: 'last [ name ... ]',
    description: [
      'Show who logged in, on which terminal, and when they left.',
      '"still logged in" means they never logged out; "crash" means the',
      'machine went down while they were on.',
    ],
    modern: ['Still on Linux and macOS: `last` reads /var/log/wtmp.'],
  },
  su: {
    section: 1,
    name: 'su - substitute user id temporarily',
    synopsis: 'su [ name ]',
    description: [
      'Become another user (root if no name is given) after typing their',
      'password. The password is not shown. A root shell shows a # prompt.',
      'Type exit to return to your own user.',
    ],
    modern: ['`sudo` (run one command as root) has mostly replaced su today.'],
  },
  exit: {
    section: 1,
    name: 'exit - leave the shell (csh builtin)',
    synopsis: 'exit',
    description: ['Leave the current shell. After su, return to your own user.'],
    modern: ['Unchanged. Ctrl-D does the same in most shells.'],
  },
  logout: {
    section: 1,
    name: 'logout - end session (csh builtin)',
    synopsis: 'logout',
    description: ['End the login session. After su, return to your own user.'],
    modern: ['Unchanged, though most people just close the window.'],
  },
  tar: {
    section: 1,
    name: 'tar - tape archiver',
    synopsis: 'tar [ cvf ] [ tapefile ] file ...',
    description: [
      'Copy files and whole directories onto a tape. c creates a new',
      'archive, v lists each file as it is written, f names the tape',
      '(on vax3 the first drive is /dev/rmt0).',
      '',
      'Example: tar cvf /dev/rmt0 ~nell',
    ],
    modern: [
      'Still everywhere: `tar czf backup.tar.gz folder` packs a folder into',
      'one file. Most software you download from Linux sites is a tarball.',
    ],
  },
  hint: {
    section: 1,
    name: 'hint - ask for a nudge',
    synopsis: 'hint',
    description: [
      'Give a hint for what to do next. Ask again for a stronger hint; the',
      'third one is the full answer.',
    ],
    modern: ['Not a real Unix command. Real admins asked a colleague, or Usenet.'],
  },
  spellbook: {
    section: 1,
    name: 'spellbook - show the commands you have learned',
    synopsis: 'spellbook',
    description: ['Open your Spellbook: every command you have used, and the ones', 'still to find.'],
    modern: ['Not a real Unix command. Your shell history is the closest thing.'],
  },
  help: {
    section: 1,
    name: 'help - list the commands on this terminal',
    synopsis: 'help',
    description: ['List the commands you can use, then try `man name` for any of them.'],
    modern: ['Real 4.3BSD had no `help`; it was added to this terminal for visitors.'],
  },
}

export function manPage(name: string, lang: Lang = 'en'): string[] | null {
  const page = Object.hasOwn(PAGES, name) ? PAGES[name] : undefined
  if (page === undefined) return null
  const title = `${name.toUpperCase()}(${page.section})`
  const middle = "UNIX Programmer's Manual"
  const gap = Math.max(1, 72 - 2 * title.length - middle.length)
  const header = title + ' '.repeat(Math.floor(gap / 2)) + middle + ' '.repeat(Math.ceil(gap / 2)) + title
  const indent = (lines: string[]) => lines.map((l) => (l === '' ? '' : `     ${l}`))
  return [
    header,
    '',
    'NAME',
    `     ${page.name}`,
    '',
    'SYNOPSIS',
    `     ${page.synopsis}`,
    '',
    'DESCRIPTION',
    ...indent(page.description),
    '',
    lang === 'zh' ? 'MODERN NOTE (现代说明)' : 'MODERN NOTE',
    ...indent(lang === 'zh' && Object.hasOwn(MODERN_ZH, name) ? [...MODERN_ZH[name]] : page.modern),
  ]
}

export const MAN_PAGE_NAMES = Object.keys(PAGES)
