// ---- Track structure (measured from beat-track.mp3) ----
// The music is ~91.45 BPM in 4/4, and each COUNT is an eighth note: 0.328 s.
// 8 counts = one bar = 2.625 s. The song is built from 8-count blocks:
//   block 0            count-in (whistles)
//   blocks 1,3,5,7,9   MEMORIZE: the 8 cards pop in, one per count
//   blocks 2,4,6,8,10  SPEAK: each card is highlighted in turn, one per count
// => 5 rounds in ~29 s. If the highlight feels early/late against the music, nudge
// BEAT_FIRST by ±0.02–0.04 and re-test. You can also try values without redeploying by
// adding ?beatFirst=0.10 (and optionally &beatCount=0.328) to the app's URL.
export const BEAT_BPM = 91.45
export const BEAT_INTERVAL = 60 / BEAT_BPM / 2 // seconds per count (an eighth note), in track time
export const BEAT_FIRST = 0.07 // track time (s) of count 1 (the first whistle)
export const COUNTS_PER_BLOCK = 8
export const BEAT_ROUNDS = 5
export const BEAT_TOTAL_COUNTS = COUNTS_PER_BLOCK * (1 + BEAT_ROUNDS * 2) // 88

// The full track has 10 rounds of music. beat-track-5rounds.mp3 is a cut of it: the first 5 rounds,
// then the song's real ending, so after round 5 the music finishes on its own (no fade needed).
// If you go back to the full track, set this to true to fade it out after round 5 instead.
export const BEAT_FADE_AT_END = false

export const SLOTS = 8

export const SPEEDS = [
  { id: 'superslow', label: 'Super Slow', rate: 0.7 },
  { id: 'slow', label: 'Slow', rate: 0.85 },
  { id: 'normal', label: 'Normal', rate: 1 },
  { id: 'fast', label: 'Fast', rate: 1.25 },
  { id: 'speedup', label: 'Speeding Up', rate: 0.85 }, // round 1 rate; +0.1 each round
]

export function rateForRound(speedId, roundIdx) {
  const s = SPEEDS.find(x => x.id === speedId) || SPEEDS[2]
  if (s.id !== 'speedup') return s.rate
  return Math.min(s.rate + 0.1 * roundIdx, 1.25)
}

// Where are we in the song? countIdx is the whole number of counts since BEAT_FIRST (-1 = before it).
export function phaseOf(countIdx) {
  if (countIdx < 0) return { phase: 'countin', pos: 0, round: 0 }
  if (countIdx >= BEAT_TOTAL_COUNTS) return { phase: 'done', pos: 0, round: BEAT_ROUNDS - 1 }
  const block = Math.floor(countIdx / COUNTS_PER_BLOCK)
  const pos = countIdx % COUNTS_PER_BLOCK
  if (block === 0) return { phase: 'countin', pos, round: 0 }
  const round = Math.floor((block - 1) / 2)
  return { phase: block % 2 === 1 ? 'memorize' : 'speak', pos, round }
}

// Rounds whose speaking block has fully finished (0..5).
export function roundsCompleted(countIdx) {
  return Math.min(BEAT_ROUNDS, Math.max(0, Math.floor((countIdx - COUNTS_PER_BLOCK) / (2 * COUNTS_PER_BLOCK))))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// One entry per distinct word, so duplicate labels across decks don't count twice.
export function uniqueCards(cards) {
  const seen = new Set()
  return cards.filter(c => {
    const k = String(c.label).trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function maxUniqueWords(cards) {
  return Math.min(SLOTS, uniqueCards(cards).length)
}

// 8 slots, exactly `uniqueCount` distinct words, each used at least once.
export function buildBeatSequence(cards, uniqueCount) {
  const pool = shuffle(uniqueCards(cards))
  const n = Math.max(1, Math.min(uniqueCount, pool.length, SLOTS))
  const picked = pool.slice(0, n)
  const seq = [...picked]
  while (seq.length < SLOTS) seq.push(picked[Math.floor(Math.random() * n)])
  return shuffle(seq)
}