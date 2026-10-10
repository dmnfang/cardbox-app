import { useEffect, useRef, useState } from 'react'

// Blocks across the card width at each step; after the last step the real image/word is shown
export const PIXEL_LEVELS = [3, 5, 8, 12, 18, 28, 44, 70]

function PixelCanvas({ card, content, level }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [img, setImg] = useState(null)
  const [fontTick, setFontTick] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    document.fonts?.ready.then(() => setFontTick(t => t + 1))
  }, [])

  useEffect(() => {
    setImg(null)
    if (content !== 'image') return
    let alive = true
    const im = new Image()
    im.onload = () => alive && setImg(im)
    im.src = card.image_url
    return () => { alive = false }
  }, [card, content])

  useEffect(() => {
    const { w, h } = size
    const canvas = canvasRef.current
    if (!w || !h || !canvas) return
    if (content === 'image' && !img) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = Math.round(w * dpr)
    const H = Math.round(h * dpr)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // 1. Render the source at full size
    const src = document.createElement('canvas')
    src.width = W
    src.height = H
    const sctx = src.getContext('2d')
    sctx.fillStyle = '#fff'
    sctx.fillRect(0, 0, W, H)
    if (content === 'image') {
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      sctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
    } else {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--sand-900').trim() || '#353127'
      sctx.fillStyle = color
      sctx.textAlign = 'center'
      sctx.textBaseline = 'middle'
      let fs = H * 0.5
      sctx.font = `700 ${fs}px Lexend, Nunito, sans-serif`
      const m = sctx.measureText(card.label).width
      if (m > W * 0.88) {
        fs *= (W * 0.88) / m
        sctx.font = `700 ${fs}px Lexend, Nunito, sans-serif`
      }
      sctx.fillText(card.label, W / 2, H / 2)
    }

    // 2. Downsample to a tiny canvas, 3. scale back up with no smoothing
    const blocks = PIXEL_LEVELS[Math.min(level, PIXEL_LEVELS.length - 1)]
    const tw = blocks
    const th = Math.max(1, Math.round((blocks * H) / W))
    const tiny = document.createElement('canvas')
    tiny.width = tw
    tiny.height = th
    const tctx = tiny.getContext('2d')
    tctx.imageSmoothingQuality = 'high'
    tctx.drawImage(src, 0, 0, tw, th)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tiny, 0, 0, tw, th, 0, 0, W, H)
  }, [size, img, card, content, level, fontTick])

  return (
    <div ref={wrapRef} className="pixel-wrap">
      <canvas ref={canvasRef} className="pixel-canvas" />
    </div>
  )
}

export default PixelCanvas