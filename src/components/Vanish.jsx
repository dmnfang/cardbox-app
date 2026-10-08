import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, Ghost, Minus, Plus } from '@phosphor-icons/react'
import EndSheet from './EndSheet'
import GuessModal from './GuessModal'
import { shuffle } from '../lib/shuffle'
import { spawnConfetti } from '../lib/confetti'
import { autoVanishGrid, buildVanishPool } from '../lib/vanishGrid'

const SHUFFLE_COLORS = ['var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)']

function uniqueLabels(cards) {
  return [...new Set(cards.map(c => c.label))]
}

function Vanish({ S, cards, onBackToSettings, onExit }) {
  const poolCards = useRef(buildVanishPool(cards))
  const [cols, rows] = autoVanishGrid(poolCards.current.length)
  const maxVanish = Math.max(1, Math.min(8, poolCards.current.length - 1))

  const [vanishCount, setVanishCount] = useState(1)
  const [round, setRound] = useState(0)
  const [gridCards, setGridCards] = useState(() => shuffle([...poolCards.current]))
  const [ghostIdxs, setGhostIdxs] = useState([])
  const [foundIdxs, setFoundIdxs] = useState([])
  const [phase, setPhase] = useState('study')
  const [cycleStep, setCycleStep] = useState(0)
  const [showGuess, setShowGuess] = useState(false)
  const [guessWords, setGuessWords] = useState(() => uniqueLabels(cards))
  const [disabledWords, setDisabledWords] = useState([])
  const [peekIdx, setPeekIdx] = useState(null)
  const [showRoundEnd, setShowRoundEnd] = useState(false)
  const [manualStop, setManualStop] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const shuffleIntervalRef = useRef(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  function startRound() {
  const fresh = shuffle([...poolCards.current])
  setGridCards(fresh)
  setGhostIdxs([])
  setFoundIdxs([])
  setGuessWords(uniqueLabels(cards))
  setDisabledWords([])
  setPhase('study')
  setCycleStep(0)
}

  useEffect(() => {
    startRound()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function doShuffle() {
  const countAtTap = vanishCount
  setPhase('shuffling')
  let step = 0
  setCycleStep(0)
  shuffleIntervalRef.current = setInterval(() => {
    step++
    setCycleStep(step)
    if (step >= 5) {
      clearInterval(shuffleIntervalRef.current)
      setTimeout(() => {
        const reshuffled = shuffle([...poolCards.current])
        setGridCards(reshuffled)
        setGhostIdxs(shuffle(reshuffled.map((_, i) => i)).slice(0, countAtTap))
        setPhase('guessing')
      }, 200)
    }
  }, 200)
}

  function actionTap() {
    if (phase === 'study') doShuffle()
    else if (phase === 'guessing') setShowGuess(true)
  }

  function handleGuess(word) {
    const remaining = ghostIdxs.filter(i => !foundIdxs.includes(i))
    const match = remaining.find(i => gridCards[i].label.trim().toLowerCase() === word.trim().toLowerCase())
    if (match !== undefined) {
      const newFound = [...foundIdxs, match]
      setFoundIdxs(newFound)
      setShowGuess(false)
      setDisabledWords([])
      spawnConfetti(['var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)'])
      const allFound = ghostIdxs.every(i => newFound.includes(i))
      if (allFound) {
        setTimeout(() => setShowRoundEnd(true), 1000)
      }
      return true
    }
    setDisabledWords(prev => [...prev, word])
    return false
  }

  function showMe() {
    const remaining = ghostIdxs.filter(i => !foundIdxs.includes(i))
    if (!remaining.length) return
    const idx = remaining[Math.floor(Math.random() * remaining.length)]
    setPeekIdx(idx)
    setTimeout(() => setPeekIdx(null), 500)
  }

  function nextRound() {
    setShowRoundEnd(false)
    setRound(r => r + 1)
    startRound()
  }

  function handleStop() {
    clearInterval(shuffleIntervalRef.current)
    setManualStop(true)
    setShowRoundEnd(true)
  }

  function adjustVanishCount(delta) {
    setVanishCount(c => Math.max(1, Math.min(maxVanish, c + delta)))
  }

  return (
    <div className="mode-screen">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <button className="topbar-action topbar-action-vanish" onClick={actionTap}>
          {phase === 'study' ? 'Shuffle' : 'Guess'}
        </button>
        <div className="vanish-count-stepper">
          <button
            className="vanish-count-btn"
            onClick={() => adjustVanishCount(-1)}
            disabled={vanishCount <= 1 || phase !== 'study'}
            aria-label="Fewer cards vanish"
          >
            <Minus size={14} weight="bold" />
          </button>
          <span className="vanish-count-value">
            <Ghost size={18} weight="fill" /> {vanishCount}
          </span>
          <button
            className="vanish-count-btn"
            onClick={() => adjustVanishCount(1)}
            disabled={vanishCount >= maxVanish || phase !== 'study'}
            aria-label="More cards vanish"
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
        {phase === 'guessing' && (
          <button className="nav-btn nav-btn-showme" onClick={showMe}>
            Show Me
          </button>
        )}
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      {phase === 'study' && <div className="vanish-instruction">Please look carefully!</div>}
      {phase === 'shuffling' && <div className="vanish-instruction">Shuffling...</div>}

      <div className="vanish-stage">
        <div
          className="vanish-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {phase === 'shuffling'
            ? gridCards.map((_, i) => (
                <div
                  key={`shuffle-${i}`}
                  className="vanish-cell shuffling"
                  style={{ background: SHUFFLE_COLORS[(i + cycleStep) % 4] }}
                >
                  <Ghost className="vanish-ghost-icon-white" size={28} weight="fill" />
                </div>
              ))
            : gridCards.map((card, i) => {
                const isGhost = phase === 'guessing' && ghostIdxs.includes(i) && !foundIdxs.includes(i) && peekIdx !== i
                const isCorrect = foundIdxs.includes(i)
                return (
                  <div
                    key={`${round}-${i}`}
                    className={`vanish-cell ${isGhost ? 'ghost' : ''} ${isCorrect ? 'correct' : ''}`}
                  >
                    {isGhost ? (
                      <Ghost className="vanish-ghost-icon" size={64} weight="fill" />
                    ) : (
                      <>
                        <div className="vanish-cell-img">
                          <img src={card.image_url} alt={card.label} />
                        </div>
                        {S.vanishShowText && <div className="vanish-cell-word">{card.label}</div>}
                      </>
                    )}
                  </div>
                )
              })}
        </div>
      </div>

      {showGuess && (
        <GuessModal
          title="Guess the vanished card!"
          words={guessWords}
          disabledWords={disabledWords}
          accentClassName="guess-accent-vanish"
          onGuess={handleGuess}
          onClose={() => setShowGuess(false)}
        />
      )}

      {showRoundEnd && (
        <EndSheet
          title={manualStop ? 'Stopped' : `Round ${round + 1} finished!`}
          primaryLabel={manualStop ? 'Back to Settings' : 'Next Round'}
          primaryClassName="end-btn-vanish"
          onPrimary={manualStop ? onBackToSettings : nextRound}
          onSecondary={onExit}
        />
      )}
    </div>
  )
}

export default Vanish