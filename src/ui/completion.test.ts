import { describe, expect, it } from 'vitest'
import { COMMAND_NAMES } from '../engine/commands/registry.js'
import { devWorld } from '../test/helpers.js'
import { commonPrefix, complete } from './completion.js'

const { vfs, session } = devWorld()
const tab = (line: string, cwd = session.cwd) => complete(line, vfs, { ...session, cwd }, COMMAND_NAMES)

describe('tab completion', () => {
  it('completes unique command names with a trailing space', () => {
    expect(tab('gr')).toEqual({ line: 'grep ', options: [] })
    expect(tab('ls | gr')).toEqual({ line: 'ls | grep ', options: [] })
  })

  it('lists ambiguous commands', () => {
    expect(tab('h').options).toEqual(['head', 'help', 'hint', 'history'])
  })

  it('completes paths, adding / for directories', () => {
    expect(tab('cat /etc/mo')).toEqual({ line: 'cat /etc/motd ', options: [] })
    expect(tab('cd /usr/u')).toEqual({ line: 'cd /usr/users/', options: [] })
    expect(tab('cat ~nell/n')).toEqual({ line: 'cat ~nell/notes ', options: [] })
  })

  it('only offers dot-files when the prefix starts with a dot', () => {
    expect(tab('cat ', '/usr/users/nell')).toEqual({ line: 'cat notes ', options: [] })
    expect(tab('cat .', '/usr/users/nell').options).toEqual(['.diary', '.plan'])
  })

  it('extends to the common prefix before listing', () => {
    expect(tab('cat .p', '/usr/users/nell')).toEqual({ line: 'cat .plan ', options: [] })
    expect(commonPrefix(['history', 'help', 'head'])).toBe('h')
  })

  it('leaves the line alone when nothing matches', () => {
    expect(tab('cat /nope/x')).toEqual({ line: 'cat /nope/x', options: [] })
  })
})
