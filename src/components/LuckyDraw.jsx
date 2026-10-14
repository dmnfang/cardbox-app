import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, Clover, Minus, Plus } from '@phosphor-icons/react'
import EndSheet from './EndSheet'
import { shuffle } from '../lib/shuffle'
import { spawnConfetti } from '../lib/confetti'
import { sound } from '../lib/sound'
import LineFit from './LineFit'

const MAX_LUCKY = 5
const GRID_GAP = 12
const DRAWN_GAP = 16
const SHUFFLE_STEPS = 7
const SHUFFLE_STEP_MS = 200
const CARD_STAGGER_MS = 120
const SHUFFLE_COLORS = [
  'var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)',
  'var(--roll)', 'var(--flip)', 'var(--spell)', 'var(--call)',
]

// Picks the column count that makes the cells as large as possible for n cards in a w x h box.
function fitGrid(n, w, h, gap) {
  if (!w || !h) {
    const c = Math.max(1, Math.ceil(Math.sqrt(n)))
    return [c, Math.max(1, Math.ceil(n / c))]
  }
  let best = [1, n]
  let bestScore = -1
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cw = (w - (cols - 1) * gap) / cols
    const ch = (h - (rows - 1) * gap) / rows
    const score = Math.min(cw, ch)
    if (score > bestScore) {
      bestScore = score
      best = [cols, rows]
    }
  }
  return best
}

// Layout for the drawn cards: 1-3 in a row, 4 as 2x2, 5 as 3 + 2.
function drawnLayout(n) {
  const cols = n <= 3 ? n : n === 4 ? 2 : 3
  return { cols, rows: Math.ceil(n / cols) }
}

