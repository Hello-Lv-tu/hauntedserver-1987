import { findProc } from '../../engine/procs/types.js'
import { PATHS } from '../content.js'
import { JACK_MORE, NELL, PERSISTENCE_LESSON } from '../lines.js'
import { commandEvent, killed, pick, readsFile } from '../matchers.js'
import { JACK_PID, JACK_PROC } from '../seed/procs.js'
import type { Beat, Effect, Level, StoryCtx, StoryInput, StoryState, Transition } from '../types.js'

const nell = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'nell', lines: [...pick(variants, state.turn)] })
const jack = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'jack', lines: [...pick(variants, state.turn)] })

const binaryExists = (ctx: StoryCtx) => ctx.vfs.stat(PATHS.jackBin, { cwd: '/', home: '/', user: 'root' }).ok

/**
 * The fight, valid from any beat:
 * - kill while his program exists: he is gone until the next command, when
 *   cron "runs again" and he respawns (deterministic, no timers);
 * - kill after the program is removed: he is gone for good.
 */
function fight(input: StoryInput, ctx: StoryCtx, state: StoryState): Transition | null {
  const event = commandEvent(input)
  if (event && killed(event, ctx, JACK_PID)) {
    if (!binaryExists(ctx)) {
      return { complete: true, effects: [jack(JACK_MORE.bossDone, state), nell(NELL.bossDone, state), { type: 'lesson', card: PERSISTENCE_LESSON }] }
    }
    return { flags: { respawnPending: true }, effects: [jack(JACK_MORE.bossKilled, state)] }
  }
  if (event && state.flags.respawnPending && findProc(ctx.procs, JACK_PID) === undefined) {
    // Cron ran again: Jack is back (unless his program is gone).
    if (!binaryExists(ctx)) return { flags: { respawnPending: false }, effects: [nell(NELL.bossBinGone, state)] }
    return {
      next: state.beat === 'cron' ? 'cron' : 'respawn',
      flags: { respawnPending: false },
      effects: [{ type: 'startProc', proc: JACK_PROC }, jack(JACK_MORE.bossBack, state), nell(NELL.bossRespawn, state)],
    }
  }
  if (event && readsFile(event, ctx, PATHS.crontab)) return { next: 'cron', effects: [nell(NELL.bossCron, state)] }
  if (event && event.name === 'rm' && !binaryExists(ctx) && !state.flags.binGone) {
    return { next: 'final', flags: { binGone: true }, effects: [nell(NELL.bossBinGone, state)] }
  }
  return null
}

const chatter = (variants: readonly (readonly string[])[]) => (input: StoryInput, ctx: StoryCtx, state: StoryState) =>
  fight(input, ctx, state) ?? (input.type === 'wrote' && input.to === 'nell' ? { effects: [nell(variants, state)] } : null)

const root: Beat = {
  id: 'root',
  hints: [
    'Only root can stop a root process. `su` asks for the root password: "the usual troublemaker", something that always breaks.',
    "Nell's notes (`cat ~nell/notes`) and Prof. Hale's mail both mention the thing that keeps breaking.",
    'Type `su`, then the password `tape3`.',
  ],
  on(input, ctx, state) {
    const event = commandEvent(input)
    if (event && event.name === 'su' && event.status === 0 && event.args[0] === 'root') {
      return fight(input, ctx, state) ?? { next: 'strike', effects: [nell(NELL.bossRoot, state)] }
    }
    return chatter(NELL.bossChatter)(input, ctx, state)
  },
}

const strike: Beat = {
  id: 'strike',
  hints: ['You are root now (the # prompt).', 'Stop his process: `kill 6666`.', 'Type `kill 6666`.'],
  on: chatter(NELL.bossChatter),
}

const respawn: Beat = {
  id: 'respawn',
  hints: [
    'Malware often restarts itself. Find what keeps starting him.',
    'On this machine, scheduled jobs live in /usr/lib/crontab.',
    'Type `cat /usr/lib/crontab`, then `rm /usr/lib/jack/jack-o-daemon`, then `kill 6666`.',
  ],
  on: chatter(NELL.bossCronChatter),
}

const cron: Beat = {
  id: 'cron',
  hints: [
    'Cron runs his program every minute. Remove the program and there is nothing to restart.',
    '`rm` removes a file. You are root, so you may.',
    'Type `rm /usr/lib/jack/jack-o-daemon`, then `kill 6666`.',
  ],
  on: chatter(NELL.bossCronChatter),
}

const final: Beat = {
  id: 'final',
  hints: ['His program is gone. Now stop him for good.', '`kill 6666`.', 'Type `kill 6666`.'],
  on: chatter(NELL.bossCronChatter),
}

export const boss: Level = {
  id: 6,
  title: 'The daemon that came back',
  start: 'root',
  beats: { root, strike, respawn, cron, final },
  enter: [
    { type: 'jack', lines: [...JACK_MORE.boss[0]] },
    { type: 'nell', lines: [...NELL.bossStart[0]] },
  ],
}
