import { banner, parseMbox } from '../mail/mailbox.js'
import type { Command } from '../shell/types.js'
import { stderr, stdout } from '../shell/types.js'

export const spoolPath = (user: string) => `/usr/spool/mail/${user}`

/** `mail`: open the user's spool in Berkeley Mail (the game runs the & prompt). */
export const mail: Command = (args, ctx) => {
  if (args.some((a) => !a.startsWith('-'))) {
    return { lines: [stderr('Sorry, sending mail is disabled for the guest account.')], status: 1 }
  }
  const { user } = ctx.session
  const path = spoolPath(user)
  const content = ctx.vfs.readFile(path, { cwd: '/', home: ctx.session.home, user })
  const box = content.ok ? parseMbox(content.value, path, user) : null
  if (box === null || box.messages.length === 0) return { lines: [stdout(`No mail for ${user}`)], status: 1 }
  return { lines: banner(box).map(stdout), status: 0, mode: { kind: 'mail', box } }
}