function LuckyDraw({ S, cards, onBackToSettings, onExit }) {
  const maxLucky = Math.max(1, Math.min(MAX_LUCKY, cards.length))

  const [gridCards] = useState(() => shuffle([...cards]))
  const [luckyCount, setLuckyCount] = useState(1)
  const [phase, setPhase] = useState('idle') // 'idle' | 'shuffling' | 'drawn'
  const [cycleStep, setCycleStep] = useState(0)
  const [drawn, setDrawn] = useState([])
  const [drawKey, setDrawKey] = useState(0)
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [area, setArea] = useState({ w: 0, h: 0 })

  const areaRef = useRef(null)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const lastDrawnIds = useRef([])
  const soundTimers = useRef([])

  // Delayed sounds are cancelled if the screen is left mid-draw
  function later(fn, ms) {
    soundTimers.current.push(setTimeout(fn, ms))
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    function measure() {
      if (areaRef.current) setArea({ w: areaRef.current.offsetWidth, h: areaRef.current.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (areaRef.current) ro.observe(areaRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timeoutRef.current)
      soundTimers.current.forEach(clearTimeout)
    }
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  // Avoids repeating the previous draw when the deck is big enough to allow it.
  function pickCards(n) {
    const prev = new Set(lastDrawnIds.current)
    const fresh = cards.filter(c => !prev.has(c.id))
    const pool = fresh.length >= n ? fresh : cards
    return shuffle([...pool]).slice(0, n)
  }

  function doDraw() {
    if (phase === 'shuffling' || cards.length === 0) return
    const n = luckyCount
    setPhase('shuffling')
    setCycleStep(0)
    sound.play('vanishShuffle')
    let step = 0
    intervalRef.current = setInterval(() => {
      step++
      setCycleStep(step)
      // the shuffle sound is 0.6s but the animation runs ~1.4s, so play a second pass partway
      if (step === 4) sound.play('vanishShuffle', { rate: 1.1 })
      if (step >= SHUFFLE_STEPS) {
        clearInterval(intervalRef.current)
        timeoutRef.current = setTimeout(() => {
          const picked = pickCards(n)
          lastDrawnIds.current = picked.map(c => c.id)
          setDrawn(picked)
          setDrawKey(k => k + 1)
          setPhase('drawn')
          spawnConfetti(['var(--call)', 'var(--flash)', 'var(--reveal)', 'var(--spell)'])
          // one pop per card, matching the staggered pop-in animation
          picked.forEach((_, i) => {
            later(() => sound.play('tilePop', { rate: [0.95, 1.1] }), i * CARD_STAGGER_MS)
          })
        }, SHUFFLE_STEP_MS)
      }
    }, SHUFFLE_STEP_MS)
  }

  function adjustCount(delta) {
    setLuckyCount(c => Math.max(1, Math.min(maxLucky, c + delta)))
  }

  function handleStop() {
    clearInterval(intervalRef.current)
    clearTimeout(timeoutRef.current)
    setShowEnd(true)
  }

  const [cols, rows] = fitGrid(gridCards.length, area.w, area.h, GRID_GAP)
  const layout = drawnLayout(drawn.length)

  const instruction =
    phase === 'idle' ? 'Pick a number, then tap Draw!'
    : phase === 'shuffling' ? 'Shuffling...'
    : drawn.length === 1 ? 'Lucky card!' : 'Lucky cards!'

  return (
    <div className="mode-screen">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <button
          className="topbar-action topbar-action-call"
          data-sound="none"
          onClick={doDraw}
          disabled={phase === 'shuffling' || cards.length === 0}
        >
          {phase === 'drawn' ? 'Draw Again' : 'Draw'}
        </button>
        <div className="vanish-count-stepper">
          <button
            className="vanish-count-btn"
            onClick={() => adjustCount(-1)}
            disabled={luckyCount <= 1 || phase === 'shuffling'}
            aria-label="Fewer lucky cards"
          >
            <Minus size={14} weight="bold" />
          </button>
          <span className="vanish-count-value">
            <Clover size={18} weight="fill" /> {luckyCount}
          </span>
          <button
            className="vanish-count-btn"
            onClick={() => adjustCount(1)}
            disabled={luckyCount >= maxLucky || phase === 'shuffling'}
            aria-label="More lucky cards"
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="vanish-instruction">{instruction}</div>

      <div className="vanish-stage">
        <div className="lucky-area" ref={areaRef}>
          {phase === 'drawn' ? (
            <div className="lucky-drawn" key={drawKey}>
              {drawn.map((card, i) => (
                <div
                  key={card.id}
                  className="lucky-card"
                  style={{
                    width: `calc((100% - ${(layout.cols - 1) * DRAWN_GAP}px) / ${layout.cols})`,
                    height: `calc((100% - ${(layout.rows - 1) * DRAWN_GAP}px) / ${layout.rows})`,
                    animationDelay: `${i * CARD_STAGGER_MS}ms`,
                  }}
                >
                  {S.showImage && (
                    <div className="lucky-card-img">
                      <img src={card.image_url} alt={card.label} />
                    </div>
                  )}
                  {S.showWord && <LineFit text={card.label} max={64} min={20} className="lucky-card-word" />}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="lucky-grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
            >
              {phase === 'shuffling'
                ? gridCards.map((_, i) => (
                    <div
                      key={`shuffle-${i}`}
                      className="vanish-cell shuffling"
                      style={{ background: SHUFFLE_COLORS[(i + cycleStep) % SHUFFLE_COLORS.length] }}
                    >
                      <Clover className="vanish-ghost-icon-white" size={28} weight="fill" />
                    </div>
                  ))
                : gridCards.map(card => (
                    <div key={card.id} className="vanish-cell">
                      {S.showImage && (
                        <div className="vanish-cell-img">
                          <img src={card.image_url} alt={card.label} />
                        </div>
                      )}
                      {S.showWord && <LineFit text={card.label} max={16} min={10} className="vanish-cell-word" />}
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>

      {showEnd && (
        <EndSheet
          title="Stopped"
          primaryLabel="Back to Settings"
          primaryClassName="end-btn-call"
          onPrimary={onBackToSettings}
          onSecondary={onExit}
        />
      )}
    </div>
  )
}

export default LuckyDraw