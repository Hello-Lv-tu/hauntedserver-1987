import { describe, expect, it } from 'vitest'
import { loadSeed } from './seed'

describe('loadSeed', () => {
  it('applies defaults and inherits owner, group and mtime', () => {
    const result = loadSeed({
      kind: 'dir',
      owner: 'root',
      children: [{ name: 'home', kind: 'dir', owner: 'nell', children: [{ name: 'f', kind: 'file', content: 'hi' }] }],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const home = result.value.children['home']
    expect(home.kind === 'dir' && home.mode).toBe(0o755)
    const file = home.kind === 'dir' ? home.children['f'] : undefined
    expect(file).toMatchObject({ kind: 'file', owner: 'nell', mode: 0o644, content: 'hi', mtime: '1987-10-31 23:59' })
  })

  it('reports every problem with its path', () => {
    const result = loadSeed({
      kind: 'dir',
      children: [
        { name: 'a', kind: 'file' },
        { name: 'a', kind: 'file' },
        { name: 'b', kind: 'file', mode: '999' },
        { name: 'c', kind: 'dir', mtime: 'yesterday' },
        { name: 'x/y', kind: 'file' },
      ],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    const paths = result.error.map((e) => e.path)
    expect(paths).toEqual(expect.arrayContaining(['/a', '/b', '/c', '/x/y']))
    expect(result.error.find((e) => e.path === '/a')?.message).toBe('duplicate name in directory')
  })

  it('rejects a root that is not a directory', () => {
    expect(loadSeed({ kind: 'file' }).ok).toBe(false)
    expect(loadSeed(null).ok).toBe(false)
  })
})
