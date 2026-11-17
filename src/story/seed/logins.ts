import type { LoginHistory } from '../../engine/logins.js'

/**
 * The night as `last` remembers it. Nell's ttyh3 session ended in a crash at
 * the power surge; a moment later "nell" was logged in on ttyp0 (a pseudo
 * terminal: from inside the machine) and never logged out.
 */
export const LOGINS: LoginHistory = {
  records: [
    { user: 'guest', tty: 'ttyh3', login: 'Sat Oct 31 23:59', logout: null },
    { user: 'nell', tty: 'ttyp0', login: 'Sat Oct 31 23:59', logout: null },
    { user: 'nell', tty: 'ttyh3', login: 'Sat Oct 31 23:41', logout: 'crash', duration: '(00:18)' },
    { user: 'hale', tty: 'ttyh1', login: 'Sat Oct 31 21:30', logout: '22:15', duration: '(00:45)' },
    { user: 'nell', tty: 'ttyh3', login: 'Fri Oct 30 23:02', logout: '06:58', duration: '(07:56)' },
    { user: 'root', tty: 'console', login: 'Fri Oct 30 18:02', logout: '18:10', duration: '(00:08)' },
  ],
  begins: 'Mon Oct  5 08:02',
}
