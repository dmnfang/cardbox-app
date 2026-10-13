export const START_COINS = 4
export const REFILL_COINS = 2
export const MAX_CARDS_PER_TEAM = 2
export const WIN_MULTIPLIER = 2

// stakes for one team = { cardId: coinCount }
export const totalPlaced = stakes => Object.values(stakes).reduce((a, b) => a + b, 0)

// Can this team put one more coin on this card?
export function canPlace(coins, stakes, cardId) {
  if (totalPlaced(stakes) >= coins) return false                                // out of coins
  const alreadyOnCard = (stakes[cardId] || 0) > 0
  if (!alreadyOnCard && Object.keys(stakes).length >= MAX_CARDS_PER_TEAM) return false // a third card
  return true
}

export function putCoin(stakes, cardId) {
  return { ...stakes, [cardId]: (stakes[cardId] || 0) + 1 }
}

export function takeCoin(stakes, cardId) {
  const next = { ...stakes }
  if (next[cardId] > 1) next[cardId] -= 1
  else delete next[cardId]
  return next
}

// Coins won (+) or lost (-) this round, relative to what the team had before the round.
// Coins on the mystery card come back WIN_MULTIPLIER times; coins anywhere else are gone.
export function netResult(stakes, mysteryId) {
  return (stakes[mysteryId] || 0) * WIN_MULTIPLIER - totalPlaced(stakes)
}

export function settle(coins, allStakes, mysteryId) {
  const deltas = allStakes.map(s => netResult(s, mysteryId))
  return { deltas, nextCoins: coins.map((c, t) => c + deltas[t]) }
}