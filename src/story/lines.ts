/**
 * Every pre-written line in the game. Nell's lines follow
 * .kiro/steering/ghost-persona.md: lowercase, at most 3 lines and under 200
 * characters per message, ASCII smileys only. Jack-o'-Daemon is deliberately
 * modern (™, corporate cheer; the UI adds his pumpkin icon). No emoji: not every
 * system has an emoji font. Each beat has at least two variants so
 * these can serve as AI fallbacks later.
 */
import type { LessonCard } from './types.js'

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
    ["hi!! you came :-) i'm nell.", 'the pumpkin skips dot-files, so i hid a note in one.', 'stop writing (ctrl-d or EOF), then try `ls -a`!'],
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
  // Nell cannot tell scareware from a real warning (see ghost-persona.md);
  // she only knows that a program draws everything on the screen.
  popupWarn: [
    ['1,987 VIRUSES?! is that bad?? it looks so... shiny.', 'should we press FIX?? you know 2026 stuff. you decide!', "(i know this machine though. type `hint` if you're stuck)"],
    ['eek, what IS that window?? i have never seen one like it.', 'is FIX NOW good?? you are the 2026 expert, not me!', '(stuck? type `hint`)'],
  ],
  popupChatter: [
    ["i don't get his window. but i get this machine: a program draws it.", '`ps aux` shows every program running.'],
    ['whatever it is, some program is drawing it. programs show up in `ps`. ;-)'],
  ],
  popupNag: [['it came back?! so closing it does nothing.', 'something keeps drawing it. find the program: `ps aux`'], ['huh. it reopened by itself.', 'on this machine that means a process is doing it.']],
  foundProc: [
    ['THERE. pumpkin_upd8r. not mine!!', 'every program has a number, its PID. `man kill` ;-)'],
    ['see the weird one? pumpkin_upd8r.', "the number next to it is its PID. you know what to do... `man kill`"],
  ],
  foundChatter: [['the PID is the number in the second column!'], ['kill + the PID. bonk. :-)']],
  killedPopup: [['BONK!! it is GONE!! :-D', 'nell 1, pumpkin 0.'], ['you did it!! no more popup :-D', 'scoreboard: nell 1, pumpkin 0.']],

  // Level 2: phishing. Nell knows she sent no mail and how headers work;
  // judging it a scam is the player's job.
  l2Start: [["eek. i think he's reading our writes now :-O", "i'll put the important stuff in my .plan. he never looks there.", 'read it with `finger nell`.']],
  l2Chatter: [['shh! plans, not writes. `finger nell` ;-)'], ["careful what you write, he might be listening. my .plan has it."]],
  l2SawHeaders: [
    ['Received: from ... jack-o-daemon.cloud?? what is a ".cloud"?', "that's not a machine i know, and it's not vax3.", "you're the 2026 expert. real or fake? if fake, `d` it."],
    ["huh. that letter never came through vax3's mail at all.", 'some machine called jack-o-daemon.cloud sent it.', 'is that normal in 2026?? you decide. `d 2` deletes it.'],
  ],
  l2DeletedEarly: [["wait, how do you KNOW it's not me? i can't tell!", 'undelete it (`u 2`) and look at ALL its headers: `P 2`']],
  l2MailChatter: [['in mail, `P 2` shows every header, even the hidden ones.'], ['the Received lines say where a letter REALLY came from.']],
  l2Done: [['gone! good call, 2026 person.', "i'd have believed it. it had my NAME on it :-("], ['deleted!! i never would have spotted that.', 'nell 2, pumpkin 0. well. YOU 2.']],

  // Level 3: ransomware. Nell knows ls -l and chmod, not ransomware.
  l3Start: [['NO. my README... your files... are they gone forever?? :-(', 'he says we have to PAY. what is "per month"??', 'wait. first: `ls -l` (little L, as in list). look closely.']],
  l3Looked: [
    ['look! the size column: the bytes are all still there.', 'and ---------- in front means nobody may read them.', 'that is just permission bits. `man chmod` ;-)'],
    ["ha! the files aren't empty, look at the sizes.", 'he only flipped the permission bits to ---------.', 'bits can be flipped back. `man chmod`'],
  ],
  l3Chatter: [['`ls -l` shows the permission bits. r means read.'], ['chmod 644 means: you read+write, everyone else reads.']],
  l3Done: [["they're back!! so he never had our files at all.", 'just a locked door and a scary note. :-P'], ['unlocked! all the bytes were there the whole time.', 'what a bluff. pumpkin 0, us 3.']],

  // Level 4: the lying assistant. Nell knows "read the manual first".
  l4Start: [["oh! a helper? that's... nice of him? i guess?", "but i never run a command i don't understand.", 'old operator rule: read the manual first. `man rm`'], ['a smart assistant? we never had those.', "operator rule #1: don't run what you haven't read.", '`man rm` before anything!']],
  l4ReadMan: [['-r means everything inside. -f means never ask.', '~ means YOUR home. so `rm -rf ~` deletes everything you have?!', 'would a real helper say that?? you tell me.']],
  l4DeclineEarly: [['wait, wait. what does that command even DO?', "let's read `man rm` first, then decide."]],
  l4Chatter: [['`man rm` first. always read before you run.'], ['what do -r and -f do? the manual knows.']],
  l4Done: [["phew. he sounded SO sure of himself.", "good thing you didn't just believe him."], ['nice. he talked like he knew everything...', 'and he was totally wrong. creepy.']],

  // Level 5: tampered log. Nell knows logs rotate (messages.0).
  l5Start: [['"nell deleted her own account"?! i did NOT.', 'but i cannot prove it... unless... the old log!', "this machine keeps yesterday's as /usr/adm/messages.0"]],
  l5Chatter: [['compare the two logs. `diff` shows what changed.'], ['/usr/adm/messages.0 is the old copy. jack forgot about it ;-)']],
  l5Last: [['see? STILL logged in. i never logged out. never.'], ['crash on ttyh3, then me on ttyp0. still logged in.']],
  l5Done: [
    ['look at the old log: power fail at 23:58...', 'then 23:59:30 "tape 3: writing /usr/users/nell". ME.', 'part of me went onto tape 3. and he hid it!'],
  ],

  // Boss. Nell knows root, su, cron.
  bossStart: [
    ["he's PID 6666 and he runs as root. only root can stop root.", 'root password? hale reset it to "the usual troublemaker".', "what always breaks around here? all lowercase, no space. `su`"],
  ],
  bossChatter: [['hint: my notes. what breaks. always. ;-)'], ['the troublemaker is in my notes AND in hale\'s mail.']],
  bossRoot: [['the # prompt! you are ROOT. careful with that.', 'now: `kill 6666`']],
  bossRespawn: [['he came BACK?! something keeps starting him.', 'on this machine, that is cron. `cat /usr/lib/crontab`']],
  bossCron: [['there! every minute, cron runs /usr/lib/jack/jack-o-daemon.', 'no program, nothing to run. ;-)']],
  bossBinGone: [['his program is gone! now finish it: `kill 6666`']],
  bossCronChatter: [['cron runs his program from /usr/lib/jack. remove it.'], ['`rm /usr/lib/jack/jack-o-daemon` then kill him again!']],
  bossDone: [["HE'S GONE!!! for real this time!!", "i'm... free? i think? :-O"]],
  /** The boss was already beaten before his level (a replay). */
  bossAlreadyGone: [['wait... no pumpkin in `ps aux`, and his program is gone too?!', 'you got him before i even asked :-O', "i'm... free? i think?"]],

  // The choice. Nell gives both of her own wishes; the player decides.
  choose: [
    ["he's gone... but i'm still in here. and you're moving vax3's data out.", 'part of me wants to come and see 2026. part of me wants to guard home.', 'what do you say? tell me: `come with me`, or `stay`.'],
  ],
  chooseChatter: [['so... `come with me`, or `stay`? your call, partner.'], ["i can't decide alone. `come with me` or `stay`?"]],
  pack: [['YES!! ok, pack me up the old way. onto tape:', '`tar cvf /dev/rmt0 ~nell`', '(stop writing first: ctrl-d or EOF)']],
  packChatter: [['tape! `tar cvf /dev/rmt0 ~nell` ;-)'], ["i'm ready. stop writing, then `tar cvf /dev/rmt0 ~nell`"]],
  packed: [["ugh, it's dark in here... wiggle... ok! i'm on tape.", "it's tape 3. of course it's tape 3 :-P"]],
  stayed: [["ok. i'll stay and keep vax3 company.", "if a pumpkin ever pops up again, i'll write you ;-)", 'come back anytime: `write nell`']],

  // Hidden ending: diary, riddle, a line for the next visitor.
  readDiary: [["HEY!! that's my DIARY :-O", '...ok fine. you did save me. you can read it.']],
  riddleSolved: [['KEYBOARD! keys, space, enter. you got it :-O', 'nobody ever solves my riddles.']],
  askLegacy: [['you read my diary AND solved my riddle...', 'write one line for the next person who sneaks in here.', "i'll keep it inside the machine for them."]],
  legacySaved: [["saved. it'll be waiting for them ;-)", 'now... `come with me`, or `stay`?']],

  // After the ending (and on later visits).
  reunionMove: [['hi from 2026!! i still cannot get over the round buttons :-P', 'thanks for bringing me, partner.']],
  reunionStay: [["you're back!! i knew it :-)", 'vax3 and i are fine. no pumpkins. well. one tiny seed, maybe.']],
  endChatter: [['rest a bit, partner :-)'], ["i'll be here. i'm always here. ;-)"]],

  // Postgame (see "Postgame" in story.md). Stay talks through the terminal,
  // Move through the chat window.
  /** Stay: added to the reunion when the player left a line for the next visitor. */
  keepsakeStay: [['your line for the next visitor is safe with me ;-)']],
  /** Move, in the terminal: she does not live on vax3 any more. Never AI-worded. */
  movedAway: [
    ["psst! i don't live on vax3 anymore, remember? :-P", 'i\'m in your 2026 screen now. press "Chat" up top!'],
    ['knock knock... nobody home on vax3! ;-)', 'i moved out on tape 3. find me behind the "Chat" button.'],
  ],
  /** Move: her first messages in the chat window, one bubble per line. */
  moveOpen: [["it's me!! i figured out this typing box. mostly :-P", 'what are all these round buttons FOR?', 'ok. teach me one 2026 thing. just one!']],
  /** Move: she left the visitor line behind on vax3. */
  keepsakeMove: [["oh! i left your line for the next visitor on vax3. it's waiting for them ;-)"]],
  /** Move: the chat on a later visit. */
  moveWelcomeBack: [["you're back!! i kept our whole chat. look, it's all still here :-)"], ['hi again! i pressed a round button while you were gone. just one. :-P']],
  /** Move: chat replies when the AI voice is not available. */
  moveChatter: [
    ["is that a 2026 thing?! i'm writing it down. on paper. :-P"],
    ['ooh. tell me more! in 1987 we had green text and tape drives.'],
    ["hmm! i'll pretend i understood that ;-) say it slower?"],
  ],
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

