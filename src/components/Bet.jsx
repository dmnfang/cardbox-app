import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, Trophy, Coins, Question } from '@phosphor-icons/react'
import { shuffle } from '../lib/shuffle'
import { spawnConfetti } from '../lib/confetti'
import { sound } from '../lib/sound'
import { TEAM_COLORS } from '../lib/teamColors'
import LineFit from './LineFit'
import {
  START_COINS, REFILL_COINS,
  totalPlaced, canPlace, maxCardsFor, putCoin, takeCoin, settle, uniqueByLabel, labelKey,
} from '../lib/betMath'

const CHOICES = 6               // cards on the board each round
const FLIP_REVEAL_MS = 250      // the mystery card face turns at about the halfway point of its 0.5s flip
const CONFETTI_ON = true        // visual only, no extra sound

const teamCoin = (i, size = 24) => (
  <Coins className="bet-team-coin" size={size} weight="fill" style={{ color: TEAM_COLORS[i] }} />
)

// Deals one round: a set of choices, with one of them secretly the mystery card.
// A word that appears under two card ids (e.g. in two selected decks) only shows up once.
// Avoids repeating a mystery card until every card in the deck has had a turn.
function buildRound(cards, count, usedRef) {
  const choices = uniqueByLabel(shuffle([...cards])).slice(0, count)
  let pool = choices.filter(c => !usedRef.current.has(c.id))
  if (pool.length === 0) {
    usedRef.current.clear()
    pool = choices
  }
  const mystery = pool[Math.floor(Math.random() * pool.length)]
  usedRef.current.add(mystery.id)
  return { choices, mystery }
}

