import { useState, useRef, useEffect, useMemo } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import FitText from './FitText'
import EndSheet from './EndSheet'
import { shuffle } from '../lib/shuffle'
import { autoFlashGrid } from '../lib/flashGrid'
import { sound } from '../lib/sound'

const BACK_ZONE = 0.3          // left 30% of the card goes back, the rest advances
const NAV_COOLDOWN_MS = 250    // ignore taps faster than this so a quick double-tap can't skip a card

function Flash({ S, cards, onBackToSettings, onExit }) {
  const orderedCards = useRef(
    S.cardOrder === 'shuffle' ? shuffle(cards) : [...cards]
  )
  const flashCards = orderedCards.current
  const [gridCols, gridRows] = useMemo(() => autoFlashGrid(flashCards.length), [flashCards.length])
  const gridCapacity = gridCols * gridRows
  const gridPreviewCards = flashCards.slice(0, gridCapacity)
  const gridOverflow = flashCards.length - gridPreviewCards.length

  const [showGrid, setShowGrid] = useState(!!S.previewGrid)
  const [idx, setIdx] = useState(0)
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const touchX = useRef(0)
  const lastNavRef = useRef(0)

  const card = flashCards[idx]

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  function dismissGrid() {
    sound.play('tap')
    setShowGrid(false)
  }

  // true if enough time has passed since the last card change
  function navAllowed() {
    const now = performance.now()
    if (now - lastNavRef.current < NAV_COOLDOWN_MS) return false
    lastNavRef.current = now
    return true
  }

  function advance() {
    if (!navAllowed()) return
    if (idx < flashCards.length - 1) {
      sound.play('nextCard')
      setIdx(i => i + 1)
    } else {
      setShowEnd(true) // EndSheet plays the finish fanfare
    }
  }

  function back() {
    if (idx === 0) return
    if (!navAllowed()) return
    sound.play('nextCard', { rate: 0.85 }) // a touch lower so going back sounds different
    setIdx(i => i - 1)
  }

  function handleStageClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    if (x < BACK_ZONE) back()
    else advance()
  }

  function handleStop() {
    setShowEnd(true)
  }

  function handleTouchStart(e) {
    touchX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) advance()
      else back()
    }
  }

  useEffect(() => {
    function handleKey(e) {
      if (showGrid) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          dismissGrid()
        }
        return
      }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); advance() }
      if (e.key === 'ArrowLeft') back()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  })

  function playAgain() {
    setShowEnd(false)
    setIdx(0)
    setShowGrid(!!S.previewGrid)
    onBackToSettings()
  }

  if (!card) return null

  return (
    <div className="mode-screen">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <span className="topbar-counter">
          {showGrid ? `${flashCards.length} cards` : `${idx + 1} of ${flashCards.length}`}
        </span>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      {showGrid ? (
        <div className="flash-grid-wrap" onClick={dismissGrid}>
          <div
            className="flash-grid"
            style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gridTemplateRows: `repeat(${gridRows}, 1fr)` }}
          >
            {gridPreviewCards.map(c => (
              <div key={c.id} className="flash-grid-cell">
                {S.showImage && (
                  <div className="flash-grid-cell-img">
                    <img src={c.image_url} alt={c.label} />
                  </div>
                )}
                {S.showWord && <div className="flash-grid-cell-word">{c.label}</div>}
              </div>
            ))}
          </div>
          <div className="flash-grid-hint">
            {gridOverflow > 0
              ? `Showing first ${gridPreviewCards.length} of ${flashCards.length} — tap anywhere to begin`
              : 'Tap anywhere to begin'}
          </div>
        </div>
      ) : (
        <div
          className="flash-stage"
          onClick={handleStageClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flash-card">
            {S.showImage && (
              <div className="flash-img-wrap">
                <img className="flash-img" src={card.image_url} alt={card.label} />
              </div>
            )}
            {S.showWord && (
              <FitText
                text={card.label}
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
          title="All done!"
          primaryLabel="Play Again"
          primaryClassName="end-btn-flash"
          onPrimary={playAgain}
          onSecondary={onExit}
        />
      )}
    </div>
  )
}

export default Flash