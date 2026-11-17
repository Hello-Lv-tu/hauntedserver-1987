import { describe, expect, it } from 'vitest'
import { COMMAND_NAMES } from '../commands/registry'
import { MAN_PAGE_NAMES, manPage } from './pages'

describe('man pages', () => {
  it('exist for every command on the terminal', () => {
    for (const name of COMMAND_NAMES) expect(MAN_PAGE_NAMES, `missing man page for ${name}`).toContain(name)
  })

  it('fit in 80 columns and include a MODERN NOTE', () => {
    for (const name of MAN_PAGE_NAMES) {
      const page = manPage(name) ?? []
      expect(page).toContain('MODERN NOTE')
      for (const line of page) expect(line.length, `${name}: "${line}"`).toBeLessThanOrEqual(80)
    }
  })
})
