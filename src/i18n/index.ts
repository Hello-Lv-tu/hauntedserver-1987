import { ZH_LINES } from './zh-lines.js'

/**
 * Languages. The machine (command output, errors, mail, logs, man page
 * bodies) always speaks 1987 English; characters, hints, cards and the UI
 * follow the player's language. See .kiro/steering/project.md.
 */
export type Lang = 'en' | 'zh'

export const LANGS: readonly Lang[] = ['en', 'zh']

export function defaultLang(browserLanguage: string | undefined): Lang {
  return browserLanguage?.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/** Interface text (buttons, labels, panels), keyed by the English text. */
export const UI_ZH: Readonly<Record<string, string>> = {
  // toolbar, panels, settings
  Spellbook: '法术书',
  Ending: '结局',
  Settings: '设置',
  Close: '关闭',
  'not yet learned': '尚未习得',
  'Try:': '试试：',
  'Type `man name` in the terminal to read about any spell you know.': '在终端输入 `man 命令名`，可以阅读任何已学会的法术。',
  "Jack's popup countdown": '南瓜魔弹窗倒计时',
  '60 seconds (relaxed, default)': '60 秒（轻松，默认）',
  '30 seconds (tense)': '30 秒（紧张）',
  'Applies from the next countdown. The countdown pauses while panels and cards are open.': '从下一次倒计时开始生效。打开面板或卡片时，倒计时会暂停。',
  Language: '语言',
  'Text speed': '文字速度',
  Sound: '声音',
  'Sound on': '声音：开',
  'Sound off': '声音：关',
  'CRT hum, key clicks, the write bell and Jack (synthesized, no recordings)': '显示器嗡嗡声、键盘声、write 的铃声和南瓜魔（全部用代码合成，没有录音）',
  'Slow 1987 text (types out letter by letter; any key skips)': '1987 年的慢速文字（逐字打出；按任意键跳过）',
  'Step inside': '走进去',
  'A dark basement machine room. One old terminal still glows green.': '一间漆黑的地下机房。只有一台老终端还亮着绿光。',
  'Ravenmoor University · B-wing basement · 2026': '乌鸦沼大学 · B 栋地下室 · 2026',
  'Press Enter (or tap) to step inside': '点击屏幕或按回车，走进去',
  'Commands and machine output stay in English, like a real 1987 terminal.': '命令和机器输出保持英文，就像真正的 1987 年终端。',
  // terminal
  'hint: ': '提示：',
  'Terminal output': '终端输出',
  Command: '命令',
  Password: '密码',
  // cards
  '* New spell learned *': '* 习得新法术 *',
  'OK (Esc)': '好 (Esc)',
  'Real-world lesson': '现实中的教训',
  'Got it (Esc)': '明白了 (Esc)',
  'New spell learned': '习得新法术',
  // Jack's popup and assistant (deliberately "corporate")
  "Jack-o'-Daemon Security Center™": "Jack-o'-Daemon 安全中心™",
  'Automatic fix in': '自动修复倒计时',
  'FIX NOW': 'FIX NOW 立即修复',
  'Recommended by 9 out of 10 pumpkins.': '10 个南瓜里有 9 个推荐。',
  'Close popup': '关闭弹窗',
  'Smart Assistant™': '智能助手™',
  'Online - Powered by Jack Cloud™': '在线 - 由 Jack Cloud™ 提供支持',
  'Run it for me': 'Run it for me 帮我运行',
  'No thanks': 'No thanks 不用了',
  // start screen
  'The terminal remembers you.': '终端还记得你。',
  'Visit Nell': '去看看内尔',
  'New game': '新游戏',
  // ending
  'Messages from Nell': '内尔的消息',
  'online · from 1987': '在线 · 来自 1987',
  'on vax3 · ttyp0': '在 vax3 · ttyp0',
  'Moved to 2026': '搬到 2026',
  'The guardian of vax3': 'vax3 的守护者',
  'Nell rode a tape into the future, and into your browser tab.': '内尔坐着磁带来到了未来，还住进了你的浏览器标签页。',
  'Nell stayed home. vax3 glows amber now.': '内尔留在了家里。vax3 现在亮着琥珀色的光。',
  'Your words, left inside vax3': '你留在 vax3 里的话',
  'The next person who sneaks in will see them.': '下一个溜进来的人会看到它。',
  'spells learned': '学会的法术',
  'still work today': '今天仍可用',
  minute: '分钟',
  minutes: '分钟',
  'times eaten': '被吃掉次数',
  'Your spellbook': '你的法术书',
  'Grey ones are retired. The rest work in any Mac or Linux terminal today.': '灰色的已经退休。其余的在今天任何 Mac 或 Linux 终端里都能用。',
  'You saw through 6 tricks': '你识破了 6 种骗局',
  'Back to the terminal': '回到终端',
  'Play again': '再玩一次',
  'whoa. am i in 2026??': '哇。我在 2026 了？？',
  'why are all the buttons ROUND??': '为什么所有按钮都是圆的？？',
  'and this font is so... soft :-P': '还有这个字体，好……软 :-P',
  'thank you, partner.': '谢谢你，搭档。',
  "i'll keep vax3 company.": '我会陪着 vax3。',
  'no pumpkins on my watch ;-)': '有我在，南瓜别想回来 ;-)',
  'come back anytime: write nell': '随时回来：write nell',
  // postgame chat (Move ending)
  Chat: '聊天',
  'Chat with Nell': '和内尔聊天',
  'Chat with Nell (new message)': '和内尔聊天（有新消息）',
  'Reply to Nell': '回复内尔',
  'Close chat': '关闭聊天',
  'Conversation with Nell': '和内尔的对话',
  'Message to Nell': '写给内尔的消息',
  'Write a message...': '写点什么……',
  Send: '发送',
  'online · new to 2026': '在线 · 刚来到 2026',
  'typing...': '正在输入……',
  'Nell is typing...': '内尔正在输入……',
  You: '你',
  '{n} characters left': '还能输入 {n} 个字',
  'Only in this browser. Nell answers one message at a time.': '只保存在这个浏览器里。内尔一次回复一条消息。',
  Scareware: '恐吓弹窗',
  Phishing: '钓鱼邮件',
  Ransomware: '勒索软件',
  'AI can be wrong': 'AI 会出错',
  'Faked records': '伪造的记录',
  Persistence: '自动复活',
  "Real warnings don't count down or beg you to click.": '真正的警告不会倒计时，也不会求你点击。',
  'Check the real sender. Nobody needs your password by mail.': '看清真实的发件人。没人需要你通过邮件发密码。',
  "Don't pay first. Look at what really happened, and keep backups.": '别先付钱。先看清发生了什么，并保留备份。',
  "Don't run advice you don't understand. Check the manual.": '看不懂的建议别照做。先查说明书。',
  'Compare with an independent copy before you believe it.': '相信之前，先和一份独立的副本对比。',
  'If it keeps coming back, find what restarts it.': '如果它总是回来，就去找是什么让它重启的。',
}

/** Dynamic hints: [pattern, Chinese with $1, $2...]. Order matters. */
const ZH_PATTERNS: readonly (readonly [RegExp, string])[] = [
  [/^PID (\d+) is your own login shell\. Killing it would log you out of vax3\.$/, 'PID $1 是你自己的登录 shell。关掉它你就会被踢出 vax3。'],
  [/^You are writing to (\w+)\. Type a line and press Enter\. Ctrl-D \(or a line with only EOF\) stops\.$/, '你正在给 $1 写纸条。输入一句话按回车。按 Ctrl-D（或单独输入一行 EOF）结束。'],
  [/^Put a space after the options: (`.+`)$/, '选项后面要加空格：$1'],
  [/^Put a space between the command and its options: (`.+`)$/, '命令和选项之间要加空格：$1'],
  [/^(`.+`) is a real shell feature, but this terminal only supports pipes \(\|\)\.$/, '$1 是真实 shell 的功能，但这台终端只支持管道（|）。'],
  [/^Did you mean (`.+`)\?$/, '你是不是想输入 $1？'],
  [/^Unix spells it usr, without the e: (`.+`)$/, 'Unix 里写作 usr，没有 e：$1'],
  [/^Still locked: (.+)\. Type (.+)\. \(644 means you can read it again\.\)$/, '还锁着：$1。输入 $2。（644 表示你又能读它了。）'],
  [/^\(continuing from level (\d+)\)$/, '（从第 $1 关继续）'],
  [/^You finished the game \(ending: Moved to 2026\)\. (.*)$/, '你已经通关了（结局：搬到 2026）。$1'],
  [/^You finished the game \(ending: The guardian of vax3\)\. (.*)$/, '你已经通关了（结局：vax3 的守护者）。$1'],
]

/** Whole hints written in code (not in story data). */
const ZH_HINTS: Readonly<Record<string, string>> = {
  'That is not a command. To talk to Nell, type `write nell` first. `help` lists the commands.': '这不是命令。想和内尔说话，先输入 `write nell`。`help` 会列出所有命令。',
  'To read your mail, type `mail` on its own. Then, at the & prompt, type commands like `P 2`.': '要读邮件，单独输入 `mail`。然后在 & 提示符后输入 `P 2` 这样的命令。',
  'That was the digit 1 (or a capital I). The long listing uses a lowercase L, as in "list": `ls -l`': '那是数字 1（或大写 I）。长格式用的是小写 L，list 的 L：`ls -l`',
  'Example: `chmod 644 README` (mode first, then one or more files).': '示例：`chmod 644 README`（先写模式，再写一个或多个文件）。',
  'No file has exactly that name. `ls -a` lists the names here; separate several files with spaces.': '没有叫这个名字的文件。`ls -a` 会列出这里的文件名；多个文件之间用空格隔开。',
  'diff compares TWO files, separated by a space: `diff oldfile newfile`': 'diff 比较的是两个文件，用空格隔开：`diff 旧文件 新文件`',
  'You are already root (that is what the # prompt means).': '你已经是 root 了（# 号提示符就是这个意思）。',
  "The door has locked behind you. You can't leave until Nell is free.": '门在你身后锁上了。救出内尔之前，你出不去。',
  'Example: `tar cvf /dev/rmt0 ~nell`: four parts with spaces between them; rmt0 ends in the digit zero.': '示例：`tar cvf /dev/rmt0 ~nell`：四段，中间用空格隔开；rmt0 最后是数字零。',
  'You are in Mail now (the & prompt). Type a number to read a letter, `P 2` for letter 2 with ALL headers, `d 2` to delete it, `q` to quit. `?` lists everything.': '你现在在邮箱里（& 提示符）。输入数字读信，`P 2` 看第 2 封信的全部信头，`d 2` 删除它，`q` 退出。`?` 列出所有命令。',
  'Chat with Nell: `write nell`. Something odd is still in `ps aux`... To start over, reload and choose New game.': '想和内尔聊天：`write nell`。`ps aux` 里好像还藏着点什么……想重新开始，刷新网页选"新游戏"。',
  'Nell lives in your browser now: press "Chat" at the top to talk to her (on vax3, `write nell` only finds her note). Something odd is still in `ps aux`... To start over, reload and choose New game.':
    '内尔现在住在你的浏览器里了：点顶部的"聊天"按钮和她说话（在 vax3 上，`write nell` 只能找到她留下的字条）。`ps aux` 里好像还藏着点什么……想重新开始，刷新网页选"新游戏"。',
}

/**
 * Translate one line of player-facing text. Unknown text (machine output,
 * AI replies, player input) is returned unchanged.
 */
export function translate(text: string, lang: Lang): string {
  if (lang === 'en' || text === '') return text
  const exact = ZH_LINES[text] ?? ZH_HINTS[text] ?? UI_ZH[text]
  if (exact !== undefined) return exact
  for (const [pattern, zh] of ZH_PATTERNS) {
    const match = pattern.exec(text)
    // Captured parts are translated too (e.g. the tail of the revisit hint).
    if (match) return zh.replace(/\$(\d)/g, (_, i: string) => translate(match[Number(i)] ?? '', lang)).replace(/`, then `/g, '`，然后 `').replace(/ and /g, ' 和 ')
  }
  return text
}

/** UI helper; `{n}` placeholders are filled from `vars`. */
export function t(lang: Lang, text: string, vars: Record<string, string | number> = {}): string {
  const out = lang === 'en' ? text : (UI_ZH[text] ?? ZH_LINES[text] ?? text)
  return out.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

/** True if the text contains Chinese characters. */
export const hasCjk = (text: string) => /[\u3400-\u9fff\uff00-\uffef\u3000-\u303f]/.test(text)
