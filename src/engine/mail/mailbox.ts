/**
 * A tiny Berkeley Mail 5.2 (4.3BSD) for mbox spool files.
 * Pure: commands return output lines and a new mailbox state.
 */
export interface Message {
  /** Envelope line after "From ": sender and date. */
  envelope: string
  headers: [string, string][]
  body: string[]
  deleted: boolean
  read: boolean
}

export interface Mailbox {
  path: string
  user: string
  messages: Message[]
  /** 1-based current message, 0 before anything was read. */
  current: number
}

/** What happened, for the story (it matches on Message-Id). */
export interface MailAction {
  action: 'print' | 'printAll' | 'delete' | 'undelete' | 'quit'
  messageId?: string
  /** On quit: Message-Ids still in the mailbox. */
  kept?: string[]
}

export interface MailResult {
  lines: string[]
  box: Mailbox
  /** True when Mail exits (q, x, Ctrl-D). */
  done: boolean
  /** New spool content to write (on q). */
  spool?: string
  actions: MailAction[]
}

/** Headers `p` hides; `P` shows everything. period: like a 4.3BSD Mail.rc `ignore` list. */
const IGNORED = new Set(['received', 'return-path', 'message-id', 'x-mailer', 'content-type', 'status'])

export function parseMbox(content: string, path: string, user: string): Mailbox {
  const messages: Message[] = []
  let current: Message | null = null
  let inHeaders = false
  for (const line of content.replace(/\n$/, '').split('\n')) {
    if (line.startsWith('From ')) {
      current = { envelope: line.slice(5), headers: [], body: [], deleted: false, read: false }
      messages.push(current)
      inHeaders = true
      continue
    }
    if (current === null) continue
    if (inHeaders) {
      if (line === '') inHeaders = false
      else if (/^\s/.test(line) && current.headers.length > 0) current.headers[current.headers.length - 1][1] += `\n${line}`
      else {
        const colon = line.indexOf(':')
        if (colon > 0) current.headers.push([line.slice(0, colon), line.slice(colon + 1).trim()])
      }
    } else {
      current.body.push(line)
    }
  }
  for (const m of messages) {
    while (m.body.length > 0 && m.body[m.body.length - 1] === '') m.body.pop()
  }
  return { path, user, messages, current: 0 }
}

export function serializeMbox(box: Mailbox): string {
  return box.messages
    .filter((m) => !m.deleted)
    .map((m) => [`From ${m.envelope}`, ...m.headers.map(([k, v]) => `${k}: ${v}`), '', ...m.body, ''].join('\n'))
    .join('\n')
}

export function header(message: Message, name: string): string {
  return message.headers.find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1] ?? ''
}

export const messageId = (m: Message) => header(m, 'Message-Id')

function sender(m: Message): string {
  return m.envelope.split(' ')[0]
}

/** "Sat Oct 31 22:10:44 1987" -> "Sat Oct 31 22:10" */
function shortDate(m: Message): string {
  const parts = m.envelope.split(' ').slice(1)
  return parts.slice(0, 4).join(' ').replace(/:\d\d$/, '')
}

function size(m: Message): string {
  const text = [...m.headers.map(([k, v]) => `${k}: ${v}`), '', ...m.body].join('\n')
  return `${text.split('\n').length}/${new TextEncoder().encode(text).length}`
}

/** period: Mail 5.2 header line: `>N  1 hale@vax3  Sat Oct 31 22:10  14/402  "subject"` */
export function headerLines(box: Mailbox): string[] {
  return box.messages.map((m, i) => {
    if (m.deleted) return null
    const n = i + 1
    const marker = n === (box.current || 1) ? '>' : ' '
    const status = m.read ? ' ' : 'N'
    return `${marker}${status} ${String(n).padStart(2)} ${sender(m).padEnd(20)} ${shortDate(m).padEnd(16)} ${size(m).padStart(7)}  "${header(m, 'Subject')}"`
  }).filter((l): l is string => l !== null)
}

export function banner(box: Mailbox): string[] {
  const live = box.messages.filter((m) => !m.deleted)
  const unread = live.filter((m) => !m.read).length
  return [
    'Mail version 5.2 6/21/85.  Type ? for help.',
    `"${box.path}": ${live.length} message${live.length === 1 ? '' : 's'}${unread > 0 ? ` ${unread} new` : ''}`,
    ...headerLines(box),
  ]
}

