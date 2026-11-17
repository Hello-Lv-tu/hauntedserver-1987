import { useState } from 'react'
import { newGame } from './game/game'
import type { SaveData } from './game/save'
import { SAVE_KEY, parseSave } from './game/save'
import { SETTINGS_KEY, parseSettings } from './game/settings'
import type { GameState } from './game/types'
import { Game } from './ui/Game'
import { readStorage } from './ui/storage'

/** A save is worth offering only if the player got past the very start. */
function savedProgress(): SaveData | null {
  const save = parseSave(readStorage(SAVE_KEY))
  return save && (save.level > 0 || save.spells.length > 0) ? save : null
}

function App() {
  const [save] = useState(savedProgress)
  const [game, setGame] = useState<GameState | null>(() =>
    save ? null : newGame({ settings: parseSettings(readStorage(SETTINGS_KEY)) }),
  )

  const start = (fromSave: SaveData | null) => {
    setGame(newGame({ save: fromSave, settings: parseSettings(readStorage(SETTINGS_KEY)) }))
  }

  return (
    <main className="crt">
      {game ? (
        <Game initial={game} />
      ) : (
        <div className="start" role="dialog" aria-labelledby="start-title">
          <h1 id="start-title">vax3.cs.ravenmoor.edu</h1>
          <p>The terminal remembers you.</p>
          <div className="start-buttons">
            <button type="button" className="tool" autoFocus onClick={() => start(save)}>
              Continue (level {save?.level ?? 0})
            </button>
            <button type="button" className="tool" onClick={() => start(null)}>
              New game
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
