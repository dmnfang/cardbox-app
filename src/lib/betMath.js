export const START_COINS = 5
export const REFILL_COINS = 5
export const MAX_CARDS_PER_TEAM = 5
export const WIN_MULTIPLIER = 2

// stakes for one team = { cardId: coinCount }
export const totalPlaced = stakes => Object.values(stakes).reduce((a, b) => a + b, 0)

// Can this team put one more coin on this card?
// maxCards = how many different cards a team may spread coins over
export function canPlace(coins, stakes, cardId, maxCards = MAX_CARDS_PER_TEAM) {
  if (totalPlaced(stakes) >= coins) return false                                  // out of coins
  const alreadyOnCard = (stakes[cardId] || 0) > 0
  if (!alreadyOnCard && Object.keys(stakes).length >= maxCards) return false      // one card too many
  return true
}

// Most different cards a team may use on a board: never all of them, so one card always stays uncovered
export const maxCardsFor = choiceCount => Math.max(1, Math.min(MAX_CARDS_PER_TEAM, choiceCount - 1))

export function putCoin(stakes, cardId) {
  return { ...stakes, [cardId]: (stakes[cardId] || 0) + 1 }
}

export function takeCoin(stakes, cardId) {
  const next = { ...stakes }
  if (next[cardId] > 1) next[cardId] -= 1
  else delete next[cardId]
  return next
}

// What happened to one team this round, in two parts that always add up to the net change:
//   spent  = every coin the team put down (on any card)
//   gained = what came back: coins on the mystery card return WIN_MULTIPLIER times (1 coin -> 2)
//   net    = gained - spent
export function breakdown(stakes, mysteryId) {
  const spent = totalPlaced(stakes)
  const gained = (stakes[mysteryId] || 0) * WIN_MULTIPLIER
  return { spent, gained, net: gained - spent }
}

export const netResult = (stakes, mysteryId) => breakdown(stakes, mysteryId).net

export function settle(coins, allStakes, mysteryId) {
  const results = allStakes.map(s => breakdown(s, mysteryId))
  return {
    results,
    deltas: results.map(r => r.net),
    nextCoins: coins.map((c, t) => c + results[t].net),
  }
}

// Cards that show the same word under different ids (e.g. a word in two selected decks) count as one card
export const labelKey = card => String(card.label).trim().toLowerCase()

export function uniqueByLabel(cards) {
  const seen = new Set()
  return cards.filter(c => {
    const k = labelKey(c)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}