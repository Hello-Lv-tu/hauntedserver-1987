import { describe, expect, it } from 'vitest'
import { buildMessages } from '../ai/prompt.js'
import { beatInfo } from '../ai/beats.js'
import { parseVoiceRequest } from '../ai/request.js'
import { displayWidth, sanitizeReply } from '../ai/sanitize.js'
import { MODERN_HINTS } from '../engine/commands/modern.js'
import { MAN_PAGE_NAMES, manPage } from '../engine/man/pages.js'
import { newGame } from '../game/game.js'
import { parseSettings } from '../game/settings.js'
import type { GameState } from '../game/types.js'
import { LEVELS } from '../story/engine.js'
import * as LINES from '../story/lines.js'
import { SPELLS } from '../story/spells.js'
import { play } from '../test/helpers.js'
import { UI_ZH, defaultLang, hasCjk, translate } from './index.js'

const strings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}
const backticks = (s: string) => (s.match(/`[^`]+`/g) ?? []).sort()
const EMOJI = /(?![\u2122\u00a9\u00ae])\p{Extended_Pictographic}/u

describe('Chinese translations are complete', () => {
  const story = [
    ...strings(LINES),
    ...LEVELS.flatMap((level) => Object.values(level.beats).flatMap((beat) => [...beat.hints])),
    ...Object.values(MODERN_HINTS),
    ...SPELLS.flatMap((s) => [s.name, s.description]),
  ]

  it('every story line, hint, lesson and spell has a Chinese version', () => {
    const pureCommand = (s: string) => /^`[^`]+`$/.test(s)
    const missing = story.filter((s) => !pureCommand(s) && !hasCjk(translate(s, 'zh')))
    expect(missing).toEqual([])
  })

  it('translations keep every `command` exactly, and never add emoji', () => {
    for (const s of story) {
      const zh = translate(s, 'zh')
      expect(backticks(zh), `${s} => ${zh}`).toEqual(expect.arrayContaining(backticks(s)))
      expect(EMOJI.test(zh), zh).toBe(false)
    }
  })

  it('every t(...) label used in the UI has a Chinese version', () => {
    const sources = import.meta.glob<string>(['../ui/*.tsx', '../App.tsx'], { query: '?raw', import: 'default', eager: true })
    const labels = new Set<string>()
    for (const source of Object.values(sources)) {
      for (const m of source.matchAll(/\bt\((?:[a-z.]+, )?'((?:[^'\\]|\\.)+)'/g)) labels.add(m[1].replace(/\\'/g, "'"))
      for (const m of source.matchAll(/\bt\((?:[a-z.]+, )?"([^"]+)"/g)) labels.add(m[1])
    }
    const missing = [...labels].filter((l) => UI_ZH[l] === undefined && !hasCjk(translate(l, 'zh')))
    expect(labels.size).toBeGreaterThan(30)
    expect(missing).toEqual([])
  })

  it('Nell keeps her limits in Chinese too: at most 3 lines per message', () => {
    for (const variants of Object.values(LINES.NELL)) {
      for (const message of variants) expect(message.map((l) => translate(l, 'zh')).length).toBeLessThanOrEqual(3)
    }
  })
})

