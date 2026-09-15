import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import FitText from './FitText'
import EndSheet from './EndSheet'
import { shuffle } from '../lib/shuffle'
import { spawnConfetti } from '../lib/confetti'

function Target({ S, cards, onBackToSettings, onExit }) {
  const targetWords = S.targetWords || []
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState('intro') // 'intro' | 'active'
  const [cardIdx, setCardIdx] = useState(0)
  const [hit, setHit] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [manualStop, setManualStop] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const roundCards = useRef([])

  const keyword = targetWords[round]
  const isLastRound = round >= targetWords.length - 1

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
    const deck = shuffle([...cards])
    // Push the target to at least 40% through the deck so it's never trivially early
    const targetIdx = deck.findIndex(c => c.id === keyword.id)
    const minPos = Math.floor(deck.length * 0.4)
    if (targetIdx !== -1 && targetIdx < minPos) {
      deck.splice(targetIdx, 1)
      deck.splice(minPos, 0, keyword)
    }
    roundCards.current = deck
    setCardIdx(0)
    setHit(false)
    setManualStop(false)
    setPhase('active')
  }

  function targetNext() {
    if (hit) {
      setShowEnd(true)
      return
    }
    let nextIdx = (cardIdx + 1) % roundCards.current.length
    if (nextIdx === 0) roundCards.current = shuffle([...cards])
    setCardIdx(nextIdx)

    const nextCard = roundCards.current[nextIdx]
    if (nextCard.id === keyword.id) {
      setHit(true)
      spawnConfetti(['var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)'])
    }
  }

  function nextRoundOrPlayAgain() {
    setShowEnd(false)
    if (isLastRound) {
      onBackToSettings()
    } else {
      setRound(r => r + 1)
      setPhase('intro')
    }
  }

  function handleStop() {
    setManualStop(!hit)
    setShowEnd(true)
  }

  if (!keyword) return null

  const activeCard = phase === 'active' ? roundCards.current[cardIdx] : null

  return (
    <div className="mode-screen">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <span className="topbar-counter">
          {phase === 'intro'
            ? `Round ${round + 1} of ${targetWords.length}`
            : `${cardIdx + 1} of ${roundCards.current.length}`}
        </span>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      {phase === 'intro' ? (
        <div className="target-intro-body">
          <div className="target-intro-label">The target is...</div>
          <div className="target-intro-card-wrap">
            {S.showImage && (
              <div className="flash-img-wrap">
                <img className="flash-img" src={keyword.image_url} alt={keyword.label} />
              </div>
            )}
            {S.showWord && (
              <FitText
                text={keyword.label}
                maxSize={S.showImage ? 220 : 320}
                minSize={32}
                className={`flash-word ${S.showImage ? 'flash-word-paired' : 'flash-word-solo'}`}
              />
            )}
          </div>
          <button className="target-start-btn" onClick={startRound}>Start Round</button>
        </div>
      ) : (
        <div className="flash-stage" onClick={targetNext}>
          <div className={`flash-card ${hit ? 'is-target' : ''}`}>
            {S.showImage && (
              <div className="flash-img-wrap">
                <img className="flash-img" src={activeCard.image_url} alt={activeCard.label} />
              </div>
            )}
            {S.showWord && (
              <FitText
                text={activeCard.label}
                maxSize={S.showImage ? 220 : 320}
                minSize={32}
                className={`flash-word ${S.showImage ? 'flash-word-paired' : 'flash-word-solo'}`}
              />
            )}
          </div>
        </div>
      )}

      {showEnd && (
        <EndSheet
          title={manualStop ? 'Stopped' : (isLastRound ? 'All done!' : `Round ${round + 1} finished!`)}
          primaryLabel={manualStop ? 'Back to Settings' : (isLastRound ? 'Play Again' : 'Next Round')}
          primaryClassName="end-btn-target"
          onPrimary={manualStop ? onBackToSettings : nextRoundOrPlayAgain}
          onSecondary={onExit}
        />
      )}
    </div>
  )
}

export default Target