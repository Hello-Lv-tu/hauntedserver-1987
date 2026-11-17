/**
 * Nell, drawn as pixel art in code: a 16x17 grid rendered as SVG rects.
 * She is 1987: chunky pixels, walkman headphones, ASCII-smiley moods.
 */
import type { NellMood } from './moods.js'

// o outline, w body, s shade, . transparent
const BODY = [
  '.....oooooo.....',
  '...oowwwwwwoo...',
  '..owwwwwwwwwwo..',
  '.owwwwwwwwwwwwo.',
  '.owwwwwwwwwwwwo.',
  'owwwwwwwwwwwwwwo',
  'owwwwwwwwwwwwwwo',
  'owwwwwwwwwwwwwwo',
  'owwwwwwwwwwwwwso',
  'owwwwwwwwwwwwwso',
  'owwwwwwwwwwwwsso',
  'owwwwwwwwwwwwsso',
  'owwwwwwwwwwwssso',
  'owwwwwwwwwwwssso',
  'owwwwwwwwwwwwsso',
  '.owwo.owwo.owso.',
  '..oo...oo...oo..',
]

const COLORS: Record<string, string> = {
  o: '#4b4f7a',
  w: '#f4f6ff',
  s: '#d4daf3',
  e: '#1d1b33', // eyes, mouth
  h: '#ff7a3d', // walkman headphones (orange foam, very 1987)
  b: '#8a8fb5', // headband
  p: '#ff9cc2', // blush, tongue
  t: '#7cc8ff', // tear
  l: '#ffffff', // eye highlight
}

type Px = readonly [number, number, string]

const px = (color: string, ...cells: [number, number][]): Px[] => cells.map(([x, y]) => [x, y, color])

const HEADPHONES: Px[] = [
  ...px('b', [3, 1], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 1]),
  ...px('h', [0, 5], [0, 6], [0, 7], [1, 5], [1, 6], [1, 7], [14, 5], [14, 6], [14, 7], [15, 5], [15, 6], [15, 7]),
]

const BLUSH = px('p', [3, 9], [12, 9])

const FACES: Record<NellMood, Px[]> = {
  neutral: [...px('e', [5, 6], [5, 7], [10, 6], [10, 7], [7, 10], [8, 10])],
  happy: [...px('e', [4, 7], [5, 6], [6, 7], [9, 7], [10, 6], [11, 7], [6, 9], [7, 10], [8, 10], [9, 9]), ...BLUSH],
  cheeky: [...px('e', [4, 7], [5, 7], [6, 7], [10, 6], [10, 7], [7, 10], [8, 10], [9, 10]), ...px('p', [8, 11]), ...BLUSH],
  surprised: [
    ...px('e', [4, 6], [5, 6], [4, 7], [5, 7], [10, 6], [11, 6], [10, 7], [11, 7], [7, 9], [8, 9], [6, 10], [9, 10], [7, 11], [8, 11]),
    ...px('l', [4, 6], [10, 6]),
  ],
  scared: [
    ...px('e', [4, 6], [5, 6], [4, 7], [5, 7], [10, 6], [11, 6], [10, 7], [11, 7], [6, 11], [7, 10], [8, 11], [9, 10]),
    ...px('l', [5, 6], [11, 6]),
    ...px('t', [13, 4], [13, 5]),
  ],
  sad: [...px('e', [4, 6], [5, 7], [11, 6], [10, 7], [6, 11], [7, 10], [8, 10], [9, 11]), ...px('t', [5, 9], [5, 10])],
}


export function NellSprite({ mood = 'neutral', size = 64 }: { mood?: NellMood; size?: number }) {
  const cells: Px[] = []
  BODY.forEach((row, y) => [...row].forEach((c, x) => c !== '.' && cells.push([x, y, c])))
  cells.push(...HEADPHONES, ...FACES[mood])
  return (
    <svg width={size} height={(size * 17) / 16} viewBox="0 0 16 17" shapeRendering="crispEdges" aria-hidden="true" className="nell-sprite">
      {cells.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={COLORS[c]} />
      ))}
    </svg>
  )
}
