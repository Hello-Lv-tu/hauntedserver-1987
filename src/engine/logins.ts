/**
 * Login history for `last`. On a real system this is the binary file
 * /usr/adm/wtmp; here the story owns it as data.
 */
export interface LoginRecord {
  user: string
  tty: string
  /** "Sat Oct 31 23:41" */
  login: string
  /** "23:58", "crash", or null for "still logged in". */
  logout: string | null
  /** "(00:17)" style duration, when logged out. */
  duration?: string
}

export interface LoginHistory {
  /** Newest first. */
  records: readonly LoginRecord[]
  /** "Mon Oct  5 08:02" */
  begins: string
}