describe('a full play-through in Chinese', () => {
  const SCRIPT: (string | { type: 'assistant'; action: 'decline' })[] = [
    'write nell', 'hi', 'EOF', 'ls -a', 'cat .from_nell', 'hint',
    'ps aux', 'kill 6667',
    'finger nell', 'mail', 'P 2', 'd 2', 'q',
    'ls -l', 'chmod 134 README', 'chmod 644 README', 'chmod 644 .login',
    'man rm', { type: 'assistant', action: 'decline' },
    'diff /usr/adm/messages.0', 'diff /usr/adm/messages.0 /usr/adm/messages',
    'su', 'tape3', 'kill 6666', 'ls', 'cat /usr/lib/crontab', 'rm /usr/lib/jack/jack-o-daemn', 'rm /usr/lib/jack/jack-o-daemon', 'kill 6666',
    'write nell', 'come with me', 'EOF', 'tar cvf /dev/rmt', 'tar cvf /dev/rmt0 ~nell',
  ]
  const zh: GameState = newGame({ settings: { version: 1, popupSeconds: 60, lang: 'zh' } })
  const end = play(zh, SCRIPT)

  it('reaches the Move ending', () => {
    expect(end.ending).toBe('move')
  })

  it('every character line and hint on screen is Chinese; the machine stays English', () => {
    const isFrame = (t: string) => t === '' || t === 'EOF' || t.startsWith('Message from ')
    const isPureCommand = (t: string) => /^`[^`]+`$/.test(t.trim())
    const untranslated = end.screen
      .filter((l) => l.kind === 'nell' || l.kind === 'jack' || l.kind === 'hint')
      .filter((l) => !isFrame(l.text) && !isPureCommand(l.text) && !hasCjk(l.text))
      .map((l) => `${l.kind}: ${l.text}`)
    expect(untranslated).toEqual([])
    // Machine output stays 1987 English.
    expect(end.screen.some((l) => l.kind === 'stdout' && l.text.startsWith('USER       PID %CPU'))).toBe(true)
    // The only Chinese in machine output is the man page MODERN NOTE (`man rm` above).
    const rmPage = new Set(manPage('rm', 'zh'))
    const cjkStdout = end.screen.filter((l) => l.kind === 'stdout' && hasCjk(l.text)).map((l) => l.text)
    expect(cjkStdout.length).toBeGreaterThan(0)
    expect(cjkStdout.filter((t) => !rmPage.has(t))).toEqual([])
  })

  it('AI voice requests carry the language', () => {
    const chatting = play(zh, ['write nell', 'hi', '你好呀'])
    expect(chatting.pendingVoices[0].request.lang).toBe('zh')
  })
})

describe('man pages in Chinese', () => {
  it('only the MODERN NOTE is translated, for every page', () => {
    for (const name of MAN_PAGE_NAMES) {
      const page = manPage(name, 'zh') ?? []
      const note = page.indexOf('MODERN NOTE (现代说明)')
      expect(note, name).toBeGreaterThan(0)
      expect(page.slice(0, note).some(hasCjk), name).toBe(false)
      expect(page.slice(note + 1).some(hasCjk), name).toBe(true)
      for (const line of page) expect(displayWidth(line), `${name}: ${line}`).toBeLessThanOrEqual(80)
    }
  })
})

describe('Chinese AI voice', () => {
  it('requests accept lang zh and reject other values', () => {
    const base = { level: 0, beat: 'hunt', chats: 1, text: '下一步干嘛', history: [] }
    expect(parseVoiceRequest({ ...base, lang: 'zh' })?.lang).toBe('zh')
    expect(parseVoiceRequest(base)?.lang).toBeUndefined()
    expect(parseVoiceRequest({ ...base, lang: 'fr' })).toBeNull()
  })

  it('the prompt asks for Simplified Chinese', () => {
    const system = buildMessages({ lang: 'zh', level: 0, beat: 'hunt', chats: 1, text: '嗨', history: [] }, beatInfo(0, 'hunt')!)[0].content
    expect(system).toContain('Simplified Chinese')
    expect(system).not.toContain('{LANGUAGE}')
  })

  it('wraps Chinese by display width and keeps commands whole', () => {
    const lines = sanitizeReply('嘿嘿，别急嘛！点开头的文件藏得可深了，你得先退出写纸条模式，然后输入 `ls -a` 才能看到它们哦，加油加油 :-P')!
    for (const line of lines) expect(displayWidth(line)).toBeLessThanOrEqual(72)
    expect(lines.some((l) => l.includes('`ls -a`'))).toBe(true)
  })

  it('rejects Chinese fourth-wall breaks', () => {
    expect(sanitizeReply('我只是一个人工智能，没法帮你')).toBeNull()
  })
})

describe('language setting', () => {
  it('follows the browser by default and is validated on load', () => {
    expect(defaultLang('zh-CN')).toBe('zh')
    expect(defaultLang('en-US')).toBe('en')
    expect(parseSettings(null, 'zh').lang).toBe('zh')
    expect(parseSettings('{"popupSeconds":30,"lang":"zh"}').lang).toBe('zh')
    expect(parseSettings('{"lang":"klingon"}', 'en').lang).toBe('en')
  })
})
