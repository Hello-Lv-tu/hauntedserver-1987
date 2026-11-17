import { lookup } from '../engine/commands/registry.js'
import { becomeUser } from '../engine/commands/users.js'
import { mailCommand } from '../engine/mail/mailbox.js'
import { execute } from '../engine/shell/execute.js'
import { findProc, withProc, withoutProc } from '../engine/procs/types.js'
import { tildify } from '../engine/vfs/path.js'
import { levelEntry, storyStep } from '../story/engine.js'
import { ASSISTANT_MESSAGES, POPUP_MESSAGES } from '../story/lines.js'
import { checkPassword } from '../story/secrets.js'
import { LOGINS } from '../story/seed/logins.js'
import { spellFor } from '../story/spells.js'
import type { Effect, StoryCtx, StoryInput } from '../story/types.js'
import { createWorld } from '../story/world.js'
import type { SaveData } from './save.js'
import type { Settings } from './settings.js'
import { DEFAULT_SETTINGS } from './settings.js'
import type { GameInput, GameState, LineKind } from './types.js'

/** Scrollback kept on screen; older lines are dropped. */
const MAX_SCREEN_LINES = 600
/** Seconds a closed popup stays away before coming back. */
export const POPUP_RETURN_SECONDS = 3

export const BOOT_LINES = [
  '4.3 BSD UNIX #12: Tue Oct 27 03:14:07 EST 1987',
  '    root@vax3.cs.ravenmoor.edu:/usr/src/sys/GENERIC',
  'real mem  = 16777216',
  'avail mem = 14680064',
  '',
  'vax3.cs.ravenmoor.edu login: guest',
  'Last login: Sat Oct 31 23:59:59 1987 on ttyh3',
]

export function prompt(state: GameState): string {
  if (state.mode.kind === 'write') return ''
  if (state.mode.kind === 'mail') return '& '
  if (state.mode.kind === 'password') return 'Password:'
  // period: csh shows # for root.
  const sign = state.session.user === 'root' ? '#' : '%'
  return `vax3:${tildify(state.session.cwd, state.session.home)}${sign} `
}

/** A fresh game, or one continued from a save. */
export function newGame(options: { save?: SaveData | null; settings?: Settings } = {}): GameState {
  const world = createWorld()
  const save = options.save ?? null
  const entry = levelEntry(save?.level ?? 0, save?.flags ?? {})
  const boot = save ? [...BOOT_LINES, '', `(continuing from level ${save.level})`] : BOOT_LINES
  const base: GameState = {
    vfs: world.vfs,
    procs: world.procs,
    session: world.session,
    mode: { kind: 'shell' },
    story: entry.story,
    spells: save?.spells ?? [],
    popup: null,
    assistant: null,
    cards: [],
    screen: boot.map((text, id) => ({ id, kind: 'system', text })),
    nextId: boot.length,
    settings: options.settings ?? DEFAULT_SETTINGS,
    checkpoint: { vfs: world.vfs, procs: world.procs, session: world.session, level: entry.story.level, flags: entry.story.flags },
    save: { version: 1, level: entry.story.level, spells: save?.spells ?? [], flags: { ...entry.story.flags } },
    glitch: 0,
    finished: false,
    panel: null,
    pendingVoices: [],
    nextVoiceId: 1,
    chatLog: [],
  }
  return applyEffects(base, entry.effects)
}

