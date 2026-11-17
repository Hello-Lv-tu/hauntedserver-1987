import { describe, expect, it } from 'vitest'
import { run, runAll } from '../../test/helpers'

describe('execute', () => {
  it('does nothing for blank lines', () => {
    const result = run('   ')
    expect(result.lines).toEqual([])
    expect(result.events).toEqual([])
    expect(result.session.history).toEqual([])
  })

  it('prints csh errors for unknown commands', () => {
    expect(run('frobnicate').err).toEqual(['frobnicate: Command not found.'])
    expect(run('frobnicate').hints).toEqual([])
  })

  it('adds a period hint for modern commands', () => {
    const result = run('sudo ls')
    expect(result.err).toEqual(['sudo: Command not found.'])
    expect(result.hints[0]).toContain('su')
  })

  it('rejects unsupported syntax and null commands', () => {
    expect(run('ls > x').err).toEqual(['Sorry, that is not supported on this terminal.'])
    expect(run("echo 'hi").err).toEqual(["Unmatched '."])
    expect(run('ls |').err).toEqual(['Invalid null command.'])
  })

  it('pipes stdout between stages and shows stderr from every stage', () => {
    const result = run('cat /etc/motd nope | grep -c BSD')
    expect(result.out).toEqual(['1'])
    expect(result.err).toEqual(['cat: nope: No such file or directory'])
  })

  it('emits one event per stage with increasing sequence numbers', () => {
    const result = run('cat /etc/motd | grep tape | wc -l')
    expect(result.events.map((e) => [e.seq, e.name, e.status])).toEqual([
      [1, 'cat', 0],
      [2, 'grep', 0],
      [3, 'wc', 0],
    ])
    expect(result.session.seq).toBe(4)
  })

  it('only lets a lone command change the session', () => {
    expect(runAll(['cd /tmp | cat', 'pwd']).out).toEqual(['/usr/users/guest'])
    expect(runAll(['cd /tmp', 'pwd']).out).toEqual(['/tmp'])
  })

  it('keeps history in order, including failed lines', () => {
    const result = runAll(['ls', "echo 'x", 'history'])
    expect(result.out).toEqual(['     1  ls', "     2  echo 'x", '     3  history'])
  })

  it('sets clear for the clear command', () => {
    expect(run('clear').clear).toBe(true)
  })
})
