import { useEffect, useId, useRef, useState } from 'react'

export const LIGHT_SIZES = { 1: 0.22, 2: 0.34, 3: 0.5 }   // diameter as a fraction of the shorter side
export const LIGHT_SPEEDS = { 1: 0.25, 2: 0.5, 3: 0.9 }   // shorter sides travelled per second
export const LIGHT_SHAPES = ['circle', 'star', 'square', 'triangle']

function polygonPoints(shape, r) {
  if (shape === 'triangle') {
    return [[0, -r], [r * 0.95, r * 0.8], [-r * 0.95, r * 0.8]].map(p => p.join(',')).join(' ')
  }
  // star
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 ? r * 0.45 : r
    return `${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`
  }).join(' ')
}

function Flashlight({ size = 2, shape = 'circle', speed = 2, paused = false, revealed = false }) {
  const rootRef = useRef(null)
  const gRef = useRef(null)
  const posRef = useRef(null)
  const targetRef = useRef(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const [dim, setDim] = useState({ w: 0, h: 0 })
  const maskId = 'fl' + useId().replace(/:/g, '')

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setDim({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const r = (Math.min(dim.w, dim.h) * (LIGHT_SIZES[size] || 0.34)) / 2

  useEffect(() => {
    const { w, h } = dim
    if (!w || !h) return
    const m = Math.min(r * 0.5, w / 2, h / 2)
    const rand = () => ({
      x: m + Math.random() * (w - 2 * m),
      y: m + Math.random() * (h - 2 * m),
    })
    if (!posRef.current) posRef.current = rand()
    if (!targetRef.current) targetRef.current = rand()

    const pxPerSec = (LIGHT_SPEEDS[speed] || 0.5) * Math.min(w, h)
    let raf
    let last = performance.now()

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!pausedRef.current) {
        const p = posRef.current
        const t = targetRef.current
        const dx = t.x - p.x
        const dy = t.y - p.y
        const d = Math.hypot(dx, dy)
        const step = pxPerSec * dt
        if (d <= step) {
          p.x = t.x
          p.y = t.y
          targetRef.current = rand()
        } else {
          p.x += (dx / d) * step
          p.y += (dy / d) * step
        }
      }
      gRef.current?.setAttribute('transform', `translate(${posRef.current.x} ${posRef.current.y})`)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [dim.w, dim.h, r, speed])

  let hole
  if (shape === 'circle') hole = <circle r={r} fill="#000" />
  else if (shape === 'square') hole = <rect x={-r * 0.9} y={-r * 0.9} width={r * 1.8} height={r * 1.8} rx={r * 0.12} fill="#000" />
  else hole = <polygon points={polygonPoints(shape, r)} fill="#000" />

  return (
    <div ref={rootRef} className={`flashlight-overlay ${revealed ? 'off' : ''}`}>
      {dim.w > 0 && (
        <svg width={dim.w} height={dim.h}>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={dim.w} height={dim.h}>
              <rect width={dim.w} height={dim.h} fill="#fff" />
              <g ref={gRef}>{hole}</g>
            </mask>
          </defs>
          <rect width={dim.w} height={dim.h} style={{ fill: 'var(--sand-900)' }} mask={`url(#${maskId})`} />
        </svg>
      )}
    </div>
  )
}

export default Flashlight