import { readStorage, writeStorage } from './storage.js'

const KEY = 'hauntedserver:ghost-icon'

/** A tiny ghost: after the Move ending, Nell lives in the browser tab. */
const GHOST_ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 30V14a10 10 0 0 1 20 0v16l-3.3-3-3.4 3-3.3-3-3.3 3-3.4-3z" fill="#f4f4f8" stroke="#888" stroke-width="1"/><circle cx="12.5" cy="14" r="2" fill="#222"/><circle cx="19.5" cy="14" r="2" fill="#222"/><path d="M13 20q3 2.5 6 0" stroke="#222" fill="none" stroke-width="1.5"/></svg>',
  )

function setIcon(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link) link.href = href
}

/** Remember and show the ghost icon. */
export function adoptGhostIcon() {
  writeStorage(KEY, '1')
  setIcon(GHOST_ICON)
}

/** On load: keep the ghost if she moved in before. */
export function restoreGhostIcon() {
  if (readStorage(KEY) === '1') setIcon(GHOST_ICON)
}
