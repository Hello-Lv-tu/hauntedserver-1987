import { loggedIn, shortTty } from '../procs/types.js'
import type { Command } from '../shell/types.js'
import { hint, stderr, stdout } from '../shell/types.js'
import { pathCtx } from './common.js'

/**
 * period: 4.3BSD finger. Short form lists logged-in users; long form
 * (`finger user`) shows the passwd entry, login time and the .plan.
 */
export const finger: Command = (args, ctx) => {
  const names = args.filter((a) => !a.startsWith('-'))
  const users = ctx.vfs.users
  if (names.length === 0) {
    const header = 'Login    Name               TTY Idle When     Office'
    const rows = loggedIn(ctx.procs).map((p) => {
      const gecos = (users.get(p.user)?.gecos ?? '').split(',')
      const office = gecos.slice(1).join(' ')
      const when = (p.login ?? '').replace(/^\w+ \d+ /, 'Sat ')
      return `${p.user.padEnd(8)} ${gecos[0].padEnd(18)} ${shortTty(p.tty).padStart(3)}      ${when.padEnd(9)}${office}`
    })
    return { lines: [stdout(header), ...rows.map(stdout)], status: 0 }
  }

  const lines = []
  let status = 0
  for (const [i, name] of names.entries()) {
    const entry = users.get(name)
    if (entry === undefined) {
      lines.push(stderr(`finger: ${name}: no such user.`))
      status = 1
      continue
    }
    if (i > 0) lines.push(stdout(''))
    const [realName, ...office] = entry.gecos.split(',')
    lines.push(stdout(`Login name: ${entry.user.padEnd(16)}In real life: ${realName}`))
    if (office.length > 0) lines.push(stdout(`Office: ${office.join(', ')}`))
    lines.push(stdout(`Directory: ${entry.home.padEnd(24)}Shell: ${entry.shell}`))
    const sessions = loggedIn(ctx.procs).filter((p) => p.user === name)
    if (sessions.length === 0) lines.push(stdout('Never logged in.'))
    for (const s of sessions) lines.push(stdout(`On since ${s.login} on ${s.tty}`))
    const plan = ctx.vfs.readFile(`${entry.home}/.plan`, { ...pathCtx(ctx) })
    if (plan.ok && plan.value.trim() !== '') {
      lines.push(stdout('Plan:'))
      lines.push(...plan.value.replace(/\n$/, '').split('\n').map(stdout))
    } else {
      lines.push(stdout('No Plan.'))
    }
  }
  return { lines, status }
}

/** period: 4.3BSD last output, newest first, then "wtmp begins". */
export const last: Command = (args, ctx) => {
  const names = args.filter((a) => !a.startsWith('-'))
  const records = ctx.logins.records.filter((r) => names.length === 0 || names.includes(r.user) || names.includes(r.tty))
  const lines = records.map((r) => {
    const head = `${r.user.padEnd(8)} ${r.tty.padEnd(8)} ${''.padEnd(16)} ${r.login}`
    if (r.logout === null) return stdout(`${head}   still logged in`)
    return stdout(`${head} - ${r.logout.padEnd(5)} ${r.duration ?? ''}`.trimEnd())
  })
  return { lines: [...lines, stdout(''), stdout(`wtmp begins ${ctx.logins.begins}`)], status: 0 }
}

/** `su [user]`: asks for a password (the game handles the password mode). */
export const su: Command = (args, ctx) => {
  const user = args.find((a) => !a.startsWith('-')) ?? 'root'
  if (!ctx.vfs.users.has(user)) return { lines: [stderr(`Unknown login: ${user}`)], status: 1 }
  if (ctx.session.user === 'root') {
    // Root becomes anyone without a password.
    const home = ctx.vfs.homeOf(user) ?? '/'
    return { lines: [], status: 0, session: becomeUser(ctx.session, user, home) }
  }
  return { lines: [], status: 0, mode: { kind: 'password', user } }
}

/** A sub-shell as `user`; `exit` returns to the current session. */
export function becomeUser(session: Parameters<Command>[1]['session'], user: string, home: string) {
  const { user: prevUser, home: prevHome, cwd, parent } = session
  return { ...session, user, home, parent: { user: prevUser, home: prevHome, cwd, ...(parent ? { parent } : {}) } }
}

/** csh `exit` / `logout`: leave a su shell; the login shell stays. */
export const exit: Command = (_args, ctx) => {
  const { parent } = ctx.session
  if (parent === undefined) {
    return { lines: [hint("The door has locked behind you. You can't leave until Nell is free.")], status: 1 }
  }
  const restored = { ...ctx.session, user: parent.user, home: parent.home, cwd: parent.cwd }
  delete (restored as { parent?: unknown }).parent
  return { lines: [], status: 0, session: parent.parent ? { ...restored, parent: parent.parent } : restored }
}
