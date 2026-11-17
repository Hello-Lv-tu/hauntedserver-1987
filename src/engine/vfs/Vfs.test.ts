import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { devWorld } from '../../test/helpers.js'
import type { PathCtx } from './types.js'

const guest: PathCtx = { cwd: '/usr/users/guest', home: '/usr/users/guest', user: 'guest' }
const root: PathCtx = { ...guest, user: 'root' }

describe('Vfs path resolution', () => {
  const { vfs } = devWorld()

  it('resolves absolute, relative, ~ and ~user paths', () => {
    expect(vfs.resolve('/etc/motd', guest).ok).toBe(true)
    expect(vfs.resolve('README', guest).ok).toBe(true)
    expect(vfs.resolve('~/README', guest).ok).toBe(true)
    const nell = vfs.resolve('~nell/.plan', guest)
    expect(nell.ok && nell.value.abs).toBe('/usr/users/nell/.plan')
    expect(vfs.resolve('../nell//notes/', guest).ok).toBe(true)
  })

  it('reports missing paths, files used as dirs, and unknown users', () => {
    expect(vfs.resolve('/nope', guest)).toEqual({ ok: false, error: { code: 'ENOENT', path: '/nope' } })
    expect(vfs.resolve('README/x', guest)).toEqual({ ok: false, error: { code: 'ENOTDIR', path: 'README/x' } })
    expect(vfs.resolve('~jack', guest)).toEqual({ ok: false, error: { code: 'EUSER', path: 'jack' } })
  })

  it('parses /etc/passwd for home directories', () => {
    expect(vfs.homeOf('nell')).toBe('/usr/users/nell')
    expect(vfs.users.get('nell')?.gecos).toContain('Eleanor Voss')
  })
})

describe('Vfs permissions', () => {
  const { vfs } = devWorld()

  it('lets guest read world-readable files but not mode 600 files of others', () => {
    expect(vfs.readFile('~nell/.plan', guest).ok).toBe(true)
    expect(vfs.readFile('~nell/.diary', guest)).toEqual({
      ok: false,
      error: { code: 'EACCES', path: '~nell/.diary' },
    })
  })

  it('lets root read everything', () => {
    const diary = vfs.readFile('~nell/.diary', root)
    expect(diary.ok && diary.value).toContain('dear diary')
  })

  it('refuses to read directories as files', () => {
    expect(vfs.readFile('/etc', guest)).toEqual({ ok: false, error: { code: 'EISDIR', path: '/etc' } })
  })
})

describe('Vfs writes', () => {
  it('creates, replaces and removes nodes without touching the original', () => {
    const { vfs } = devWorld()
    const file = { kind: 'file', name: 'x', owner: 'nell', group: 'staff', mode: 0o644, mtime: '1987-10-31 23:59', content: 'boo\n' } as const
    const written = vfs.write('/tmp/note', file)
    expect(written.ok).toBe(true)
    if (!written.ok) return
    const read = written.value.readFile('/tmp/note', guest)
    expect(read.ok && read.value).toBe('boo\n')
    expect(vfs.resolve('/tmp/note', guest).ok).toBe(false)

    const removed = written.value.remove('/tmp/note')
    expect(removed.ok && removed.value.resolve('/tmp/note', guest).ok).toBe(false)
  })

  it('fails when the parent does not exist', () => {
    const { vfs } = devWorld()
    const file = { kind: 'file', name: 'x', owner: 'root', group: 'wheel', mode: 0o644, mtime: '1987-10-31 23:59', content: '' } as const
    expect(vfs.write('/no/such/dir/x', file).ok).toBe(false)
    expect(vfs.remove('/tmp/nothing').ok).toBe(false)
  })

  it('never changes the original instance (property test)', () => {
    const { vfs } = devWorld()
    const before = JSON.stringify(vfs.root)
    const target = fc.constantFrom('/tmp/a', '/etc/motd', '/usr/users/nell/.plan', '/usr/adm/new', '/usr/users/guest/README')
    fc.assert(
      fc.property(target, fc.string(), fc.boolean(), (abs, content, remove) => {
        if (remove) vfs.remove(abs)
        else vfs.write(abs, { kind: 'file', name: '', owner: 'nell', group: 'staff', mode: 0o644, mtime: '1987-10-31 23:59', content })
        expect(JSON.stringify(vfs.root)).toBe(before)
      }),
    )
  })
})
