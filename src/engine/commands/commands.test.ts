import { describe, expect, it } from 'vitest'
import { asRoot, devWorld, run, runAll } from '../../test/helpers.js'
import { columns, lsDate } from './ls.js'
import { compileBre } from './text.js'

describe('ls', () => {
  it('hides dot-files unless -a, and lists . and .. with -a', () => {
    expect(run('ls ~nell').out).toEqual(['notes'])
    expect(run('ls -a ~nell').out.join(' ').split(/\s+/)).toEqual(['.', '..', '.diary', '.plan', 'notes'])
  })

  it('prints one name per line when piped', () => {
    expect(run('ls -a ~nell | cat').out).toEqual(['.', '..', '.diary', '.plan', 'notes'])
  })

  it('uses the 4.3BSD long format without group, and with group for -g', () => {
    expect(run('ls -l ~nell/notes').out).toEqual(['-rw-r--r--  1 nell          148 Oct 29 02:10 ~nell/notes'])
    const withGroup = run('ls -lg ~nell/notes').out[0]
    expect(withGroup).toMatch(/^-rw-r--r-- {2}1 nell {4}staff {4}/)
  })

  it('prints a total line and directory sizes of 512', () => {
    const out = run('ls -l /usr').out
    expect(out).toEqual([
      'total 2',
      'drwxr-xr-x  2 root          512 Jun  5  1986 adm',
      'drwxr-xr-x  4 root          512 Jun  5  1986 users',
    ])
  })

  it('reports missing paths the 4.3BSD way', () => {
    const result = run('ls nope /tmp')
    expect(result.err).toEqual(['nope not found'])
    expect(result.out).toEqual(['/tmp:', 'riddle'])
    expect(result.events[0].status).toBe(1)
  })

  it('reports unreadable directories', () => {
    const { vfs, session } = devWorld()
    const locked = vfs.write('/usr/users/nell/vault', {
      kind: 'dir', name: '', owner: 'nell', group: 'staff', mode: 0o700, mtime: '1987-10-31 23:59', children: {},
    })
    if (!locked.ok) throw new Error('setup failed')
    expect(run('ls ~nell/vault', locked.value, session).err).toEqual(['~nell/vault unreadable'])
    expect(run('ls ~nell/vault', locked.value, asRoot(session)).err).toEqual([])
  })

  it('rejects unknown flags with a usage line', () => {
    expect(run('ls -z').err).toEqual(['usage: ls [-agl] [file ...]'])
  })

  it('shows the year for files older than six months', () => {
    expect(lsDate('1987-10-31 23:58')).toBe('Oct 31 23:58')
    expect(lsDate('1986-06-05 10:00')).toBe('Jun  5  1986')
  })

  it('lays names out in columns sorted downwards', () => {
    expect(columns(['a', 'b', 'c', 'd'], 6)).toEqual(['a  c', 'b  d'])
  })
})

describe('cd and pwd', () => {
  it('goes home with no argument and supports ~user', () => {
    expect(runAll(['cd /tmp', 'cd', 'pwd']).out).toEqual(['/usr/users/guest'])
    expect(runAll(['cd ~nell', 'pwd']).out).toEqual(['/usr/users/nell'])
  })

  it('prints csh-style errors', () => {
    expect(run('cd nope').err).toEqual(['nope: No such file or directory.'])
    expect(run('cd README').err).toEqual(['README: Not a directory.'])
    expect(run('cd ~jack').err).toEqual(['Unknown user: jack.'])
  })
})

describe('cat and more', () => {
  it('prints files and keeps errors in order', () => {
    const result = run('cat nope /tmp/riddle')
    expect(result.lines[0]).toEqual({ stream: 'stderr', text: 'cat: nope: No such file or directory' })
    expect(result.out[0]).toBe('i have keys but open no locks.')
  })

  it('reports permission errors without content', () => {
    expect(run('cat ~nell/.diary').lines).toEqual([{ stream: 'stderr', text: 'cat: ~nell/.diary: Permission denied' }])
    expect(run('more /etc').err).toEqual(['more: /etc: Is a directory'])
  })
})

describe('head, tail and wc', () => {
  it('supports -n N and -N', () => {
    expect(run('head -n 2 /usr/adm/messages').out).toHaveLength(2)
    expect(run('head -3 /usr/adm/messages').out).toHaveLength(3)
    expect(run('tail -n1 /usr/adm/messages').out[0]).toContain('jack-o-daemon')
  })

  it('prints file headers for several files', () => {
    expect(run('head -1 /etc/motd /tmp/riddle').out).toEqual([
      '==> /etc/motd <==',
      '4.3 BSD UNIX #12: Tue Oct 27 03:14:07 EST 1987',
      '',
      '==> /tmp/riddle <==',
      'i have keys but open no locks.',
    ])
  })

  it('rejects bad counts', () => {
    expect(run('head -n x README').err).toEqual(['head: illegal line count -- x'])
  })

  it('counts lines, words and bytes like 4.3BSD wc', () => {
    expect(run('echo one two three | wc').out).toEqual(['       1       3      14'])
    expect(run('wc -l /tmp/riddle /etc/motd').out).toEqual(['       4 /tmp/riddle', '       7 /etc/motd', '      11 total'])
  })
})

describe('grep', () => {
  it('supports -i, -n, -v and -c', () => {
    expect(run('grep -n ttyh3 /usr/adm/messages').out).toEqual([
      '3:Oct 31 23:41:17 vax3 login: nell on ttyh3',
      '4:Oct 31 23:52:40 vax3 vmunix: ttyh3: silo overflow',
      '6:Oct 31 23:59:58 vax3 vmunix: ttyh3: carrier lost',
    ])
    expect(run('grep -ci TAPE /usr/adm/messages').out).toEqual(['1'])
    expect(run('grep -c -v vmunix /usr/adm/messages').out).toEqual(['3'])
  })

  it('prefixes file names when searching several files', () => {
    expect(run('grep nell /etc/motd ~nell/.plan').out).toEqual(['/etc/motd:Operator on duty tonight: nell (B-wing, x4471)'])
  })

  it('handles invalid patterns and missing patterns', () => {
    expect(run('grep "[a-" README').err).toEqual(['grep: RE error'])
    expect(run('grep').err).toEqual(['usage: grep [-cinv] pattern [file ...]'])
  })

  it('treats BRE metacharacters correctly', () => {
    expect(compileBre('a+b', false)?.test('a+b')).toBe(true)
    expect(compileBre('a+b', false)?.test('aab')).toBe(false)
    expect(compileBre('\\(ab\\)*c', false)?.test('ababc')).toBe(true)
    expect(compileBre('*x', false)?.test('*x')).toBe(true)
  })
})

describe('misc', () => {
  it('echo, date, whoami', () => {
    expect(run('echo  hello   "big world"').out).toEqual(['hello big world'])
    expect(run('date').out).toEqual(['Sat Oct 31 23:59:59 EST 1987'])
    expect(run('whoami').out).toEqual(['guest'])
  })

  it('man prints pages and 4.3BSD errors', () => {
    const page = run('man grep').out
    expect(page[0]).toMatch(/^GREP\(1\) +UNIX Programmer's Manual +GREP\(1\)$/)
    expect(page).toContain('MODERN NOTE')
    expect(run('man').err).toEqual(['What manual page do you want?'])
    expect(run('man frob').err).toEqual(['No manual entry for frob.'])
  })

  it('help lists commands', () => {
    expect(run('help').out.join(' ')).toContain('grep')
  })
})
