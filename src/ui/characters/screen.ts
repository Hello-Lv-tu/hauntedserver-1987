import type { ScreenLine } from '../../game/types.js'

/** The text of the most recent Nell write message on screen, and its id. */
export function lastNellMessage(screen: readonly ScreenLine[]): { id: number; text: string } | null {
  let end = -1
  for (let i = screen.length - 1; i >= 0; i--) {
    if (screen[i].kind === 'nell' && screen[i].text === 'EOF') {
      end = i
      break
    }
  }
  if (end < 0) return null
  let start = end - 1
  while (start >= 0 && !(screen[start].kind === 'nell' && screen[start].text.startsWith('Message from '))) start--
  if (start < 0) return null
  const text = screen
    .slice(start + 1, end)
    .map((l) => l.text)
    .join(' ')
  return { id: screen[end].id, text }
}

/** The most recent line Jack said. */
export function lastJackLine(screen: readonly ScreenLine[]): ScreenLine | null {
  for (let i = screen.length - 1; i >= 0; i--) if (screen[i].kind === 'jack' && screen[i].text !== '') return screen[i]
  return null
}
