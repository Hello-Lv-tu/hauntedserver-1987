import { describe, expect, it } from 'vitest'
import { looksLikeCommand } from './matchers'

describe('looksLikeCommand', () => {
  it('spots commands typed in write mode', () => {
    for (const text of ['ls', 'ls -a', 'ls -la ~', 'cat .from_nell', 'cd /tmp', 'ps aux', 'kill 6667', 'man kill', 'write nell', 'who', 'help']) {
      expect(looksLikeCommand(text), text).toBe(true)
    }
  })

  it('leaves ordinary sentences alone, even when they start with a command word', () => {
    // "who are you?" was misread as the `who` command in the first play-test.
    for (const text of ['who are you?', 'who are you', 'more please', 'cat got your tongue', 'help me', 'kill the pumpkin!', 'hi', 'ps i love you', 'man, this is scary']) {
      expect(looksLikeCommand(text), text).toBe(false)
    }
  })
})
