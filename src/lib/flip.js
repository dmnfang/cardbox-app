import { shuffle } from './shuffle'

export const FLIP_POINT_VALUES = [5, 4, 3, 2, 1]
export const FLIP_POINT_VALUES_BONUS = [2, 3, 4, 5, 6]
export const FLIP_STOP = 'STOP'
export const FLIP_GRID_SIZE = 6
export const FLIP_MAX_SCORE = 15
export const FLIP_MAX_SCORE_BONUS = 20

// Builds a 6-card grid for one team's turn. Only repeats cards if the
// deck has fewer than 6 (shouldn't normally happen with real decks).
export function buildFlipGrid(cards) {
  const pool = shuffle([...cards])
  if (pool.length >= FLIP_GRID_SIZE) return pool.slice(0, FLIP_GRID_SIZE)
  const grid = []
  while (grid.length < FLIP_GRID_SIZE) {
    grid.push(...shuffle([...cards]))
  }
  return grid.slice(0, FLIP_GRID_SIZE)
}

// Fresh token pool for a turn: 5 point values + 1 stop card.
// Pass true for bonus to use the higher 2-6 range instead of 1-5.
export function buildTokenPool(bonus) {
  return [...(bonus ? FLIP_POINT_VALUES_BONUS : FLIP_POINT_VALUES), FLIP_STOP]
}

// Draws one token from the remaining pool. STOP is excluded from the draw
// until flipCount >= 3, so the first 3 flips of any turn are always points -
// this works regardless of which physical tile the team picks, since the
// token isn't assigned to a tile until it's actually flipped.
export function drawFlipToken(pool, flipCount) {
  const available = flipCount < 3 ? pool.filter(t => t !== FLIP_STOP) : pool
  const idx = Math.floor(Math.random() * available.length)
  const token = available[idx]
  const nextPool = [...pool]
  nextPool.splice(nextPool.indexOf(token), 1)
  return { token, nextPool }
}

export const FLIP_COIN = 'COIN'
export const FLIP_COIN_GRID_SIZE = 2

// Builds the 2-card board for one flip of Coins mode
export function buildCoinGrid(cards) {
  const pool = shuffle([...cards])
  if (pool.length >= FLIP_COIN_GRID_SIZE) return pool.slice(0, FLIP_COIN_GRID_SIZE)
  const grid = []
  while (grid.length < FLIP_COIN_GRID_SIZE) {
    grid.push(...shuffle([...cards]))
  }
  return grid.slice(0, FLIP_COIN_GRID_SIZE)
}

// One coin token and one stop token, randomly assigned across the two tiles.
export function buildCoinTokens() {
  return shuffle([FLIP_COIN, FLIP_STOP])
}