/** The whole game advances only through this pure function. */
export function step(state: GameState, input: GameInput): GameState {
  switch (input.type) {
    case 'line':
      switch (state.mode.kind) {
        case 'write':
          return writeLine(state, input.text)
        case 'mail':
          return mailLine(state, input.text)
        case 'password':
          return passwordLine(state, input.text)
        case 'shell':
          return shellLine(state, input.text)
      }
      break

    case 'eof':
      if (state.mode.kind === 'write' || state.mode.kind === 'password') return { ...state, mode: { kind: 'shell' } }
      // period: ^D at Mail's & prompt quits, like q.
      if (state.mode.kind === 'mail') return mailLine(state, 'q')
      // period: csh with `ignoreeof` set, as on most 1987 systems.
      return print(state, [['stderr', 'Use "logout" to logout.']])

    case 'interrupt': {
      const shown = state.mode.kind === 'password' ? '' : input.text
      const echoed = print(state, [[state.mode.kind === 'write' ? 'written' : 'prompt', prompt(state) + shown + '^C']])
      // Write and su give up on ^C; Mail ignores it (period: "Interrupt").
      if (state.mode.kind === 'mail') return print(echoed, [['stdout', 'Interrupt']])
      return state.mode.kind === 'shell' ? echoed : { ...echoed, mode: { kind: 'shell' } }
    }

    case 'popup':
      return story(state, { type: 'popup', action: input.action })

    case 'assistant':
      if (state.assistant === null) return state
      // "Run it for me" really runs it, so the player sees what it does.
      if (input.action === 'run') return shellLine(state.mode.kind === 'shell' ? state : { ...state, mode: { kind: 'shell' } }, ASSISTANT_COMMAND)
      return story(state, { type: 'assistant', action: 'decline' })

    case 'tick':
      return tick(state, input.paused ?? false)

    case 'dismissCard':
      return { ...state, cards: state.cards.slice(1) }

    case 'settings':
      return { ...state, settings: input.settings }

    case 'panel':
      return { ...state, panel: input.panel }

    case 'clearScreen':
      return { ...state, screen: [] }

    case 'voice': {
      const pending = state.pendingVoices.find((p) => p.id === input.id)
      if (pending === undefined) return state
      const rest = { ...state, pendingVoices: state.pendingVoices.filter((p) => p.id !== input.id) }
      return nellMessage(rest, input.lines ?? pending.fallback)
    }
  }
}

function shellLine(state: GameState, text: string): GameState {
  let next = print(state, [['prompt', prompt(state) + text]])
  const result = execute(text, next.vfs, next.session, next.procs, LOGINS)
  next = { ...next, vfs: result.vfs, procs: result.procs, session: result.session }
  next = result.clear ? { ...next, screen: [] } : print(next, result.lines.map((l) => [l.stream, l.text]))
  if (result.mode) next = { ...next, mode: result.mode }
  if (result.request === 'spellbook') next = { ...next, panel: 'spellbook' }

  // Spells: the first successful use of each spell command.
  for (const event of result.events) {
    const spell = event.status === 0 ? spellFor(event.name) : undefined
    if (spell && !next.spells.includes(spell.command)) {
      const spells = [...next.spells, spell.command]
      next = { ...next, spells, cards: [...next.cards, { kind: 'spell', spell }], save: { ...next.save, spells } }
    }
  }

  // Typed a sentence (or a typo) at the shell: point to write and help.
  const [only] = result.events
  const alreadyHinted = result.lines.some((l) => l.stream === 'hint')
  if (result.events.length === 1 && only.status !== 0 && lookup(only.name) === undefined && !alreadyHinted && !only.name.includes('/')) {
    next = print(next, [['hint', 'That is not a command. To talk to Nell, type `write nell` first. `help` lists the commands.']])
  }

  if (result.request === 'hint') next = story(next, { type: 'hint' })
  for (const event of result.events) next = story(next, { type: 'command', event })
  return next
}

function writeLine(state: GameState, text: string): GameState {
  // A line with only EOF ends write mode (for keyboards without Ctrl-D).
  // Like Ctrl-D in real write, it is not echoed.
  if (text.trim() === 'EOF') return { ...state, mode: { kind: 'shell' } }
  const printed = print(state, [['written', text]])
  if (printed.mode.kind !== 'write') return printed
  const next = { ...printed, chatLog: remember(printed.chatLog, { from: 'player', text }) }
  return story(next, { type: 'wrote', to: printed.mode.to, text })
}

/** The command Jack's assistant pushes in Level 4. */
export const ASSISTANT_COMMAND = 'rm -rf ~'

