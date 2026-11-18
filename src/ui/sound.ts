/**
 * Every sound is synthesized with Web Audio: no audio files, no licensing.
 * Off by default; browsers only allow audio after a user gesture, so the
 * context is created lazily and resumed on the next key press or click.
 */
type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let hum: { stop: () => void } | null = null

function audio(): Ctx | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (ctx === null) {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function out(): AudioNode {
  return master as GainNode
}

/** A short tone with an attack/decay envelope. */
function tone(freq: number, start: number, length: number, type: OscillatorType, volume: number, endFreq?: number) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, t + length)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
  osc.connect(gain).connect(out())
  osc.start(t)
  osc.stop(t + length + 0.02)
}

/** A burst of filtered noise (key clicks, glitches). */
function noise(start: number, length: number, volume: number, filterFreq: number, filterType: BiquadFilterType = 'highpass') {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const buffer = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * length)), a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = a.createBufferSource()
  const filter = a.createBiquadFilter()
  const gain = a.createGain()
  src.buffer = buffer
  filter.type = filterType
  filter.frequency.value = filterFreq
  gain.gain.value = volume
  src.connect(filter).connect(gain).connect(out())
  src.start(t)
}

export const sound = {
  /** Unlock audio inside a user gesture (enabling the setting, a key press). */
  unlock() {
    audio()
  },

  /** The CRT's flyback whine and mains hum, very quiet, looping. */
  startHum() {
    const a = audio()
    if (!a || hum) return
    const gain = a.createGain()
    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(0.035, a.currentTime + 1.5)
    const oscs = [
      Object.assign(a.createOscillator(), { type: 'sine' as OscillatorType }),
      Object.assign(a.createOscillator(), { type: 'sine' as OscillatorType }),
      Object.assign(a.createOscillator(), { type: 'sine' as OscillatorType }),
    ]
    oscs[0].frequency.value = 60
    oscs[1].frequency.value = 120
    oscs[2].frequency.value = 15734 // NTSC line rate: the classic CRT whine
    const whine = a.createGain()
    whine.gain.value = 0.08
    oscs[0].connect(gain)
    oscs[1].connect(gain)
    oscs[2].connect(whine).connect(gain)
    gain.connect(out())
    for (const o of oscs) o.start()
    hum = {
      stop: () => {
        const now = a.currentTime
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(gain.gain.value, now)
        gain.gain.linearRampToValueAtTime(0, now + 0.4)
        for (const o of oscs) o.stop(now + 0.45)
      },
    }
  },

  stopHum() {
    hum?.stop()
    hum = null
  },

  /** A mechanical key: a tiny click plus a soft thock. */
  key() {
    noise(0, 0.018, 0.25, 2500)
    tone(140 + Math.random() * 40, 0, 0.04, 'triangle', 0.08)
  },

  /** period: BSD write rings the terminal bell (^G) three times. */
  bell() {
    for (let i = 0; i < 3; i++) tone(880, i * 0.16, 0.11, 'square', 0.06)
  },

  /** Jack: a glossy, too-modern "notification" sting. */
  jack() {
    tone(523.25, 0, 0.18, 'sine', 0.12)
    tone(659.25, 0.09, 0.2, 'sine', 0.12)
    tone(1046.5, 0.18, 0.35, 'triangle', 0.1)
    tone(110, 0, 0.5, 'sawtooth', 0.04, 70)
  },

  /** Eaten: static and a falling tone. */
  eaten() {
    noise(0, 0.5, 0.3, 800, 'bandpass')
    tone(440, 0, 0.55, 'sawtooth', 0.08, 55)
  },

  /** A spell learned: a little rising arpeggio. */
  spell() {
    ;[659.25, 783.99, 987.77, 1318.5].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.07))
  },
}
