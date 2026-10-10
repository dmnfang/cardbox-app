// Keeps --app-h at the full-screen height while a [data-stable-viewport]
// input is focused, so the on-screen keyboard doesn't resize the layout.
export function initStableViewportHeight() {
  const root = document.documentElement

  const keyboardInput = () => {
    const el = document.activeElement
    return !!(el && el.closest && el.closest('[data-stable-viewport]'))
  }

  const apply = () => {
    if (keyboardInput()) return // keyboard is up: keep the last full height
    root.style.setProperty('--app-h', `${window.innerHeight}px`)
  }

  apply()
  window.addEventListener('resize', apply)
  window.addEventListener('orientationchange', () => setTimeout(apply, 300))
  document.addEventListener('focusout', () => setTimeout(apply, 300))
}