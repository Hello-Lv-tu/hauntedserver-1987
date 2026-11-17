import type { FileNode } from '../../engine/vfs/types.js'
import { BOTH_MAILS, FAKE_MAIL_ID, NELL_PLAN_L2, PATHS } from '../content.js'
import { JACK_MORE, NELL, PHISHING_LESSON } from '../lines.js'
import { commandEvent, pick, ran } from '../matchers.js'
import type { Beat, Effect, Level, StoryInput, StoryState, Transition } from '../types.js'

const spool: FileNode = { kind: 'file', name: 'guest', owner: 'guest', group: 'guest', mode: 0o600, mtime: '1987-10-31 23:59', content: BOTH_MAILS }
const plan: FileNode = { kind: 'file', name: '.plan', owner: 'nell', group: 'staff', mode: 0o644, mtime: '1987-10-31 23:59', content: NELL_PLAN_L2 }

const deliver: Effect[] = [{ type: 'writeFile', path: PATHS.spool, node: spool }]

const nell = (variants: readonly (readonly string[])[], state: StoryState): Effect => ({ type: 'nell', lines: [...pick(variants, state.turn)] })
const isFake = (input: StoryInput) => input.type === 'mail' && input.messageId === FAKE_MAIL_ID

/** Things that work in every beat of this level. */
function common(input: StoryInput, state: StoryState): Transition | null {
  if (input.type === 'mail' && input.action === 'printAll' && isFake(input)) {
    return { next: 'judge', flags: { sawHeaders: true }, effects: [nell(NELL.l2SawHeaders, state)] }
  }
  if (input.type === 'mail' && input.action === 'delete' && isFake(input)) {
    // The player must look before judging (Requirement 2.2).
    if (!state.flags.sawHeaders) return { effects: [nell(NELL.l2DeletedEarly, state)] }
    return { complete: true, effects: [nell(NELL.l2Done, state), { type: 'lesson', card: PHISHING_LESSON }] }
  }
  // Jack resends his mail if it was deleted without being judged (keeps the level solvable).
  if (input.type === 'mail' && input.action === 'quit' && !(input.kept ?? []).includes(FAKE_MAIL_ID)) {
    return { effects: [...deliver, { type: 'jack', lines: [...pick(JACK_MORE.l2Resend, state.turn)] }] }
  }
  if (input.type === 'wrote' && input.to === 'nell') return { effects: [nell(NELL.l2MailChatter, state)] }
  return null
}

const plan_: Beat = {
  id: 'plan',
  hints: [
    "Nell thinks Jack is reading your writes. She said she'd put the important stuff in her .plan.",
    '`finger nell` shows a user\'s .plan.',
    'Type `finger nell`, then `mail`.',
  ],
  on(input, _ctx, state) {
    const event = commandEvent(input)
    if (event && ran(event, 'finger') && event.args.includes('nell')) return { next: 'mail' }
    if (input.type === 'wrote' && input.to === 'nell') return { effects: [nell(NELL.l2Chatter, state)] }
    return common(input, state)
  },
}

const mail: Beat = {
  id: 'mail',
  hints: [
    'You have mail, and one letter claims to be from Nell. Who really sent it? A display name is easy to fake.',
    'Type `mail`. At the & prompt, `P 2` prints message 2 with ALL its headers.',
    'Type `mail`, then `P 2`. If the headers show it came from somewhere strange, `d 2` deletes it, then `q`.',
  ],
  on: (input, _ctx, state) => common(input, state),
}

const judge: Beat = {
  id: 'judge',
  hints: [
    'Real or fake? 1987 had no iPhones, no ".cloud", and no friend asks for your password.',
    'If it is fake, delete it: `d 2` at the & prompt.',
    'Type `d 2`, then `q`.',
  ],
  on: (input, _ctx, state) => common(input, state),
}

export const level2: Level = {
  id: 2,
  title: 'The letter that lied',
  start: 'plan',
  beats: { plan: plan_, mail, judge },
  enter: [
    ...deliver,
    { type: 'writeFile', path: PATHS.nellPlan, node: plan },
    { type: 'jack', lines: [...JACK_MORE.l2[0]] },
    { type: 'say', lines: ['You have new mail.'] },
    { type: 'nell', lines: [...NELL.l2Start[0]] },
  ],
}
