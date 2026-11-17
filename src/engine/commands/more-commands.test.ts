import { describe, expect, it } from 'vitest'
import { asRoot, devWorld, run } from '../../test/helpers.js'
import { LOGINS } from '../../story/seed/logins.js'
import { execute } from '../shell/execute.js'
import { applyMode, normalDiff } from './files.js'

describe('chmod', () => {
  it('applies octal and symbolic modes', () => {
    expect(applyMode(0o644, '600')).toBe(0o600)
    expect(applyMode(0o000, 'u+r')).toBe(0o400)
    expect(applyMode(0o777, 'go-w')).toBe(0o755)
    expect(applyMode(0o000, 'a=r,u+w')).toBe(0o644)
    expect(applyMode(0o644, 'z+q')).toBeNull()
  })

  it('changes your own files, refuses others', () => {
    const result = run('chmod 600 README')
    expect(result.lines).toEqual([])
    expect(run('ls -l README', result.vfs).out[0]).toMatch(/^-rw------- /)
    expect(run('chmod 777 /etc/motd').err).toEqual(['chmod: /etc/motd: Not owner'])
    expect(run('chmod 777 /etc/motd', undefined, asRoot(devWorld().session)).err).toEqual([])
    expect(run('chmod 644').err).toEqual(['Usage: chmod [-R] mode file ...'])
  })
})

describe('rm', () => {
  it('removes your files and needs -r for directories', () => {
    const result = run('rm README')
    expect(result.vfs.resolve('/usr/users/guest/README', result.session).ok).toBe(false)
    expect(run('rm nope').err).toEqual(['rm: nope nonexistent'])
    expect(run('rm -f nope').err).toEqual([])
    expect(run('rm /tmp').err).toEqual(['rm: /tmp directory'])
  })

  it('needs write permission on the parent directory', () => {
    expect(run('rm /etc/motd').err).toEqual(['rm: /etc/motd: Permission denied'])
    expect(run('rm ~nell/notes').err).toEqual(['rm: ~nell/notes: Permission denied'])
  })

  it('refuses to remove the system or Nell, even as root', () => {
    const root = asRoot(devWorld().session)
    expect(run('rm -rf /', undefined, root).err[0]).toContain('cannot remove the root directory')
    expect(run('rm -rf /usr/users/nell', undefined, root).err[0]).toContain("that's Nell")
  })
})

describe('diff', () => {
  it('prints normal diff format', () => {
    expect(normalDiff(['a', 'b', 'c'], ['a', 'x', 'c'])).toEqual(['2c2', '< b', '---', '> x'])
    expect(normalDiff(['a', 'b'], ['a'])).toEqual(['2d1', '< b'])
    expect(normalDiff(['a'], ['a', 'b', 'c'])).toEqual(['1a2,3', '> b', '> c'])
    expect(normalDiff(['a'], ['a'])).toEqual([])
  })

  it('exits 1 when files differ and 0 when equal', () => {
    expect(run('diff /usr/adm/messages.0 /usr/adm/messages').events[0].status).toBe(1)
    expect(run('diff /etc/motd /etc/motd').events[0].status).toBe(0)
    expect(run('diff /etc/motd').err).toEqual(['diff: two filename arguments required'])
  })
})

describe('finger, last, su, exit', () => {
  it('finger nell shows her entry and plan', () => {
    const out = run('finger nell').out
    expect(out[0]).toBe('Login name: nell            In real life: Eleanor Voss')
    expect(out).toContain('On since Oct 31 23:41 on ttyp0')
    expect(out).toContain('Plan:')
    expect(run('finger jack').err).toEqual(['finger: jack: no such user.'])
  })

  it('last lists logins newest first and ends with wtmp begins', () => {
    const { vfs, session, procs } = devWorld()
    const out = execute('last nell', vfs, session, procs, LOGINS).lines.map((l) => l.text)
    expect(out[0]).toMatch(/^nell +ttyp0 .*Sat Oct 31 23:59   still logged in$/)
    expect(out[1]).toMatch(/ - crash +\(00:18\)$/)
    expect(out.at(-1)).toBe('wtmp begins Mon Oct  5 08:02')
  })

  it('su asks for a password; exit in the login shell does not leave', () => {
    expect(run('su').mode).toEqual({ kind: 'password', user: 'root' })
    expect(run('su jack').err).toEqual(['Unknown login: jack'])
    expect(run('exit').hints[0]).toContain("can't leave")
  })
})
