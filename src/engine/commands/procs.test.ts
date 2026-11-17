import { describe, expect, it } from 'vitest'
import { asRoot, devWorld, run } from '../../test/helpers'
import { withProc } from '../procs/types'
import { POPUP_PROC } from '../../story/levels/level1'

describe('ps', () => {
  it('lists only your processes on a terminal by default', () => {
    expect(run('ps').out).toEqual(['  PID TT STAT  TIME COMMAND', ' 2187 h3 S     0:00 -csh (csh)'])
  })

  it('lists everything in user format with aux (with or without a dash)', () => {
    const out = run('ps aux').out
    expect(out[0]).toBe('USER       PID %CPU %MEM   SZ  RSS TT STAT  TIME COMMAND')
    expect(out.some((l) => l.includes('swapper'))).toBe(true)
    expect(out.find((l) => l.startsWith('nell'))).toBe('nell      1171  0.0  1.2  196  104 p0 IW    0:07 -csh (csh)')
    expect(run('ps -aux').out).toEqual(out)
  })

  it('hides processes without a terminal unless x is given', () => {
    expect(run('ps a').out.some((l) => l.includes('swapper'))).toBe(false)
    expect(run('ps ax').out.some((l) => l.includes('swapper'))).toBe(true)
  })

  it('rejects unknown options', () => {
    expect(run('ps -ef').err[0]).toBe('ps: e: unknown option')
  })
})

describe('kill', () => {
  const { vfs, session, procs } = devWorld()
  const withPopup = withProc(procs, POPUP_PROC)

  it('stops your own process', () => {
    const result = run('kill 6667', vfs, session, withPopup)
    expect(result.lines).toEqual([])
    expect(result.procs.some((p) => p.pid === 6667)).toBe(false)
    expect(run('kill -9 6667', vfs, session, withPopup).procs.some((p) => p.pid === 6667)).toBe(false)
  })

  it('refuses other users processes and missing PIDs', () => {
    expect(run('kill 1171').err).toEqual(['kill: 1171: Not owner'])
    expect(run('kill 1').err).toEqual(['kill: 1: Not owner'])
    expect(run('kill 4242').err).toEqual(['kill: 4242: No such process'])
    expect(run('kill banana').err).toEqual(["kill: Arguments should be jobs or process id's."])
    expect(run('kill').err).toEqual(['kill: Too few arguments.'])
  })

  it('lets root kill anything except its own login shell', () => {
    expect(run('kill 1171', vfs, asRoot(session)).procs.some((p) => p.pid === 1171)).toBe(false)
  })

  it('will not kill the player\'s own login shell', () => {
    const result = run('kill 2187')
    expect(result.hints[0]).toContain('your own login shell')
    expect(result.procs.some((p) => p.pid === 2187)).toBe(true)
  })
})

describe('who and write', () => {
  it('who lists login shells', () => {
    expect(run('who').out).toEqual(['nell     ttyp0    Oct 31 23:41', 'guest    ttyh3    Oct 31 23:59'])
  })

  it('write enters write mode for logged-in users only', () => {
    expect(run('write nell').mode).toEqual({ kind: 'write', to: 'nell' })
    expect(run('write nell ttyp0').mode).toEqual({ kind: 'write', to: 'nell' })
    expect(run('write jack').err).toEqual(['write: jack is not logged on.'])
    expect(run('write nell ttyh9').err).toEqual(['write: nell is not logged on ttyh9.'])
    expect(run('write').err).toEqual(['usage: write user [ttyname]'])
  })

  it('write in a pipeline does not change mode', () => {
    expect(run('echo hi | write nell').mode).toBeUndefined()
  })
})
