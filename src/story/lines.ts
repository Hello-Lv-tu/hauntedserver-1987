/**
 * Every pre-written line in the game. Nell's lines follow
 * .kiro/steering/ghost-persona.md: lowercase, at most 3 lines and under 200
 * characters per message, ASCII smileys only. Jack-o'-Daemon is deliberately
 * modern (™, corporate cheer; the UI adds his pumpkin icon). No emoji: not every
 * system has an emoji font. Each beat has at least two variants so
 * these can serve as AI fallbacks later.
 */
import type { LessonCard } from './types'

type Message = readonly string[]
type Variants = readonly Message[]

export const NELL = {
  sos: [['is someone there?? please. the pumpkin thing locked me in.', "type: write nell   (it can't hear us that way)"]],

  /** Generic: the player typed a command while still in write mode. */
  stillWriting: [
    ["psst, you're still writing to me! :-P", 'press ctrl-d (or type EOF) first, then run it.'],
    ['that looks like a command, silly.', "you're in write mode. ctrl-d or EOF gets you out ;-)"],
  ],
  /** Generic: anything else written to her that the beat doesn't care about. */
  chatter: [['hm? :-)', 'sorry, keeping one eye on the pumpkin.'], ['uh huh. :-)', 'focus, partner! we have a pumpkin to beat.']],

  // Level 0
  greet: [
    ["hi!! you came :-) i'm nell.", 'the pumpkin watches normal files, so i hid a note for you.', 'its name starts with a dot. dot-files only show with `ls -a`.'],
    ["a real person!! hi, i'm nell :-O", 'jack (the pumpkin) reads every normal file but skips dot-files.', 'i left you one. leave write mode, then try `ls -a`.'],
  ],
  huntChatter: [['`ls -a`!! the a means ALL. even the sneaky ones.'], ['psst. dot-files. `ls -a`. go go go ;-)']],
  foundNote: [['see it? the one with the dot!', 'notebooks open with `cat`. ;-)'], ['THERE. .from_nell. that one is me.', 'open it with `cat`!']],
  readChatter: [['cat it! `cat .from_nell`'], ["it's right there, silly :-P"]],
  readNote: [
    ['you read it!! we have a secret channel now ;-)'],
    ['yay!! now you know what i know. we are a team :-)'],
  ],

  // Level 1
  popupWarn: [
    ['uh oh. he noticed us.', "DON'T click anything he shows you!!", 'if you get stuck, type `hint`.'],
    ["oh no oh no. that's him.", "whatever his window says, DON'T click it!!", '`hint` helps if you get stuck.'],
  ],
  popupChatter: [
    ["don't touch his button!! see what's running: `ps aux`"],
    ["he's just a program. programs show up in `ps`. ;-)"],
  ],
  popupNag: [['see? closing it does nothing. he just comes back.', 'find the program instead: `ps aux`'], ['ugh, he always does that.', "don't fight the window. find what's drawing it."]],
  foundProc: [
    ['THERE. pumpkin_upd8r. not mine!!', 'every program has a number, its PID. `man kill` ;-)'],
    ['see the weird one? pumpkin_upd8r.', "the number next to it is its PID. you know what to do... `man kill`"],
  ],
  foundChatter: [['the PID is the number in the second column!'], ['kill + the PID. bonk. :-)']],
  killedPopup: [['BONK!! it is GONE!! :-D', 'nell 1, pumpkin 0.'], ['you did it!! no more popup :-D', 'scoreboard: nell 1, pumpkin 0.']],

  // End of this slice
  toBeContinued: [
    ["he'll be back. he always comes back. :-(", 'but i heard mail arrive... maybe someone knows what he is.', '(to be continued)'],
  ],
  endChatter: [['rest a bit, partner. come back soon :-)'], ["i'll be here. i'm always here. ;-)"]],
} satisfies Record<string, Variants>

export const JACK = {
  appear: [['Hi there! Jack-o\'-Daemon here, your friendly Modernization Assistant™.', 'I found 1 legacy user on this system. Let\'s fix that!']],
  eaten: [
    ['Yum! Legacy users taste like floppy disks.', 'Restoring you to factory settings...'],
    ['Thank you for upgrading! Your session has been modernized.', 'Please try again. Resistance is deprecated.'],
  ],
  killed: [['Connection lost. I\'ll be back with a better offer!']],
} satisfies Record<string, Variants>

/** Jack's popup messages, shown in order each time it comes back. */
export const POPUP_MESSAGES: readonly { title: string; body: string }[] = [
  {
    title: 'CRITICAL: 1,987 viruses detected!',
    body: 'Your legacy system is infected. Click FIX NOW to upgrade to Jack-o\'-Daemon Cloud™ before all data is lost.',
  },
  { title: 'Are you sure?', body: '99% of users who closed this window lost everything. Don\'t be the 1%.' },
  { title: 'Still here?', body: 'Your files will be modernized (deleted) automatically. One click keeps them safe!' },
  { title: 'We noticed you are ignoring us.', body: 'That\'s okay. We\'re patient. Click FIX NOW whenever you\'re ready.' },
]

export const SCAREWARE_LESSON: LessonCard = {
  title: 'Lesson: scareware',
  body: 'Jack\'s popup copies a real trick. Fake warnings scream that your computer is infected and push one big button. The button is the attack: it installs malware or leads to a scam.',
  tips: [
    'Real system warnings don\'t count down or beg you to click.',
    'Don\'t click inside the popup. Close the tab or window instead.',
    'If it keeps coming back, find the program behind it (Task Manager, Activity Monitor, or `ps`) and stop it.',
  ],
}

export const DEMO_END_LINE = '*** End of the demo for now. Thanks for playing! More levels are on the way. ***'