function mailLine(state: GameState, text: string): GameState {
  if (state.mode.kind !== 'mail') return state
  const echoed = print(state, [['prompt', `& ${text}`]])
  const result = mailCommand(state.mode.box, text)
  let next = print(echoed, result.lines.map((l) => ['stdout', l]))
  next = { ...next, mode: result.done ? { kind: 'shell' } : { kind: 'mail', box: result.box } }
  if (result.spool !== undefined) {
    const spool = next.vfs.stat(result.box.path, { cwd: '/', home: '/', user: 'root' })
    if (spool.ok && spool.value.kind === 'file') {
      const written = next.vfs.write(result.box.path, { ...spool.value, content: result.spool })
      if (written.ok) next = { ...next, vfs: written.value }
    }
  }
  for (const action of result.actions) next = story(next, { type: 'mail', ...action })
  return next
}

function passwordLine(state: GameState, password: string): GameState {
  if (state.mode.kind !== 'password') return state
  const { user } = state.mode
  // The password itself is never echoed or stored.
  let next = print(state, [['prompt', 'Password:']])
  const ok = checkPassword(user, password)
  const session = ok ? becomeUser(next.session, user, next.vfs.homeOf(user) ?? '/') : next.session
  if (!ok) next = print(next, [['stderr', 'Sorry']])
  const event = { seq: session.seq, name: 'su', args: [user], status: ok ? 0 : 1, cwd: session.cwd }
  next = { ...next, mode: { kind: 'shell' }, session: { ...session, seq: session.seq + 1 } }
  return story(next, { type: 'command', event })
}

function tick(state: GameState, paused: boolean): GameState {
  const popup = state.popup
  if (popup === null || state.finished || paused || state.cards.length > 0 || state.panel !== null) return state
  if (popup.hiddenFor > 0) return { ...state, popup: { ...popup, hiddenFor: popup.hiddenFor - 1 } }
  const secondsLeft = popup.secondsLeft - 1
  if (secondsLeft > 0) return { ...state, popup: { ...popup, secondsLeft } }
  return story({ ...state, popup: { ...popup, secondsLeft: 0 } }, { type: 'popup', action: 'timeout' })
}

function story(state: GameState, input: StoryInput): GameState {
  const ctx: StoryCtx = { vfs: state.vfs, procs: state.procs, home: state.session.home, user: state.session.user }
  const result = storyStep(state.story, input, ctx)
  return applyEffects({ ...state, story: result.story }, result.effects)
}

function applyEffects(state: GameState, effects: Effect[]): GameState {
  let s = state
  for (const effect of effects) {
    switch (effect.type) {
      case 'nell':
        s = nellMessage(s, effect.lines)
        break
      case 'nellVoice': {
        // History excludes the message being answered (the last chat entry).
        const history = s.chatLog.slice(0, -1)
        const request = { level: s.story.level, beat: s.story.beat, chats: s.story.chats, text: effect.text, history }
        s = {
          ...s,
          pendingVoices: [...s.pendingVoices, { id: s.nextVoiceId, request, fallback: effect.fallback }],
          nextVoiceId: s.nextVoiceId + 1,
        }
        break
      }
      case 'jack':
        s = print(s, effect.lines.map((t) => ['jack', t]))
        break
      case 'hint':
        s = print(s, [['hint', effect.text]])
        break
      case 'say':
        s = print(s, effect.lines.map((t) => ['system', t]))
        break
      case 'writeFile': {
        const written = s.vfs.write(effect.path, effect.node)
        if (written.ok) s = { ...s, vfs: written.value }
        break
      }
      case 'setMode': {
        const found = s.vfs.stat(effect.path, { cwd: '/', home: '/', user: 'root' })
        if (found.ok) {
          const written = s.vfs.write(effect.path, { ...found.value, mode: effect.mode })
          if (written.ok) s = { ...s, vfs: written.value }
        }
        break
      }
      case 'startProc':
        s = { ...s, procs: withProc(s.procs, effect.proc) }
        break
      case 'stopProc':
        s = { ...s, procs: withoutProc(s.procs, effect.pid) }
        break
      case 'popup':
        s = { ...s, popup: popupAfter(s, effect.action) }
        break
      case 'assistant':
        s = { ...s, assistant: assistantAfter(s, effect.action) }
        break
      case 'lesson':
        s = { ...s, cards: [...s.cards, { kind: 'lesson', card: effect.card }] }
        break
      case 'levelStart':
        s = {
          ...s,
          checkpoint: { vfs: s.vfs, procs: s.procs, session: s.session, level: effect.level, flags: s.story.flags },
          save: { version: 1, level: effect.level, spells: s.spells, flags: { ...s.story.flags } },
        }
        break
      case 'eaten':
        s = restoreCheckpoint(s)
        break
      case 'finished':
        s = { ...s, finished: true, popup: null, assistant: null }
        break
    }
  }
  return s
}

