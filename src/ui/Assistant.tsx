import type { AssistantState } from '../game/types.js'
import { ASSISTANT_MESSAGES } from '../story/lines.js'
import { PumpkinIcon } from './icons.js'
import './jack.css'

interface AssistantProps {
  assistant: AssistantState
  onRun: () => void
  onDecline: () => void
}

/**
 * Jack's "Smart Assistant" (Level 4): a friendly, modern chat bubble whose
 * advice would delete the player's home. Non-modal: typing continues.
 */
export function Assistant({ assistant, onRun, onDecline }: AssistantProps) {
  const message = ASSISTANT_MESSAGES[assistant.message] ?? ASSISTANT_MESSAGES[0]
  return (
    <aside className="jack-assistant" role="complementary" aria-label="Jack's Smart Assistant">
      <div className="jack-assistant-head">
        <PumpkinIcon size={22} />
        <div>
          <p className="jack-assistant-name">Smart Assistant™</p>
          <p className="jack-assistant-status">
            <span className="jack-online-dot" aria-hidden="true" /> Online - Powered by Jack Cloud™
          </p>
        </div>
      </div>
      <p className="jack-assistant-bubble" aria-live="polite">
        {message}
      </p>
      <div className="jack-assistant-actions">
        <button type="button" className="jack-fix" onClick={onRun}>
          Run it for me
        </button>
        <button type="button" className="jack-decline" onClick={onDecline}>
          No thanks
        </button>
      </div>
    </aside>
  )
}
