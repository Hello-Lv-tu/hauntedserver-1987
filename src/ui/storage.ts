/**
 * localStorage can throw (private browsing, blocked cookies, sandboxed
 * frames). The game must keep working without saves, so never let it throw.
 */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Progress just won't persist; the game itself is unaffected.
  }
}
