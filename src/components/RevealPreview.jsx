import { useState, useEffect, useRef } from 'react'
import { shuffle } from '../lib/shuffle'
import FitText from './FitText'
import Flashlight from './Flashlight'
import PixelCanvas, { PIXEL_LEVELS } from './PixelCanvas'

const SQ_COLORS = ['var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)']
const GRID_MAP = { '4x4': [4, 4], '6x4': [6, 4], '8x4': [8, 4], '10x4': [10, 4] }
const SPEED_MS = { 1: 800, 2: 400, 3: 150 }
const PIX_MS = { 1: 1200, 2: 700, 3: 400 }

function RevealPreview({ sample, content, mode, grid, speed, lightSize, lightShape }) {
  const [cols, rows] = GRID_MAP[grid] || [4, 4]
  const total = cols * rows
  const [gone, setGone] = useState(Array(total).fill(false))
  const [pixLevel, setPixLevel] = useState(0)
  const orderRef = useRef([])
  const stepRef = useRef(0)

  // Tiles preview
  useEffect(() => {
    if (mode !== 'tiles') return
    setGone(Array(total).fill(false))
    orderRef.current = shuffle([...Array(total).keys()])
    stepRef.current = 0

    let interval
    let restartTimeout

    function tick() {
      if (stepRef.current >= orderRef.current.length) {
        clearInterval(interval)
        restartTimeout = setTimeout(() => {
          setGone(Array(total).fill(false))
          orderRef.current = shuffle([...Array(total).keys()])
          stepRef.current = 0
          interval = setInterval(tick, SPEED_MS[speed] || 800)
        }, 1000)
        return
      }
      const idx = orderRef.current[stepRef.current]
      setGone(prev => {
        const next = [...prev]
        next[idx] = true
        return next
      })
      stepRef.current++
    }

    interval = setInterval(tick, SPEED_MS[speed] || 800)
    return () => {
      clearInterval(interval)
      clearTimeout(restartTimeout)
    }
  }, [mode, total, speed, grid])

  // Pixelate preview: loops, holding the full-res image for two ticks
  useEffect(() => {
    if (mode !== 'pixelate') return
    setPixLevel(0)
    const id = setInterval(
      () => setPixLevel(l => (l >= PIXEL_LEVELS.length + 2 ? 0 : l + 1)),
      PIX_MS[speed] || 700
    )
    return () => clearInterval(id)
  }, [mode, speed])

  if (!sample) return null

  const pixelating = mode === 'pixelate' && pixLevel < PIXEL_LEVELS.length

  return (
    <div className="card-preview">
      {content === 'image' ? (
        <div className="flash-img-wrap">
          {pixelating ? (
            <PixelCanvas card={sample} content="image" level={pixLevel} />
          ) : (
            <img className="flash-img" src={sample.image_url} alt={sample.label} />
          )}
        </div>
      ) : pixelating ? (
        <div className="preview-pix-word">
          <PixelCanvas card={sample} content="word" level={pixLevel} />
        </div>
      ) : (
        <FitText text={sample.label} maxSize={320} minSize={32} className="flash-word flash-word-solo" />
      )}

      {mode === 'tiles' && (
        <div
          className="card-preview-reveal"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="reveal-preview-sq"
              style={{
                background: SQ_COLORS[(i + Math.floor(i / cols)) % SQ_COLORS.length],
                opacity: gone[i] ? 0 : 1,
              }}
            />
          ))}
        </div>
      )}

      {mode === 'flashlight' && <Flashlight size={lightSize} shape={lightShape} speed={speed} />}
    </div>
  )
}

export default RevealPreview