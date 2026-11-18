/**
 * Small inline SVG icons. Emoji are avoided because not every system has an
 * emoji font (they render as empty boxes), and the game must look the same
 * everywhere.
 */
interface IconProps {
  size?: number
  className?: string
}

export function PumpkinIcon({ size = 16, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M15 4c0-2 3-3 4-1l-2 4h-2z" fill="#3d7a1f" />
      <ellipse cx="10" cy="18" rx="8" ry="10" fill="#e8620c" />
      <ellipse cx="22" cy="18" rx="8" ry="10" fill="#e8620c" />
      <ellipse cx="16" cy="18" rx="7" ry="11" fill="#ff7a1a" />
      <path d="M9 15l4 2-4 2zM23 15l-4 2 4 2z" fill="#2b1200" />
      <path d="M9 23c3 3 11 3 14 0l-2 0-1 1.5-1.5-1.5-1.5 1.5L15.5 23 14 24.5 12.5 23 11 24.5z" fill="#2b1200" />
    </svg>
  )
}

export function WarningIcon({ size = 20, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 1 21h22z" fill="#ff3d00" />
      <rect x="11" y="9" width="2" height="6" fill="#fff" />
      <rect x="11" y="16.5" width="2" height="2" fill="#fff" />
    </svg>
  )
}

export function SpeakerIcon({ size = 16, className, on }: IconProps & { on: boolean }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 9h4l5-4v14l-5-4H3z" />
      {on ? (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function GearIcon({ size = 16, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 2h4l.6 2.6 2.2.9 2.3-1.4 2.8 2.8-1.4 2.3.9 2.2L24 12v0l-2.6.6-.9 2.2 1.4 2.3-2.8 2.8-2.3-1.4-2.2.9L14 22h-4l-.6-2.6-2.2-.9-2.3 1.4-2.8-2.8 1.4-2.3-.9-2.2L0 12l2.6-.6.9-2.2-1.4-2.3 2.8-2.8 2.3 1.4 2.2-.9zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
      />
    </svg>
  )
}

export function GhostIcon({ size = 32, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 29V14a10 10 0 0 1 20 0v15l-3.3-2.8-3.4 2.8-3.3-2.8-3.3 2.8-3.4-2.8z" fill="#ffffff" stroke="#b9b0d9" strokeWidth="1" />
      <circle cx="12.5" cy="14" r="2" fill="#2a2440" />
      <circle cx="19.5" cy="14" r="2" fill="#2a2440" />
      <ellipse cx="10.5" cy="18" rx="1.6" ry="1" fill="#ffb3cf" />
      <ellipse cx="21.5" cy="18" rx="1.6" ry="1" fill="#ffb3cf" />
      <path d="M13.5 19q2.5 2 5 0" stroke="#2a2440" fill="none" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
