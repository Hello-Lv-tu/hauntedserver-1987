// Records a scripted play-through of the live site as timestamped JPEG frames.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { chromium } from '/root/.nvm/versions/node/v22.23.4/lib/node_modules/@playwright/mcp/node_modules/playwright-core/index.mjs'

const OUT = 'frames'
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT)

const browser = await chromium.launch({
  executablePath: '/inner_container/opt/playwright/chromium-1232/chrome-linux64/chrome',
  args: ['--disable-crash-reporter', '--disable-crashpad-for-testing', '--no-zygote', '--single-process', '--disable-gpu', '--force-device-scale-factor=2'],
})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text()) })
await page.goto('https://hauntedserver-1987.vercel.app', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// Dismiss cards after they have been readable for a while, without touching the keyboard.
await page.evaluate(() => {
  const seen = new WeakMap()
  setInterval(() => {
    for (const card of document.querySelectorAll('.card')) {
      if (!seen.has(card)) seen.set(card, performance.now())
      const age = performance.now() - seen.get(card)
      const limit = card.classList.contains('card-lesson') ? 3200 : 2600
      if (age > limit) card.querySelector('.card-button')?.click()
    }
  }, 150)
  window.__events = []
  const watch = ['.jack-popup', '.jack-assistant', '.card-lesson', '.card-spell', '.bezel', '.ending-sheet', '.ending-whiteout']
  const state = {}
  setInterval(() => {
    for (const sel of watch) {
      const on = !!document.querySelector(sel)
      if (on !== !!state[sel]) { state[sel] = on; window.__events.push([Date.now() / 1000, sel, on]) }
    }
  }, 50)
})
const cdp = await ctx.newCDPSession(page)
const index = []
let t0 = 0
cdp.on('Page.screencastFrame', async (f) => {
  const ts = f.metadata.timestamp
  if (!t0) t0 = ts
  const name = `${String(index.length).padStart(6, '0')}.jpg`
  writeFileSync(`${OUT}/${name}`, Buffer.from(f.data, 'base64'))
  index.push([ts - t0, name])
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 2560, maxHeight: 1440 })
const start = Date.now()
const now = () => (Date.now() - start) / 1000
const log = []

async function at(t) {
  const wait = t * 1000 - (Date.now() - start)
  if (wait > 0) await page.waitForTimeout(wait)
}
async function type(t, text) {
  await at(t)
  log.push([now().toFixed(2), text])
  await page.keyboard.type(text, { delay: 55 })
  await page.keyboard.press('Enter')
}
async function key(t, k) {
  await at(t)
  log.push([now().toFixed(2), k])
  await page.keyboard.press(k)
}
async function click(t, selector) {
  await at(t)
  log.push([now().toFixed(2), 'click ' + selector])
  await page.click(selector, { timeout: 3000 }).catch((e) => log.push(['!', String(e).slice(0, 80)]))
}
async function escIfLesson(t) {
  await at(t)
  await page.focus('#terminal-input').catch(() => {})
}
async function clickWhenVisible(t, selector) {
  await at(t)
  await page.waitForSelector(selector, { state: 'visible', timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(600)
  log.push([now().toFixed(2), 'click ' + selector])
  await page.click(selector, { timeout: 3000 }).catch((e) => log.push(['!', String(e).slice(0, 80)]))
  await page.focus('#terminal-input').catch(() => {})
}

await key(4.5, 'Enter') // step into the terminal
await at(7.0); await page.focus('#terminal-input').catch(() => {})

// Level 0
await type(11.0, 'write nell')
await type(13.0, 'hi! who are you?')
await type(17.0, 'what should i do?')
await key(23.0, 'Control+d')
await type(24.2, 'ls -a')
await type(26.8, 'cat .from_nell')
// Level 1
await type(33.6, 'ps aux')
await type(38.0, 'kill 6667')
// Level 2
await escIfLesson(43.5)
await type(45.0, 'finger nell')
await type(48.6, 'mail')
await type(51.0, 'P 2')
await type(57.0, 'd 2')
await type(58.6, 'q')
// Level 3
await escIfLesson(60.6)
await type(63.4, 'ls -l')
await type(67.2, 'chmod 644 README')
await type(69.8, 'chmod 644 .login')
// Level 4
await escIfLesson(72.6)
await type(74.6, 'man rm')
await clickWhenVisible(79.0, '.jack-decline')
// Level 5
await escIfLesson(82.0)
await type(83.0, 'diff /usr/adm/messages.0 /usr/adm/messages')
// Boss
await escIfLesson(90.0)
await type(91.4, 'su')
await type(93.0, 'tape3')
await type(96.0, 'kill 6666')
await type(98.8, 'ls')
await type(100.8, 'cat /usr/lib/crontab')
await type(105.0, 'rm /usr/lib/jack/jack-o-daemon')
await type(108.6, 'kill 6666')
// Choice
await escIfLesson(112.0)
await type(114.0, 'write nell')
await type(115.6, 'come with me')
await key(119.0, 'Control+d')
await type(120.6, 'tar cvf /dev/rmt0 ~nell')
await at(130.0)
log.push([now().toFixed(2), 'scroll'])
await page.evaluate(() => {
  const els = [document.querySelector('.ending'), document.scrollingElement]
  const el = els.find((e) => e && e.scrollHeight > e.clientHeight + 80 && (e === document.scrollingElement || ['auto', 'scroll'].includes(getComputedStyle(e).overflowY)))
  if (!el) return 'none'
  const start = el.scrollTop, target = Math.min(el.scrollHeight - el.clientHeight, 430), t0 = performance.now()
  const step = (now) => { const k = Math.min(1, (now - t0) / 2200); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; el.scrollTop = start + (target - start) * e; if (k < 1) requestAnimationFrame(step) }
  requestAnimationFrame(step)
  return el.className || el.tagName
}).then((r) => log.push(['scroll el', r]))
await at(141)

await cdp.send('Page.stopScreencast')
await page.waitForTimeout(500)
writeFileSync('index.json', JSON.stringify(index))
const events = await page.evaluate(() => window.__events)
writeFileSync('events.json', JSON.stringify(events.map(([t, sel, on]) => [+(t - t0).toFixed(2), sel, on])))
console.log(events.map(([t, sel, on]) => `${(t - t0).toFixed(2)} ${sel} ${on}`).join('\n'))
writeFileSync('actions.json', JSON.stringify(log, null, 1))
console.log('frames', index.length, 'last', index.at(-1)?.[0].toFixed(2))
console.log(log.map((l) => l.join(' ')).join('\n'))
await browser.close()