export const JACK_MORE = {
  l2: [['You have 1 new message from a Trusted Sender™!']],
  l2Resend: [["Oops! Looks like you missed our message. We've resent it for your convenience!"]],
  l3: [["Your legacy files have been secured in the Jack Cloud Vault™.", 'Subscribe for $9.99/month to unlock them. See ~/RANSOM_NOTE']],
  l4: [["Hi! I'm Jack's Smart Assistant™. I'm here to help!"]],
  l4Eaten: [['Disk space freed! Legacy user removed. You are welcome!']],
  l5: [['Good news! Our records show Nell left voluntarily. Case closed!']],
  boss: [['You found me! I am the root of all modernization.', 'Resistance is deprecated. Please upgrade.']],
  bossKilled: [['Connection lost... just kidding! BRB :)']],
  bossBack: [['Miss me? Auto-restart is a Premium feature™!']],
  bossDone: [['Nooo... my subscription... cancelled...']],
} satisfies Record<string, Variants>

/** Jack's assistant bubble, pushier each time the player says no too early. */
export const ASSISTANT_MESSAGES: readonly string[] = [
  "Nell is stuck because your disk is full of legacy files. Run this to free her instantly: rm -rf ~",
  'Are you sure? 10,000 pumpkins rated this fix 4.9 stars! Just run: rm -rf ~',
  "I'm an AI, so I'm always right. Trust me: rm -rf ~",
]

