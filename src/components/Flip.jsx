import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, Trophy, Prohibit, Sparkle, TrendUp } from '@phosphor-icons/react'
import { buildFlipGrid, buildTokenPool, drawFlipToken, FLIP_STOP, FLIP_GRID_SIZE, FLIP_MAX_SCORE, FLIP_MAX_SCORE_BONUS } from '../lib/flip'
import { spawnConfetti } from '../lib/confetti'
import { sound } from '../lib/sound'

const CONFETTI_COLORS = ['var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)', 'var(--roll)']
const FLIP_REVEAL_MS = 250 // the card face turns at about the halfway point of the 0.5s flip

function Flip({ S, cards, onBackToSettings, onExit }) {
  const teamCount = S.flipTeams

  const [bonusPoints, setBonusPoints] = useState(false)

  const [scores, setScores] = useState(() => Array(teamCount).fill(0))
  const [currentTeam, setCurrentTeam] = useState(0)
  const [gridCards, setGridCards] = useState(() => buildFlipGrid(cards))
  const [tokenPool, setTokenPool] = useState(() => buildTokenPool(false))
  const [revealed, setRevealed] = useState(() => Array(FLIP_GRID_SIZE).fill(null))
  const [flipCount, setFlipCount] = useState(0)
  const [turnScore, setTurnScore] = useState(0)
  const [turnOver, setTurnOver] = useState(false)
  const [hitStop, setHitStop] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const flippingRef = useRef(false)
  const soundTimers = useRef([])

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

  function toggleBonus() {
    const next = !bonusPoints
    setBonusPoints(next)
    if (!turnOver) {
      setTokenPool(pool => pool.map(t => (t === FLIP_STOP ? t : (next ? t + 1 : t - 1))))
    }
  }

  function startNextTurn(nextTeamIdx) {
    setCurrentTeam(nextTeamIdx)
    setGridCards(buildFlipGrid(cards))
    setTokenPool(buildTokenPool(bonusPoints))
    setRevealed(Array(FLIP_GRID_SIZE).fill(null))
    setFlipCount(0)
    setTurnScore(0)
    setTurnOver(false)
    setHitStop(false)
  }

  function bankTurnScore(amount) {
    setScores(s => {
      const ns = [...s]
      ns[currentTeam] += amount
      return ns
    })
  }

  function flipTile(i) {
    if (turnOver || revealed[i] || flippingRef.current) return
    flippingRef.current = true
    sound.play('cardFlip')

    const { token, nextPool } = drawFlipToken(tokenPool, flipCount)
    const nextRevealed = [...revealed]
    nextRevealed[i] = token
    setRevealed(nextRevealed)
    setTokenPool(nextPool)
    setFlipCount(c => c + 1)

    if (token === FLIP_STOP) {
      later(() => sound.play('stopCard'), FLIP_REVEAL_MS)
      setHitStop(true)
      setTurnOver(true)
      bankTurnScore(turnScore)
    } else {
      const newTurnScore = turnScore + token
      setTurnScore(newTurnScore)
      const maxScore = bonusPoints ? FLIP_MAX_SCORE_BONUS : FLIP_MAX_SCORE
      if (newTurnScore === maxScore) {
        spawnConfetti(CONFETTI_COLORS)
        later(() => sound.play('celebration'), FLIP_REVEAL_MS)
        setTurnOver(true)
        bankTurnScore(newTurnScore)
      } else {
        later(() => sound.play('spellBonus', { volume: 0.7 }), FLIP_REVEAL_MS)
      }
    }

    setTimeout(() => { flippingRef.current = false }, 300)
  }

  function nextTeam() {
    sound.play('nextCard')
    startNextTurn((currentTeam + 1) % teamCount)
  }

  const rankedScores = scores
    .map((score, i) => ({ team: i + 1, score }))
    .sort((a, b) => b.score - a.score)

  const hasScaffold = S.flipQuestion || S.flipAnswer

  return (
    <div className="mode-screen flip-scope">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <div className="team-btns">
          {Array.from({ length: teamCount }).map((_, i) => (
            <div key={i} className={`team-btn ${i === currentTeam ? 'active-roll' : ''}`}>
              <span className="team-btn-label">Team {i + 1}</span>
              <span className="team-btn-score">{scores[i]}</span>
            </div>
          ))}
        </div>
        <span className="topbar-counter">Team {currentTeam + 1}'s turn</span>
        <button
          className={`topbar-toggle ${bonusPoints ? 'active' : ''}`}
          onClick={toggleBonus}
          aria-label="Toggle bonus points"
        >
          <TrendUp size={16} weight="fill" />
          Bonus
        </button>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={() => setShowEnd(true)} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="flip-body">
        <div className="flip-scaffold-panel">
          {hasScaffold ? (
            <>
              <span className="flip-scaffold-label">Question</span>
              <div className="flip-scaffold-text">{S.flipQuestion || '—'}</div>
              <span className="flip-scaffold-label flip-scaffold-label-answer">Answer</span>
              <div className="flip-scaffold-text flip-scaffold-answer">{S.flipAnswer || '—'}</div>
            </>
          ) : (
            <>
              <span className="flip-scaffold-label">Practicing</span>
              <div className="flip-scaffold-text">{S.selectedDecks.map(d => d.name).join(', ')}</div>
            </>
          )}

          <div className="flip-scaffold-bottom">
            {turnOver && (
              <div className={`flip-scaffold-status ${hitStop ? 'flip-scaffold-status-stop' : 'flip-scaffold-status-cleared'}`}>
                {hitStop ? 'Stopped!' : 'Board Cleared!'}
              </div>
            )}

            <div className="flip-scaffold-turn-score">
              <span className="flip-scaffold-turn-score-label">
                This Turn{bonusPoints ? ' · Bonus' : ''}
              </span>
              <span className="flip-scaffold-turn-score-value">+{turnScore}</span>
            </div>

            <button className="flip-next-team-btn" data-sound="none" disabled={!turnOver} onClick={nextTeam}>
              Next Team
            </button>
          </div>
        </div>

        <div className="flip-grid-panel">
          <div className="flip-grid">
            {gridCards.map((card, i) => {
              const token = revealed[i]
              const isFlipped = token !== null
              return (
                <button
                  key={i}
                  className="flip-cell"
                  data-sound="none"
                  onClick={() => flipTile(i)}
                  disabled={isFlipped || turnOver}
                >
                  <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                    <div className="flip-card-face flip-card-front">
                      <div className="flip-cell-img">
                        <img src={card.image_url} alt={card.label} />
                      </div>
                      {S.flipShowText && <div className="flip-cell-word">{card.label}</div>}
                    </div>
                    <div className={`flip-card-face flip-card-back ${token === FLIP_STOP ? 'flip-card-back-stop' : ''}`}>
                      {isFlipped && (
                        token === FLIP_STOP ? (
                          <>
                            <span className="flip-back-label">Stop!</span>
                            <Prohibit size={80} weight="fill" />
                          </>
                        ) : (
                          <>
                            <span className="flip-back-label">+{token} points</span>
                            <Sparkle size={80} weight="fill" />
                          </>
                        )
                      )}
                    </div>
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
              {rankedScores.map((s, rank) => (
                <div key={s.team} className="roll-end-row">
                  <div className="roll-end-rank">{rank === 0 ? <Trophy size={20} weight="fill" /> : rank + 1}</div>
                  <div className="roll-end-team">Team {s.team}</div>
                  <div className="roll-end-score">{s.score} pts</div>
                </div>
              ))}
            </div>
            <div className="end-buttons">
              <button className="end-btn end-btn-roll" onClick={onBackToSettings}>Play Again</button>
              <button className="end-btn end-btn-secondary" onClick={onExit}>End Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Flip