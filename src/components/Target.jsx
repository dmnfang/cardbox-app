import { useState, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, CheckFat as Check, Crosshair as TargetIcon } from '@phosphor-icons/react'
import EndSheet from './EndSheet'

function Target({ S, cards, onBackToSettings, onExit }) {
  const isKaruta = S.targetGameType === 'karuta'
  const [keywordId, setKeywordId] = useState(null)
  const [claimedIds, setClaimedIds] = useState(() => new Set())
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  function tapCard(card) {
    if (isKaruta) {
      setClaimedIds(prev => {
        const next = new Set(prev)
        if (next.has(card.id)) next.delete(card.id)
        else next.add(card.id)
        return next
      })
    } else {
      setKeywordId(prev => (prev === card.id ? null : card.id))
    }
  }

  function handleStop() {
    setShowEnd(true)
  }

  function playAgain() {
    setShowEnd(false)
    setKeywordId(null)
    setClaimedIds(new Set())
    onBackToSettings()
  }

  return (
    <div className="mode-screen">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <span className="topbar-counter">{cards.length} cards</span>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="target-grid-stage">
        <div className="word-picker-grid">
          {cards.map(card => {
            const isKeyword = !isKaruta && keywordId === card.id
            const isClaimed = isKaruta && claimedIds.has(card.id)
            return (
              <button
                key={card.id}
                className={`word-tile ${isKeyword ? 'selected' : ''} ${isClaimed ? 'claimed' : ''}`}
                onClick={() => tapCard(card)}
              >
                <div className="word-tile-img">
                  <img src={card.image_url} alt={card.label} />
                </div>
                {S.showWord && <div className="word-tile-label">{card.label}</div>}
                {isClaimed && (
  <div className="word-tile-badge">
    <Check size={12} weight="fill" />
  </div>
)}
{isKeyword && (
  <div className="word-tile-badge-target">
    <TargetIcon size={22} weight="fill" />
  </div>
)}
              </button>
            )
          })}
        </div>
      </div>

      {showEnd && (
        <EndSheet
          title="Stopped"
          primaryLabel="Back to Settings"
          primaryClassName="end-btn-target"
          onPrimary={playAgain}
          onSecondary={onExit}
        />
      )}
    </div>
  )
}

export default Target