import { useLayoutEffect, useRef } from 'react'

// One line of text that shrinks to fit the width it's given.
// The line box is always the same height, so images next to it never change size.
function LineFit({ text, max = 32, min = 12, className = '' }) {
  const boxRef = useRef(null)
  const spanRef = useRef(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const span = spanRef.current
    if (!box || !span) return

    function fit() {
      span.style.fontSize = max + 'px'
      const avail = box.clientWidth
      const need = span.offsetWidth
      const size = need > avail && avail > 0 ? Math.max(min, Math.floor((max * avail) / need)) : max
      span.style.fontSize = size + 'px'
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [text, max, min])

  const lineHeight = Math.round(max * 1.3)
  return (
    <div
      ref={boxRef}
      className={`line-fit ${className}`}
      style={{ height: lineHeight, lineHeight: `${lineHeight}px` }}
    >
      <span ref={spanRef}>{text}</span>
    </div>
  )
}

export default LineFit