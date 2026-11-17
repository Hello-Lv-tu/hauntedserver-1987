import { manPage } from '../man/pages.js'
import type { Command } from '../shell/types.js'
import { stderr, stdout } from '../shell/types.js'
import { columns, ls } from './ls.js'
import { clear, date, echo, history, whoami } from './misc.js'
import { cd, pwd } from './navigation.js'
import { hintCommand, kill, ps, spellbook, who, write } from './procs.js'
import { cat, grep, head, more, tail, wc } from './text.js'

const man: Command = (args) => {
  const name = args[0]
  // period: the real 4.3BSD wording.
  if (name === undefined) return { lines: [stderr('What manual page do you want?')], status: 1 }
  const page = manPage(name)
  if (page === null) return { lines: [stderr(`No manual entry for ${name}.`)], status: 1 }
  return { lines: page.map(stdout), status: 0 }
}

const help: Command = () => ({
  lines: [
    stdout('Commands on this terminal:'),
    stdout(''),
    ...columns(COMMAND_NAMES, 72).map((l) => stdout(`  ${l}`)),
    stdout(''),
    stdout('Type `man name` to learn about a command, e.g. `man ls`.'),
  ],
  status: 0,
})

export const registry: Readonly<Record<string, Command>> = {
  cat,
  cd,
  clear,
  date,
  echo,
  grep,
  head,
  help,
  hint: hintCommand,
  history,
  kill,
  ls,
  man,
  more,
  ps,
  pwd,
  spellbook,
  tail,
  wc,
  who,
  whoami,
  write,
}

export const COMMAND_NAMES = Object.keys(registry).sort()

export function lookup(name: string): Command | undefined {
  return Object.hasOwn(registry, name) ? registry[name] : undefined
}
