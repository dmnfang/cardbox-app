import { useState, useRef, useEffect, useMemo } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, DiceFive, ArrowRight, ArrowLeft, Hand, Trophy } from '@phosphor-icons/react'
import { GRID_MAP, buildSnakePath, weightedRandom, ROLL_OUTCOMES, ROLL_WEIGHTS, ROLL_POINT_OPTIONS, ROLL_COLORS } from '../lib/roll'
import { shuffle } from '../lib/shuffle'
import { spawnConfetti } from '../lib/confetti'

function Roll({ S, cards, onBackToSettings, onExit }) {
  const [cols, rows] = GRID_MAP[S.rollGrid] || [4, 4]
  const snakePath = useMemo(() => buildSnakePath(cols, rows), [cols, rows])
  const total = snakePath.length
  const teamCount = S.rollTeams

  const [positions, setPositions] = useState(() => Array(teamCount).fill(0))
  const [scores, setScores] = useState(() => Array(teamCount).fill(0))
  const [currentTeam, setCurrentTeam] = useState(0)
  const [pulseTeam, setPulseTeam] = useState(null)
  const [phase, setPhase] = useState('board') // board | dieRolling | dieReady | moving | card | result | end
  const [dieValue, setDieValue] = useState(1)
  const [activeCard, setActiveCard] = useState(null)
  const [resultOutcome, setResultOutcome] = useState(null)
  const [resultPoints, setResultPoints] = useState(0)
  const [tokenSize, setTokenSize] = useState(40)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const cardPoolRef = useRef(shuffle([...cards]))
  const cardIdxRef = useRef(0)
  const resultDataRef = useRef({ points: 0, outcome: 'forward' })
  const boardRef = useRef(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  useEffect(() => {
    function measure() {
      const board = boardRef.current
      if (!board) return
      const boardWidth = board.offsetWidth
      const cellSize = (boardWidth - (cols - 1) * 12) / cols
      setTokenSize(Math.min(Math.floor(cellSize * 0.35), 60))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (boardRef.current) ro.observe(boardRef.current)
    return () => ro.disconnect()
  }, [cols])

  function getNextCard() {
    if (cardIdxRef.current >= cardPoolRef.current.length) {
      cardPoolRef.current = shuffle([...cards])
      cardIdxRef.current = 0
    }
    return cardPoolRef.current[cardIdxRef.current++]
  }

  function tapDie() {
    if (phase !== 'board') return
    const finalValue = Math.floor(Math.random() * 6) + 1
    setPhase('dieRolling')
    let count = 0
    const interval = setInterval(() => {
      setDieValue(Math.floor(Math.random() * 6) + 1)
      count++
      if (count >= 15) {
        clearInterval(interval)
        setDieValue(finalValue)
        setPhase('dieReady')
      }
    }, 60)
  }

  function confirmDie() {
    setPhase('moving')
    setTimeout(() => animateMove(currentTeam, dieValue), 400)
  }

  function animateMove(teamIdx, stepsRemaining) {
    if (stepsRemaining === 0) {
      const card = getNextCard()
      setActiveCard(card)
      setPhase('card')
      return
    }
    setPositions(prev => {
      const next = [...prev]
      next[teamIdx] = (next[teamIdx] + 1) % total
      if (next[teamIdx] === 0) {
        setScores(s => { const ns = [...s]; ns[teamIdx] += 200; return ns })
        spawnConfetti(ROLL_COLORS)
      }
      return next
    })
    setTimeout(() => animateMove(teamIdx, stepsRemaining - 1), 800)
  }

  function gotIt() {
    const outcome = weightedRandom(ROLL_OUTCOMES, ROLL_WEIGHTS)
    const targetPoints = ROLL_POINT_OPTIONS[Math.floor(Math.random() * ROLL_POINT_OPTIONS.length)]
    resultDataRef.current = { points: targetPoints, outcome: outcome.type }
    setResultOutcome(outcome)
    setPhase('result')
    let count = 0
    const interval = setInterval(() => {
      setResultPoints(ROLL_POINT_OPTIONS[Math.floor(Math.random() * ROLL_POINT_OPTIONS.length)])
      count++
      if (count >= 15) {
        clearInterval(interval)
        setResultPoints(targetPoints)
      }
    }, 80)
  }

  function rollDoneClick() {
    const { points, outcome } = resultDataRef.current
    const teamIdx = currentTeam
    setScores(s => { const ns = [...s]; ns[teamIdx] += points; return ns })
    setPhase('board')

    if (outcome === 'forward' || outcome === 'back') {
      setTimeout(() => {
        setPositions(p => {
          const np = [...p]
          np[teamIdx] = outcome === 'forward' ? (np[teamIdx] + 1) % total : (np[teamIdx] - 1 + total) % total
          return np
        })
      }, 400)
    } else {
      setPulseTeam(teamIdx)
      setTimeout(() => setPulseTeam(null), 200)
    }

    setTimeout(() => {
      const nextTeam = (teamIdx + 1) % teamCount
      setCurrentTeam(nextTeam)
      setPulseTeam(nextTeam)
      setTimeout(() => setPulseTeam(null), 250)
    }, 900)
  }

  function tokensAt(gridIdx) {
    return positions
      .map((pathPos, teamIdx) => ({ teamIdx, gridIdx: snakePath[pathPos] }))
      .filter(t => t.gridIdx === gridIdx)
  }

  function nubFor(gridIdx, pathPos) {
    if (pathPos < 0 || pathPos >= total - 1) return ''
    const nextGridIdx = snakePath[pathPos + 1]
    const curRow = Math.floor(gridIdx / cols)
    const nxtRow = Math.floor(nextGridIdx / cols)
    const curCol = gridIdx % cols
    const nxtCol = nextGridIdx % cols
    if (nxtRow === curRow && nxtCol > curCol) return 'nub-right'
    if (nxtRow === curRow && nxtCol < curCol) return 'nub-left'
    if (nxtRow > curRow) return 'nub-down'
    return ''
  }

  const rankedScores = useMemo(() => {
    return scores.map((score, i) => ({ team: i + 1, score })).sort((a, b) => b.score - a.score)
  }, [scores])

  const OutcomeIcon = resultOutcome?.type === 'forward' ? ArrowRight
    : resultOutcome?.type === 'back' ? ArrowLeft
    : Hand

  return (
    <div className="mode-screen">
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
        <button className="topbar-action topbar-action-roll" onClick={tapDie}>
          <DiceFive size={20} weight="fill" />
        </button>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={() => setPhase('end')} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="roll-stage">
        <div
          className="roll-board"
          ref={boardRef}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {Array.from({ length: total }).map((_, gridIdx) => {
            const pathPos = snakePath.indexOf(gridIdx)
            const isStart = pathPos === 0
            const isLoop = pathPos === total - 1
            const bg = (isStart || isLoop) ? 'var(--flash)' : ROLL_COLORS[pathPos % ROLL_COLORS.length]
            const nub = nubFor(gridIdx, pathPos)
            const tokens = tokensAt(gridIdx)

            let tokensStyle = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            if (tokens.length > 0) {
              if (tokens.length <= 2) {
                tokensStyle = {
                  ...tokensStyle,
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 8,
                  width: tokens.length * tokenSize + (tokens.length - 1) * 8,
                  height: tokenSize,
                }
              } else {
                tokensStyle = {
                  ...tokensStyle,
                  display: 'grid',
                  gridTemplateColumns: `repeat(2, ${tokenSize}px)`,
                  gap: 8,
                  width: 2 * tokenSize + 8,
                  height: 2 * tokenSize + 8,
                }
              }
            }

            return (
              <div key={gridIdx} className={`roll-cell ${nub}`} style={{ background: bg }}>
                <div className="roll-cell-icon" />
                {tokens.length > 0 && (
                  <div className="roll-cell-tokens" style={tokensStyle}>
                    {tokens.map(t => (
                      <div
                        key={t.teamIdx}
                        className={`roll-token ${t.teamIdx === currentTeam ? 'roll-token-active' : ''} ${pulseTeam === t.teamIdx ? 'roll-token-pulse' : ''}`}
                        style={{ width: tokenSize, height: tokenSize, fontSize: Math.floor(tokenSize * 0.45) }}
                      >
                        {t.teamIdx + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {(phase === 'dieRolling' || phase === 'dieReady') && (
        <div className="roll-overlay">
          <div className="roll-die-modal">
            <div className="roll-die-number">{dieValue}</div>
            {phase === 'dieReady' && (
              <button className="roll-got-it-btn" onClick={confirmDie}>Move</button>
            )}
          </div>
        </div>
      )}

      {phase === 'card' && activeCard && (
        <div className="roll-overlay">
          <div className="roll-card-modal">
            <div className="roll-card-img-wrap">
              <img src={activeCard.image_url} alt={activeCard.label} />
            </div>
            <div className="roll-card-word">{activeCard.label}</div>
            <button className="roll-got-it-btn" onClick={gotIt}>Got it!</button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="roll-overlay">
          <div className="roll-result-modal">
            <div className="roll-result-row">
              <div className="roll-result-col">
                <div className="roll-result-points">{resultPoints}</div>
                <div className="roll-result-sub">points</div>
              </div>
              <div className="roll-result-col">
                <OutcomeIcon size={240} weight="fill" />
                <div className="roll-result-sub">{resultOutcome?.label}</div>
              </div>
            </div>
            <button className="roll-got-it-btn roll-result-done" onClick={rollDoneClick}>Done</button>
          </div>
        </div>
      )}

      {phase === 'end' && (
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

export default Roll