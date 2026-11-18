import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types.js'
import { lastJackLine, lastNellMessage } from './characters/screen.js'
import { sound } from './sound.js'

/** Play a sound when a value changes after the first render (not on mount). */
function useOnChange(value: unknown, enabled: boolean, play: () => void) {
  const previous = useRef(value)
  useEffect(() => {
    if (previous.current === value) return
    previous.current = value
    if (enabled) play()
  }, [value, enabled, play])
}

/** Game events → sounds. Everything is silent unless the setting is on. */
export function useSound(game: GameState) {
  const on = game.settings.sound

  useEffect(() => {
    if (!on) {
      sound.stopHum()
      return
    }
    sound.startHum()
    return () => sound.stopHum()
  }, [on])

  // Key clicks, and unlocking audio after a reload (browsers need a gesture).
  useEffect(() => {
    if (!on) return
    const onKey = (e: KeyboardEvent) => {
      sound.unlock()
      if (e.target instanceof HTMLInputElement && e.target.id === 'terminal-input' && !e.repeat) sound.key()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', sound.unlock)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', sound.unlock)
    }
  }, [on])

  useOnChange(lastNellMessage(game.screen)?.id ?? null, on, sound.bell)
  useOnChange(lastJackLine(game.screen)?.id ?? null, on, sound.jack)
  useOnChange(game.glitch, on, sound.eaten)
  useOnChange(game.spells.length, on, sound.spell)
}
