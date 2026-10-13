import { useEffect } from 'react'
import { sound } from '../lib/sound'

function EndSheet({ title, primaryLabel = 'Play Again', primaryClassName, onPrimary, onSecondary }) {
  useEffect(() => {
    sound.play('allDone')
  }, [])

  return (
    <div className="end-overlay">
      <div className="end-sheet">
        <div className="end-title">{title}</div>
        <div className="end-buttons">
          <button className={`end-btn ${primaryClassName}`} onClick={onPrimary}>
            {primaryLabel}
          </button>
          <button className="end-btn end-btn-secondary" onClick={onSecondary}>
            End Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default EndSheet