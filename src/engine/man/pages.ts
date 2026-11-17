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
  help: {
    section: 1,
    name: 'help - list the commands on this terminal',
    synopsis: 'help',
    description: ['List the commands you can use, then try `man name` for any of them.'],
    modern: ['Real 4.3BSD had no `help`; it was added to this terminal for visitors.'],
  },
}

export function manPage(name: string): string[] | null {
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
    'MODERN NOTE',
    ...indent(page.modern),
  ]
}

export const MAN_PAGE_NAMES = Object.keys(PAGES)