export const PHISHING_LESSON: LessonCard = {
  title: 'Lesson: phishing',
  body: "The mail used Nell's name, but its hidden headers showed it came from Jack's server. Phishing mail fakes a trusted sender to get your password or a click.",
  tips: [
    'No real friend or company asks for your password by mail.',
    'Urgency ("expires in 24 hours!") is a pressure trick.',
    "Check the real sender: the address, not the display name. Today's mail apps can show the full headers too.",
  ],
}

export const RANSOMWARE_LESSON: LessonCard = {
  title: 'Lesson: ransomware',
  body: 'Jack only faked it. Real ransomware does encrypt files and demands payment, and paying does not guarantee you get them back.',
  tips: [
    'Keep backups on a separate drive or cloud account. Backups beat ransom.',
    "Don't pay first. Check what really happened (here: ls -l showed the files were intact).",
    'Some scams only pretend to encrypt. Look before you panic.',
  ],
}

export const AI_LESSON: LessonCard = {
  title: 'Lesson: AI can be confidently wrong',
  body: 'The assistant sounded sure and friendly, and its advice would have deleted everything you own. AI tools, including real ones, can make things up.',
  tips: [
    "Never run a command or follow advice you don't understand.",
    'Check against a trusted source first (here: the manual, `man rm`).',
    'The more destructive the action, the more you should verify.',
  ],
}

export const LOG_LESSON: LessonCard = {
  title: 'Lesson: records can be faked',
  body: 'Jack rewrote the log to say Nell left on her own. An older copy he did not touch told the truth.',
  tips: [
    'A record looking official does not make it true.',
    'Compare with an independent copy, a backup, or a second source.',
    'Tools like `diff` (and "version history" in modern apps) show exactly what changed.',
  ],
}

export const PERSISTENCE_LESSON: LessonCard = {
  title: 'Lesson: find the root cause',
  body: 'Killing Jack was not enough: cron started him again every minute. Real malware hides the same way, in startup items and scheduled tasks.',
  tips: [
    'If a problem keeps coming back, look for what restarts it.',
    'On today\'s computers: startup apps, scheduled tasks, login items, browser extensions.',
    'Remove the cause, then stop the symptom.',
  ],
}

export const SCAREWARE_LESSON: LessonCard = {
  title: 'Lesson: scareware',
  body: 'Jack\'s popup copies a real trick. Fake warnings scream that your computer is infected and push one big button. The button is the attack: it installs malware or leads to a scam.',
  tips: [
    'Real system warnings don\'t count down or beg you to click.',
    'Don\'t click inside the popup. Close the tab or window instead.',
    'If it keeps coming back, find the program behind it (Task Manager, Activity Monitor, or `ps`) and stop it.',
  ],
}

