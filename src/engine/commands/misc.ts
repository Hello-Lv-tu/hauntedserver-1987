import type { Command } from '../shell/types'
import { stdout } from '../shell/types'
import { FROZEN_DATE_STRING } from './common'

export const echo: Command = (args) => {
  const noNewline = args[0] === '-n'
  const words = noNewline ? args.slice(1) : args
  return { lines: [stdout(words.join(' '))], status: 0 }
}

/** period: the clock is frozen; setting the date is not allowed. */
export const date: Command = () => ({ lines: [stdout(FROZEN_DATE_STRING)], status: 0 })

export const whoami: Command = (_args, ctx) => ({ lines: [stdout(ctx.session.user)], status: 0 })

/** csh builtin: numbered history, including this command. */
export const history: Command = (_args, ctx) => ({
  lines: ctx.session.history.map((line, i) => stdout(`${String(i + 1).padStart(6)}  ${line}`)),
  status: 0,
})

export const clear: Command = () => ({ lines: [], status: 0, clear: true })
