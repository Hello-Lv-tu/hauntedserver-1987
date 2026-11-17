import { POPUP_MESSAGES } from '../story/lines.js'
import type { PopupState } from '../game/types.js'
import { PumpkinIcon, WarningIcon } from './icons.js'
import { useT } from './useT.js'
import './jack.css'

interface JackPopupProps {
  popup: PopupState
  onFix: () => void
  onClose: () => void
}

/**
 * Jack-o'-Daemon's scareware popup. Deliberately "too modern" for the CRT.
 * It does not take focus, so the player can keep typing `ps aux` while it is
 * shown; Escape in the terminal closes it (and it comes back).
 */
export function JackPopup({ popup, onFix, onClose }: JackPopupProps) {
  const { t, tr } = useT()
  if (popup.hiddenFor > 0) return null
  const message = POPUP_MESSAGES[popup.message] ?? POPUP_MESSAGES[0]
  const minutes = Math.floor(popup.secondsLeft / 60)
  const seconds = String(popup.secondsLeft % 60).padStart(2, '0')
  const urgent = popup.secondsLeft <= 10

  return (
    <div className="jack-popup" role="alert" aria-labelledby="jack-title" aria-describedby="jack-body">
      <div className="jack-header">
        <span className="jack-brand">
          <PumpkinIcon size={16} /> {t("Jack-o'-Daemon Security Center™")}
        </span>
        <button type="button" className="jack-close" onClick={onClose} aria-label={t('Close popup')}>
          ×
        </button>
      </div>
      <h2 id="jack-title" className="jack-title">
        {popup.message === 0 ? <WarningIcon size={20} className="jack-warn" /> : null}
        {tr(message.title)}
      </h2>
      <p id="jack-body" className="jack-body">
        {tr(message.body)}
      </p>
      <p className={`jack-countdown${urgent ? ' urgent' : ''}`} aria-live="off">
        {t('Automatic fix in')} {minutes}:{seconds}
      </p>
      <button type="button" className="jack-fix" onClick={onFix}>
        {t('FIX NOW')}
      </button>
      <p className="jack-fineprint">{t('Recommended by 9 out of 10 pumpkins.')}</p>
    </div>
  )
}