function Bet({ S, cards, onBackToSettings, onExit }) {
  const teamCount = S.betTeams || 3
  const uniqueCount = new Set(cards.map(labelKey)).size
  const choiceCount = Math.min(CHOICES, uniqueCount)
  const maxCards = maxCardsFor(choiceCount) // different cards a team may use; one card always stays uncovered
  const usedRef = useRef(new Set())

  // coins = each team's total. It only changes at the reveal (by exactly the result shown) and at the next round (+refill).
  const [coins, setCoins] = useState(() => Array(teamCount).fill(START_COINS))
  const [stakes, setStakes] = useState(() => Array.from({ length: teamCount }, () => ({}))) // per team: { cardId: coinCount }
  const [roundNum, setRoundNum] = useState(1)
  const [board, setBoard] = useState(() => buildRound(cards, choiceCount, usedRef))
  const [phase, setPhase] = useState('betting') // 'betting' | 'revealed'
  const [activeTeam, setActiveTeam] = useState(0)
  const [results, setResults] = useState(null)  // per team: { spent, gained, net }
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const soundTimers = useRef([])
  const settledRef = useRef(false) // blocks a fast double-tap from paying out (or refilling) twice

  // Delayed sounds are cancelled if the screen is left mid-flip
  function later(fn, ms) {
    soundTimers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => () => soundTimers.current.forEach(clearTimeout), [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // This screen has its own end modal (not EndSheet), so it plays the fanfare itself
  useEffect(() => {
    if (showEnd) sound.play('allDone')
  }, [showEnd])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  const revealed = phase === 'revealed'
  const coinsLeft = t => coins[t] - totalPlaced(stakes[t]) // how many the team can still put down

  function placeCoin(cardId) {
    if (phase !== 'betting') return
    const t = activeTeam
    if (!canPlace(coins[t], stakes[t], cardId, maxCards)) {
      sound.tick({ freq: 300, volume: 1.2, dur: 0.09 }) // low "thunk": can't do that
      return
    }
    sound.tick({ freq: 1500 })
    setStakes(prev => prev.map((s, i) => (i === t ? putCoin(s, cardId) : s)))
  }

  function pickUpCoin(team, cardId) {
    if (phase !== 'betting') return
    sound.tick({ freq: 900 })
    setStakes(prev => prev.map((s, i) => (i === team ? takeCoin(s, cardId) : s)))
  }

  function reveal() {
    if (phase !== 'betting' || settledRef.current) return
    settledRef.current = true
    const { results: roundResults, nextCoins } = settle(coins, stakes, board.mystery.id)
    const anyWin = roundResults.some(r => r.gained > 0)

    setCoins(nextCoins)
    setResults(roundResults)
    setPhase('revealed')

    sound.play('cardFlip')
    later(() => sound.play(anyWin ? 'correct' : 'wrong', { volume: anyWin ? 1 : 0.5 }), FLIP_REVEAL_MS)
    if (anyWin && CONFETTI_ON) {
      later(() => spawnConfetti(['var(--bet)', 'var(--flash)', 'var(--reveal)', 'var(--vanish)']), FLIP_REVEAL_MS)
    }
  }

  function nextRound() {
    if (phase !== 'revealed' || !settledRef.current) return
    settledRef.current = false
    setCoins(prev => prev.map(c => c + REFILL_COINS))
    setStakes(Array.from({ length: teamCount }, () => ({})))
    setBoard(buildRound(cards, choiceCount, usedRef))
    setRoundNum(n => n + 1)
    setResults(null)
    setPhase('betting')
    sound.play('nextCard')
    later(() => sound.play('spellBonus', { volume: 0.7 }), 200) // the +2 refill
  }

  const cols = board.choices.length <= 4 ? 2 : 3
  const rows = Math.ceil(board.choices.length / cols)

  // hint and results share one fixed-height slot, so the mystery card never changes size at the reveal
  const resultRows = Math.ceil(teamCount / 2)
  const slotHeight = Math.max(64, resultRows * 52 - 8)

  const ranked = coins
    .map((c, i) => ({ team: i, coins: c }))
    .sort((a, b) => b.coins - a.coins)

  const activeLeft = coinsLeft(activeTeam)

  return (
    <div className="mode-screen bet-scope">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <div className="team-btns">
          {Array.from({ length: teamCount }).map((_, i) => (
            <button
              key={i}
              className={`team-btn ${i === activeTeam ? 'active-roll' : ''}`}
              onClick={() => setActiveTeam(i)}
              aria-label={`Team ${i + 1}`}
            >
              {teamCoin(i, 28)}
              <span className="team-btn-score">{coins[i]}</span>
            </button>
          ))}
        </div>
        <span className="topbar-counter">Round {roundNum}</span>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={() => setShowEnd(true)} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="bet-body">
        <div className="bet-mystery-panel">
          <span className="bet-panel-label">Mystery card</span>

          <div className="bet-mystery-stage">
            {/* keyed by round so a new round starts face-down instantly, with no flip-back peek at the next card */}
            <div key={roundNum} className={`bet-flip ${revealed ? 'is-flipped' : ''}`}>
              <div className="bet-face bet-face-hidden">
                <Question size={160} weight="fill" />
              </div>
              <div className="bet-face bet-face-shown">
                <div className="bet-face-img">
                  <img src={board.mystery.image_url} alt={board.mystery.label} />
                </div>
                {S.betShowText && (
                  <LineFit text={board.mystery.label} max={48} min={20} className="bet-face-word" />
                )}
              </div>
            </div>
          </div>

          <div className="bet-slot" style={{ height: slotHeight }}>
            {revealed ? (
              <div
                className="bet-results"
                style={{ gridTemplateColumns: teamCount === 1 ? '1fr' : '1fr 1fr' }}
              >
                {results.map((r, t) => (
                  <div key={t} className="bet-result-pill">
                    {teamCoin(t, 28)}
                    <span className="bet-result-nums">
                      {r.spent === 0 && <span className="bet-result-delta zero">0</span>}
                      {r.spent > 0 && <span className="bet-result-delta down">−{r.spent}</span>}
                      {r.gained > 0 && <span className="bet-result-delta up">+{r.gained}</span>}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bet-hint">
                {teamCoin(activeTeam, 20)}
                <b>{activeLeft} {activeLeft === 1 ? 'coin' : 'coins'} left to place.</b>{' '}
                Up to {maxCards} cards each. Tap a coin to take it back.
              </div>
            )}
          </div>

          <button className="bet-main-btn" onClick={revealed ? nextRound : reveal}>
            {revealed ? 'Next Round' : 'Reveal'}
          </button>
        </div>

        <div className="bet-choices-panel">
          <div
            className="bet-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
          >
            {board.choices.map(card => {
              const isMystery = card.id === board.mystery.id
              return (
                <button
                  key={card.id}
                  className={`bet-choice ${revealed ? (isMystery ? 'correct' : 'dim') : ''}`}
                  data-sound="none"
                  disabled={revealed}
                  onClick={() => placeCoin(card.id)}
                >
                  <div className="bet-choice-img">
                    <img src={card.image_url} alt={card.label} />
                  </div>
                  {S.betShowText && (
                    <LineFit text={card.label} max={20} min={11} className="bet-choice-word" />
                  )}
                  <div className="bet-chips">
                    {stakes.map((s, t) =>
                      s[card.id] ? (
                        <span
                          key={t}
                          role="button"
                          className="bet-chip"
                          style={{ background: TEAM_COLORS[t] }}
                          onClick={e => { e.stopPropagation(); pickUpCoin(t, card.id) }}
                        >
                          {s[card.id]}
                        </span>
                      ) : null
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {showEnd && (
        <div className="roll-overlay">
          <div className="roll-end-modal">
            <div className="roll-end-title">Game Over!</div>
            <div className="roll-end-list">
              {ranked.map((r, rank) => (
                <div key={r.team} className="roll-end-row">
                  <div className="roll-end-rank">{rank === 0 ? <Trophy size={20} weight="fill" /> : rank + 1}</div>
                  <div className="roll-end-team">{teamCoin(r.team, 30)}</div>
                  <div className="roll-end-score">{r.coins} coins</div>
                </div>
              ))}
            </div>
            <div className="end-buttons">
              <button className="end-btn end-btn-bet" onClick={onBackToSettings}>Play Again</button>
              <button className="end-btn end-btn-secondary" onClick={onExit}>End Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bet