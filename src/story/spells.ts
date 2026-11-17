/**
 * The Spellbook (see "Commands as spells" in .kiro/steering/story.md).
 * A spell is learned the first time its command succeeds.
 */
export interface Spell {
  command: string
  /** In-world name. */
  name: string
  /** One line: what it does in the game and in real life. */
  description: string
}

export const SPELLS: readonly Spell[] = [
  { command: 'ls', name: 'Flashlight', description: 'Light up a directory and see what is in it.' },
  { command: 'cd', name: 'Doorway', description: 'Step into another directory.' },
  { command: 'cat', name: 'Open a notebook', description: 'Print a whole file.' },
  { command: 'more', name: 'Turn the pages', description: 'Read a file a screen at a time.' },
  { command: 'grep', name: 'Follow a scent', description: 'Find the lines that contain a pattern.' },
  { command: 'man', name: 'Read the spell', description: 'Show the manual page for any command.' },
  { command: 'write', name: 'Pass a note', description: 'Send lines to another user. Jack cannot hear it.' },
  { command: 'ps', name: 'Scan the room', description: 'List running programs and their PIDs.' },
  { command: 'kill', name: 'Banishing strike', description: 'Stop a program by its PID.' },
  { command: 'finger', name: 'Knock on a door', description: "Ask about a user and read their .plan." },
  { command: 'mail', name: 'Open the letters', description: 'Read mail; P shows where a letter really came from.' },
  { command: 'chmod', name: 'Lock and unlock', description: 'Change who may read or change a file.' },
  { command: 'rm', name: 'Erase', description: 'Delete files. Read `man rm` before you trust anyone who tells you to use it.' },
  { command: 'diff', name: 'Spot the difference', description: 'Show exactly which lines changed between two files.' },
  { command: 'last', name: 'Read the guest book', description: 'Who logged in, when, and who never left.' },
  { command: 'su', name: 'Borrow the master key', description: 'Become another user (root) with their password.' },
]

export function spellFor(command: string): Spell | undefined {
  return SPELLS.find((s) => s.command === command)
}
