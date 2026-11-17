/**
 * Passwords for `su`. The clue chain for root: Nell's notes ("tape 3 is the
 * bad one. always tape 3.") and Prof. Hale's mail ("tape 3 has been acting up
 * again"); Nell says the password is "what always breaks around here".
 * Nell's own password is unknown to everyone, so `su nell` always fails.
 */
export const PASSWORDS: Readonly<Record<string, string>> = {
  root: 'tape3',
}

export function checkPassword(user: string, password: string): boolean {
  const expected = Object.hasOwn(PASSWORDS, user) ? PASSWORDS[user] : undefined
  return expected !== undefined && password === expected
}
