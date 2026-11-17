import { useState } from 'react'
import { newGame } from './game/game.js'
import type { SaveData } from './game/save.js'
import { SAVE_KEY, parseSave } from './game/save.js'
import { SETTINGS_KEY, parseSettings } from './game/settings.js'
import type { GameState } from './game/types.js'
import { Game } from './ui/Game.js'
import { Intro } from './ui/Intro.js'
import { restoreGhostIcon } from './ui/favicon.js'
import { readStorage } from './ui/storage.js'
import { defaultLang, t } from './i18n/index.js'

const stored = () => parseSave(readStorage(SAVE_KEY))

/** A save is worth offering only if the player got past the very start. */
function savedProgress(): SaveData | null {
  const save = stored()
  return save && (save.level > 0 || save.spells.length > 0) ? save : null
}

restoreGhostIcon()

function App() {
  const [save] = useState(savedProgress)
  // Reduced-motion players get instant text by default.
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const settings = () => parseSettings(readStorage(SETTINGS_KEY), defaultLang(navigator.language), !calm)
  const lang = settings().lang
  // A new game keeps the hidden ending's line, so it greets the next visitor.
  const [game, setGame] = useState<GameState | null>(() =>
    save ? null : newGame({ settings: settings(), legacy: stored()?.legacy ?? null, now: Date.now() }),
  )
  const [round, setRound] = useState(0)
  // The machine-room intro plays once per page load.
  const [entered, setEntered] = useState(false)

  const start = (fromSave: SaveData | null) => {
    setGame(newGame({ save: fromSave, settings: settings(), legacy: fromSave ? null : (save?.legacy ?? null), now: Date.now() }))
    setRound((r) => r + 1)
  }
  const playAgain = (legacy: string | null) => {
    setGame(newGame({ settings: settings(), legacy, now: Date.now() }))
    setRound((r) => r + 1)
  }

  if (!entered) return <Intro lang={lang} onEnter={() => setEntered(true)} />

  return (
    <main className="crt">
      {game ? (
        <Game key={round} initial={game} onPlayAgain={playAgain} />
      ) : (
        <div className="start" role="dialog" aria-labelledby="start-title">
          <h1 id="start-title">vax3.cs.ravenmoor.edu</h1>
          <p>{t(lang, 'The terminal remembers you.')}</p>
          <div className="start-buttons">
            <button type="button" className="tool" autoFocus onClick={() => start(save)}>
              {save?.ending ? t(lang, 'Visit Nell') : lang === 'zh' ? `继续（第 ${save?.level ?? 0} 关）` : `Continue (level ${save?.level ?? 0})`}
            </button>
            <button type="button" className="tool" onClick={() => start(null)}>
              {t(lang, 'New game')}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