function popupAfter(state: GameState, action: 'show' | 'hide' | 'nag'): GameState['popup'] {
  const full = state.settings.popupSeconds
  if (action === 'show') return { message: 0, secondsLeft: full, hiddenFor: 0 }
  if (action === 'hide' || state.popup === null) return null
  // Closing never works: it comes back with a pushier message.
  return { message: Math.min(state.popup.message + 1, POPUP_MESSAGES.length - 1), secondsLeft: full, hiddenFor: POPUP_RETURN_SECONDS }
}

function assistantAfter(state: GameState, action: 'show' | 'hide' | 'nag'): GameState['assistant'] {
  if (action === 'show') return { message: 0 }
  if (action === 'hide' || state.assistant === null) return null
  return { message: Math.min(state.assistant.message + 1, ASSISTANT_MESSAGES.length - 1) }
}

/**
 * Jack ate the player: put the world back to the start of the level and
 * replay its entry. Spells and history are kept; nothing is lost.
 */
function restoreCheckpoint(state: GameState): GameState {
  const { checkpoint } = state
  // The world resets; what the player learned (story flags) does not.
  const entry = levelEntry(checkpoint.level, { ...checkpoint.flags, ...state.story.flags })
  const restored: GameState = {
    ...state,
    vfs: checkpoint.vfs,
    procs: checkpoint.procs,
    session: { ...checkpoint.session, history: state.session.history, seq: state.session.seq },
    mode: { kind: 'shell' },
    story: entry.story,
    popup: null,
    assistant: null,
    glitch: state.glitch + 1,
  }
  return applyEffects(restored, entry.effects)
}

const CHAT_LOG_SIZE = 8

function remember(log: GameState['chatLog'], entry: GameState['chatLog'][number]): GameState['chatLog'] {
  return [...log, { ...entry, text: entry.text.slice(0, 300) }].slice(-CHAT_LOG_SIZE)
}

/** Print a message from Nell in BSD write format and remember it as context. */
function nellMessage(state: GameState, lines: string[]): GameState {
  // period: the banner BSD write prints on the recipient's terminal.
  const printed = print(state, [['nell', ''], ['nell', 'Message from nell@vax3 on ttyp0 at 23:59 ...'], ...lines.map((t) => ['nell', t] as const), ['nell', 'EOF']])
  return { ...printed, chatLog: remember(printed.chatLog, { from: 'nell', text: lines.join(' ') }) }
}

export function print(state: GameState, lines: readonly (readonly [LineKind, string])[]): GameState {
  if (lines.length === 0) return state
  const added = lines.map(([kind, text], i) => ({ id: state.nextId + i, kind, text }))
  const screen = [...state.screen, ...added]
  return {
    ...state,
    screen: screen.length > MAX_SCREEN_LINES ? screen.slice(-MAX_SCREEN_LINES) : screen,
    nextId: state.nextId + added.length,
  }
}

/** Useful for tests and the UI: is Jack's popup process still running? */
export function popupRunning(state: GameState, pid: number): boolean {
  return findProc(state.procs, pid) !== undefined
}

