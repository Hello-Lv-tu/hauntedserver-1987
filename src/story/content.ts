/**
 * In-world files the levels write. Jack's text is deliberately modern
 * (period-accuracy rules do not apply to him); everything else is 1987.
 * Keep lines at 80 columns or fewer.
 */
import type { FileNode } from '../engine/vfs/types.js'

export const PATHS = {
  spool: '/usr/spool/mail/guest',
  nellPlan: '/usr/users/nell/.plan',
  readme: '/usr/users/guest/README',
  login: '/usr/users/guest/.login',
  ransom: '/usr/users/guest/RANSOM_NOTE',
  messages: '/usr/adm/messages',
  messagesOld: '/usr/adm/messages.0',
  crontab: '/usr/lib/crontab',
  jackBin: '/usr/lib/jack/jack-o-daemon',
} as const

export const FAKE_MAIL_ID = '<jack-6666@jack-o-daemon.cloud>'

export const HALE_MAIL = `From hale@vax3 Sat Oct 31 22:10:44 1987
Received: by vax3.cs.ravenmoor.edu (5.51/4.7)
\tid AA01987; Sat, 31 Oct 87 22:10:44 EST
Date: Sat, 31 Oct 87 22:10:44 EST
From: hale@vax3.cs.ravenmoor.edu (Prof. Adrian Hale)
Message-Id: <8710310310.AA01987@vax3.cs.ravenmoor.edu>
To: guest@vax3
Subject: to whoever uses the guest account tonight

Hello,

Nell Voss is the night operator tonight. If anything odd happens
with the machine, ask her (she's usually logged in; try "write nell").

Please do NOT touch the tape drives. The Halloween backup is running
and tape 3 has been acting up again.

Whatever you hear from the B-wing: it's the air handlers. Probably.

-- A. Hale
`

export const FAKE_MAIL = `From nell@vax3 Tue Nov 17 03:14:07 2026
Return-Path: <noreply@jack-o-daemon.cloud>
Received: from mx.jack-o-daemon.cloud (pumpkin-cluster-6666.cloud)
\tby vax3.cs.ravenmoor.edu; Tue, 17 Nov 2026 03:14:07 +0000
Date: Tue, 17 Nov 2026 03:14:07 +0000
From: "Nell (Official)" <nell@vax3>
Message-Id: ${FAKE_MAIL_ID}
To: guest@vax3
Subject: URGENT!! it's me nell, everything is fine now :)
X-Mailer: Jack-o'-Daemon Cloud Mail 2026.11
Content-Type: text/html; charset=utf-8

hi!!! it's me, nell :)

jack is gone, he was actually nice all along!! to get me out of the
machine, just reply to this mail with your password.

hurry, this offer expires in 24 hours!!

xoxo nell

Sent from my iPhone
`

export const BOTH_MAILS = `${HALE_MAIL}\n${FAKE_MAIL}`

export const NELL_PLAN_L2 = `jack can't read plans. psst.

someone mailed you and signed it "nell". i never sent you any mail!
i can't tell if it's a trick. you're from 2026: you'll know.

old mail trick: in \`mail\`, P and a number (like \`P 2\`) prints a
letter with ALL its headers, even the hidden ones. the Received
lines say where a letter REALLY came from.
-- n.
`

/** Nell's .plan after the Stay ending: still 1987, still on duty. */
export const NELL_PLAN_STAY = `on duty: night operator, vax3. forever, apparently ;-)
pumpkins sighted: 0. (ok. maybe one tiny seed.)
visitors welcome. \`write nell\` and i'll answer.
-- n.
`

/** Nell's .plan after the Move ending: she left on tape. */
export const NELL_PLAN_MOVE = `gone traveling. rode out on tape 3 with a friend from the future.
vax3 is all yours. no pumpkins left (i checked twice).
be nice to the tape drives.
-- n.
`

export const RANSOM_NOTE = `*** YOUR FILES HAVE BEEN ENCRYPTED ***

Your legacy files (README, .login) are now protected in the
Jack Cloud Vault(TM) with military-grade encryption.

To unlock them, subscribe to Jack Cloud Premium:
    only $9.99/month (billed annually)

Do NOT try to recover them yourself. You will make it worse.

Thank you for choosing Jack-o'-Daemon(TM).
`

const NIGHT_HEAD = [
  'Oct 31 22:58:03 vax3 vmunix: tm0: tape drive online',
  'Oct 31 23:00:00 vax3 dump: Halloween backup started on /dev/rmt0',
  'Oct 31 23:41:17 vax3 login: nell on ttyh3',
  'Oct 31 23:52:40 vax3 vmunix: ttyh3: silo overflow',
]

/** Jack's version of the night: Nell "left" and deleted herself. */
export const TAMPERED_MESSAGES = [
  ...NIGHT_HEAD,
  'Oct 31 23:58:00 vax3 login: nell logged out',
  'Oct 31 23:58:01 vax3 nell: account removed by user (legacy cleanup)',
  'Oct 31 23:59:59 vax3 vmunix: clock: time stopped',
  'Nov 17 03:14:07 vax3 jack-o-daemon[6666]: legacy scan: 0 legacy users found',
].join('\n') + '\n'

export function file(base: FileNode, changes: Partial<FileNode>): FileNode {
  return { ...base, ...changes }
}
