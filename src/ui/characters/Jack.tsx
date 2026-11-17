import { useId } from 'react'

/**
 * Jack-o'-Daemon, drawn smooth and glossy on purpose: gradients, highlights,
 * a customer-service smile. He looks like an app mascot, which is exactly why
 * he does not belong on a 1987 machine (the opposite of pixel-art Nell).
 */
import type { JackMood } from './moods.js'

export function JackMascot({ mood = 'smile', size = 72 }: { mood?: JackMood; size?: number }) {
  const id = useId().replace(/:/g, '')
  const eye = mood === 'angry' ? '#ff3b3b' : '#7df9ff'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={`jack-mascot jack-${mood}`}>
      <defs>
        <radialGradient id={`${id}skin`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffc06b" />
          <stop offset="55%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#d24a00" />
        </radialGradient>
        <linearGradient id={`${id}stem`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8be06a" />
          <stop offset="100%" stopColor="#2f8f3a" />
        </linearGradient>
        <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* stem and leaf */}
      <path d="M48 20 C47 12 52 7 58 6 L60 10 C55 12 54 15 55 21 Z" fill={`url(#${id}stem)`} />
      <path d="M57 12 C66 6 76 9 78 15 C70 18 62 17 57 12 Z" fill="#5ccf5c" />
      {/* body: three overlapping lobes */}
      <ellipse cx="30" cy="58" rx="24" ry="32" fill={`url(#${id}skin)`} />
      <ellipse cx="70" cy="58" rx="24" ry="32" fill={`url(#${id}skin)`} />
      <ellipse cx="50" cy="57" rx="27" ry="35" fill={`url(#${id}skin)`} />
      <path d="M50 24 C44 40 44 74 50 92" stroke="#c94a00" strokeOpacity="0.35" strokeWidth="2" fill="none" />
      {/* glossy highlight */}
      <ellipse cx="38" cy="36" rx="10" ry="6" fill="#ffffff" opacity="0.45" transform="rotate(-25 38 36)" />
      {/* screen-like square eyes */}
      <g filter={`url(#${id}glow)`}>
        <rect x="30" y="47" width="13" height="11" rx="3" fill={eye} />
        <rect x="57" y="47" width="13" height="11" rx="3" fill={eye} />
      </g>
      {mood === 'smug' ? <path d="M28 43 L44 46 M56 46 L72 41" stroke="#5a1f00" strokeWidth="3" strokeLinecap="round" /> : null}
      {mood === 'angry' ? <path d="M28 41 L44 47 M56 47 L72 41" stroke="#5a1f00" strokeWidth="3.5" strokeLinecap="round" /> : null}
      {/* the customer-service smile */}
      {mood === 'angry' ? (
        <path d="M33 79 Q50 68 67 79" stroke="#5a1f00" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <path d="M28 66 Q50 88 72 66 Q50 76 28 66 Z" fill="#5a1f00" />
          <path d="M36 70 L40 74 L44 71 L48 75 L52 71 L56 75 L60 71 L64 73" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" />
        </>
      )}
      <text x="80" y="22" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="700" fill="#ff9d4d">
        ™
      </text>
    </svg>
  )
}

