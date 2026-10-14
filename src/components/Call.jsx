import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, Play, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import EndSheet from './EndSheet'
import LineFit from './LineFit'
import { shuffle } from '../lib/shuffle'
import { sound } from '../lib/sound'

const SLIDE_MS = 130
const TICK_GAP_MS = 20
const LANDING_DELAYS = [160, 190, 230, 280, 340, 410, 490, 580, 690] // deceleration steps
const SETTLE_PAUSE_MS = 500
const LANDING_TICKS = true // ticks that spread out as the wheel slows; set to false to drop them

// Three different cards for the reel from what's left in the pool.
// With a single card left the other frames stay empty instead of repeating it.
function dealReel(pool) {
  const p = shuffle([...pool])
  if (p.length === 1) return { prev: null, current: p[0], next: null }
  return { prev: p[0], current: p[1], next: p[2] || p[0] }
}

function Call({ S, cards, onBackToSettings, onExit }) {
  const [pool, setPool] = useState(() => shuffle([...cards]))
  const [called, setCalled] = useState([])
  const [spinning, setSpinning] = useState(false)
  const [landing, setLanding] = useState(false)
  const [sliding, setSliding] = useState(false)
  const [reel, setReel] = useState(() => dealReel(cards))
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [frameHeight, setFrameHeight] = useState(200)

  const poolRef = useRef(pool)
  const reelRef = useRef(reel)
  const cycleRef = useRef({ order: [], idx: 0 })
  const spinIntervalRef = useRef(null)
  const landingTimeoutRef = useRef(null)
  const viewportRef = useRef(null)
  const spinSoundRef = useRef(null)
  const timers = useRef([])

  useEffect(() => { poolRef.current = pool }, [pool])

  // timeouts that are cancelled if the screen is left mid-spin
  function later(fn, ms) {
    timers.current.push(setTimeout(fn, ms))
  }

  useEffect(() => {
    function measure() {
      if (viewportRef.current) setFrameHeight(viewportRef.current.offsetHeight * 0.6)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (viewportRef.current) ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(spinIntervalRef.current)
      clearTimeout(landingTimeoutRef.current)
      timers.current.forEach(clearTimeout)
      spinSoundRef.current?.stop(0.15)
    }
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  function stopSpinSound(fade = 0.25) {
    spinSoundRef.current?.stop(fade)
    spinSoundRef.current = null
  }

  function applyReel(next) {
    reelRef.current = next
    setReel(next)
  }

  // Next card from a shuffled pass over the pool. Every card comes up once per pass, and
  // a card that is already on screen (avoid) is skipped unless the pool is too small to avoid it.
  function drawCard(avoid = []) {
    const cyc = cycleRef.current
    const avoidIds = new Set(avoid.filter(Boolean).map(c => c.id))
    const canAvoid = poolRef.current.length > avoidIds.size
    if (cyc.idx >= cyc.order.length) {
      cyc.order = shuffle([...poolRef.current])
      cyc.idx = 0
    }
    if (canAvoid) {
      let j = cyc.idx
      while (j < cyc.order.length && avoidIds.has(cyc.order[j].id)) j++
      if (j === cyc.order.length) {
        // everything left in this pass is already on screen: start a fresh pass
        cyc.order = shuffle([...poolRef.current])
        cyc.idx = 0
        j = 0
        while (avoidIds.has(cyc.order[j].id)) j++
      }
      ;[cyc.order[cyc.idx], cyc.order[j]] = [cyc.order[j], cyc.order[cyc.idx]]
    }
    return cyc.order[cyc.idx++]
  }

  // forcedNext = the card to place on the bottom frame; extraAvoid = a card to keep off the reel for now
  function advanceReel(forcedNext, extraAvoid) {
    setSliding(true)
    later(() => {
      const r = reelRef.current
      const next = forcedNext || drawCard([r.current, r.next, extraAvoid])
      applyReel({ prev: r.current, current: r.next, next })
      setSliding(false)
    }, SLIDE_MS)
  }

  function finishCall(card) {
    const isLast = poolRef.current.length <= 1
    if (!isLast) sound.play('correct') // the last card goes straight to the end fanfare
    setCalled(c => [...c, card])
    setPool(p => p.filter(c => c.id !== card.id))
    setLanding(false)
    if (isLast) later(() => setShowEnd(true), 400)
  }

  function startSpin() {
    if (spinning || landing || poolRef.current.length === 0) return
    const remaining = poolRef.current

    // one card left: nothing to spin, just call it
    if (remaining.length === 1) {
      setLanding(true)
      applyReel({ prev: null, current: remaining[0], next: null })
      sound.play('cardFlip')
      later(() => finishCall(remaining[0]), SETTLE_PAUSE_MS)
      return
    }

    applyReel(dealReel(remaining)) // called cards leave the wheel before it starts moving
    cycleRef.current = { order: shuffle([...remaining]), idx: 0 }
    setSpinning(true)
    spinSoundRef.current = sound.play('callSpin')
    spinIntervalRef.current = setInterval(() => advanceReel(), SLIDE_MS + TICK_GAP_MS)
  }

  function stopSpin() {
    if (!spinning) return
    clearInterval(spinIntervalRef.current)
    stopSpinSound(0.25)
    setSpinning(false)
    setLanding(true)

    const r = reelRef.current
    const finalCard = drawCard([r.prev, r.current, r.next])
    const queueStep = LANDING_DELAYS.length - 2  // where finalCard becomes "next" (bottom peek)
    const landStep = LANDING_DELAYS.length - 1   // where it shifts into center

    function step(i) {
      advanceReel(i === queueStep ? finalCard : undefined, i === queueStep ? undefined : finalCard)
      if (LANDING_TICKS) sound.tick({ freq: 1500 - i * 90, volume: i === landStep ? 1.4 : 1 })
      if (i < landStep) {
        landingTimeoutRef.current = setTimeout(() => step(i + 1), LANDING_DELAYS[i + 1])
      } else {
        // finalCard has now shifted into the center frame
        later(() => finishCall(finalCard), SLIDE_MS + SETTLE_PAUSE_MS)
      }
    }
    landingTimeoutRef.current = setTimeout(() => step(0), LANDING_DELAYS[0])
  }

  function handleToggleSpin() {
    if (spinning) stopSpin()
    else startSpin()
  }

  function handleStop() {
    clearInterval(spinIntervalRef.current)
    clearTimeout(landingTimeoutRef.current)
    timers.current.forEach(clearTimeout)
    stopSpinSound(0.15)
    setShowEnd(true)
  }

  function playAgain() {
    setShowEnd(false)
    const shuffled = shuffle([...cards])
    setPool(shuffled)
    setCalled([])
    setSpinning(false)
    setLanding(false)
    applyReel(dealReel(shuffled))
    onBackToSettings()
  }

  const restOffset = -(frameHeight * (2 / 3))
  const slideOffset = restOffset - frameHeight

  return (
    <div className="mode-screen">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <span className="topbar-counter">{called.length} of {cards.length} called</span>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="call-body">
        <div className="call-called-panel">
          <span className="panel-title">Called</span>
          <div className="call-called-grid">
            {called.map(card => (
              <div key={card.id} className="edit-card-tile">
                {S.showImage && (
                  <div className="edit-card-img">
                    <img src={card.image_url} alt={card.label} />
                  </div>
                )}
                {S.showWord && <div className="edit-card-label">{card.label}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="call-spinner-panel">
          <div className="call-reel-viewport" ref={viewportRef}>
            <div
              className="call-reel-track"
              style={{
                transform: `translateY(${sliding ? slideOffset : restOffset}px)`,
                transition: sliding ? `transform ${SLIDE_MS}ms cubic-bezier(0.3,0,0.2,1)` : 'none',
              }}
            >
              {[reel.prev, reel.current, reel.next].map((card, i) => (
                <div key={i} className={`call-reel-frame ${i === 1 ? 'center' : ''}`} style={{ height: frameHeight }}>
                  {card && (
                    <div className="call-reel-frame-content">
                      {S.showImage && (
                        <div className="call-reel-frame-img">
                          <img src={card.image_url} alt={card.label} />
                        </div>
                      )}
                      {S.showWord && <LineFit text={card.label} max={28} min={14} className="call-reel-word" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            className={`call-spin-btn ${spinning ? 'stop' : ''}`}
            data-sound="none"
            onClick={handleToggleSpin}
            disabled={landing || (pool.length === 0 && !spinning)}
          >
            {spinning ? (
              <><Stop size={20} weight="fill" /> Stop</>
            ) : (
              <><Play size={20} weight="fill" /> Start</>
            )}
          </button>
        </div>
      </div>

      {showEnd && (
        <EndSheet
          title="All Called!"
          primaryLabel="Play Again"
          primaryClassName="end-btn-call"
          onPrimary={playAgain}
          onSecondary={onExit}
        />
      )}
    </div>
  )
}

export default Call