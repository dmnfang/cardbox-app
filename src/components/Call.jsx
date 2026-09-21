import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, Play, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import EndSheet from './EndSheet'
import { shuffle } from '../lib/shuffle'

const SLIDE_MS = 130
const TICK_GAP_MS = 20
const LANDING_DELAYS = [160, 190, 230, 280, 340, 410, 490, 580, 690] // deceleration steps
const SETTLE_PAUSE_MS = 500

function Call({ S, cards, onBackToSettings, onExit }) {
  const [pool, setPool] = useState(() => shuffle([...cards]))
  const [called, setCalled] = useState([])
  const [spinning, setSpinning] = useState(false)
  const [landing, setLanding] = useState(false)
  const [sliding, setSliding] = useState(false)
  const [reel, setReel] = useState(() => {
    const shuffled = shuffle([...cards])
    return { prev: shuffled[0], current: shuffled[1] || shuffled[0], next: shuffled[2] || shuffled[0] }
  })
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [frameHeight, setFrameHeight] = useState(200)

  const poolRef = useRef(pool)
  const cycleRef = useRef({ order: [], idx: 0 })
  const spinIntervalRef = useRef(null)
  const landingTimeoutRef = useRef(null)
  const viewportRef = useRef(null)

  useEffect(() => { poolRef.current = pool }, [pool])

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
    }
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  // Draws from a shuffled sequence of the current pool, guaranteeing every
  // card comes up once before any repeats — reshuffles once exhausted.
  function nextCycleCard() {
    const cyc = cycleRef.current
    if (cyc.idx >= cyc.order.length) {
      cyc.order = shuffle([...poolRef.current])
      cyc.idx = 0
    }
    const card = cyc.order[cyc.idx]
    cyc.idx++
    return card
  }

  function advanceReel(forcedNext) {
    setSliding(true)
    setTimeout(() => {
      setReel(r => ({
        prev: r.current,
        current: r.next,
        next: forcedNext || nextCycleCard(),
      }))
      setSliding(false)
    }, SLIDE_MS)
  }

  function startSpin() {
    if (spinning || landing || pool.length === 0) return
    cycleRef.current = { order: shuffle([...poolRef.current]), idx: 0 }
    setSpinning(true)
    spinIntervalRef.current = setInterval(() => advanceReel(), SLIDE_MS + TICK_GAP_MS)
  }

  function stopSpin() {
    if (!spinning) return
    clearInterval(spinIntervalRef.current)
    setSpinning(false)
    setLanding(true)

    const finalCard = nextCycleCard()
    const queueStep = LANDING_DELAYS.length - 2  // where finalCard becomes "next" (bottom peek)
    const landStep = LANDING_DELAYS.length - 1   // where it shifts into center

    function step(i) {
      advanceReel(i === queueStep ? finalCard : undefined)
      if (i < landStep) {
        landingTimeoutRef.current = setTimeout(() => step(i + 1), LANDING_DELAYS[i + 1])
      } else {
        // finalCard has now shifted into the center frame
        setTimeout(() => {
          setCalled(c => [...c, finalCard])
          setPool(p => {
            const next = p.filter(c => c.id !== finalCard.id)
            if (next.length === 0) setTimeout(() => setShowEnd(true), 400)
            return next
          })
          setLanding(false)
        }, SLIDE_MS + SETTLE_PAUSE_MS)
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
    setShowEnd(true)
  }

  function playAgain() {
    setShowEnd(false)
    const shuffled = shuffle([...cards])
    setPool(shuffled)
    setCalled([])
    setSpinning(false)
    setLanding(false)
    setReel({ prev: shuffled[0], current: shuffled[1] || shuffled[0], next: shuffled[2] || shuffled[0] })
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
                      {S.showWord && <div className="call-reel-word">{card.label}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            className={`call-spin-btn ${spinning ? 'stop' : ''}`}
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