const HELP = [
  '    Mail   Commands',
  't <message list>       type messages',
  'n                      goto and type next message',
  'p <message list>       print messages (some headers hidden)',
  'P <message list>       print messages with ALL headers',
  'd <message list>       delete messages',
  'u <message list>       undelete messages',
  'h                      print out active message headers',
  'q                      quit, saving unresolved messages in mbox',
  'x                      quit, do not remove system mailbox',
  'A <message list> consists of integers, ranges of same, or user names',
  'separated by spaces.  If omitted, Mail uses the last message typed.',
]

function printMessage(box: Mailbox, n: number, all: boolean): { lines: string[]; box: Mailbox } {
  const m = box.messages[n - 1]
  const headers = m.headers.filter(([k]) => all || !IGNORED.has(k.toLowerCase()))
  const lines = [`Message ${n}:`, `From ${m.envelope}`, ...headers.flatMap(([k, v]) => `${k}: ${v}`.split('\n')), '', ...m.body]
  const messages = box.messages.map((msg, i) => (i === n - 1 ? { ...msg, read: true } : msg))
  return { lines, box: { ...box, messages, current: n } }
}

/** Run one command typed at the `&` prompt. */
export function mailCommand(box: Mailbox, input: string): MailResult {
  const line = input.trim()
  const [cmd = '', ...rest] = line.split(/\s+/)
  const arg = rest[0]
  const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= box.messages.length
  const target = (fallback: number) => (arg === undefined ? fallback : Number(arg))
  const same = (lines: string[], actions: MailAction[] = []): MailResult => ({ lines, box, done: false, actions })

  const show = (n: number, all: boolean): MailResult => {
    if (!valid(n)) return same([`${arg ?? n}: Invalid message number`])
    if (box.messages[n - 1].deleted) return same([`${n}: Inappropriate message`])
    const printed = printMessage(box, n, all)
    return { lines: printed.lines, box: printed.box, done: false, actions: [{ action: all ? 'printAll' : 'print', messageId: messageId(box.messages[n - 1]) }] }
  }

  // Enter, "n" or "+": next undeleted message.
  if (line === '' || cmd === 'n' || cmd === '+') {
    const start = box.current === 0 ? 1 : box.current + 1
    const next = box.messages.findIndex((m, i) => i + 1 >= start && !m.deleted)
    if (next === -1) return same(['At EOF'])
    return show(next + 1, false)
  }
  if (/^\d+$/.test(cmd)) return show(Number(cmd), false)
  if (cmd === 'p' || cmd === 't' || cmd === 'type' || cmd === 'print') return show(target(box.current || 1), false)
  if (cmd === 'P' || cmd === 'T' || cmd === 'Print' || cmd === 'Type') return show(target(box.current || 1), true)
  if (cmd === 'h' || cmd === 'headers') return same(headerLines(box))
  if (cmd === '?' || cmd === 'help') return same(HELP)

  if (cmd === 'd' || cmd === 'delete' || cmd === 'u' || cmd === 'undelete') {
    const n = target(box.current || 1)
    if (!valid(n)) return same([`${arg}: Invalid message number`])
    const deleting = cmd.startsWith('d')
    const messages = box.messages.map((m, i) => (i === n - 1 ? { ...m, deleted: deleting } : m))
    return {
      lines: [],
      box: { ...box, messages, current: n },
      done: false,
      actions: [{ action: deleting ? 'delete' : 'undelete', messageId: messageId(box.messages[n - 1]) }],
    }
  }

  if (cmd === 'q' || cmd === 'quit') {
    const kept = box.messages.filter((m) => !m.deleted)
    const lines = kept.length > 0 ? [`Held ${kept.length} message${kept.length === 1 ? '' : 's'} in ${box.path}`] : []
    return { lines, box, done: true, spool: serializeMbox(box), actions: [{ action: 'quit', kept: kept.map(messageId) }] }
  }
  if (cmd === 'x' || cmd === 'exit') {
    return { lines: [], box, done: true, actions: [{ action: 'quit', kept: box.messages.map(messageId) }] }
  }
  if (cmd === 'r' || cmd === 'R' || cmd === 'reply' || cmd === 'm' || cmd === 'mail') {
    return same(['Sorry, sending mail is disabled for the guest account.'])
  }
  return same([`Unknown command: "${cmd}"`])
}
