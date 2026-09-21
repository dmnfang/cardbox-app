import { useState, useEffect } from 'react'
import { House, ArrowsOut, ArrowsIn, Lightning, Eye, Crosshair as TargetIcon, Ghost, DiceFive, Stack, Timer, Megaphone } from '@phosphor-icons/react'
import FlashSettings from './FlashSettings'
import RevealSettings from './RevealSettings'
import TargetSettings from './TargetSettings'
import VanishSettings from './VanishSettings'
import RollSettings from './RollSettings'
import FlipSettings from './FlipSettings'
import SpellSettings from './SpellSettings'
import EditCardsModal from './EditCardsModal'
import { getActiveCards, getDeckCards } from '../lib/cards'
import CallSettings from './CallSettings'

const MODES = [
  { id: 'flash',  label: 'Flash',  icon: Lightning },
  { id: 'reveal', label: 'Reveal', icon: Eye },
  { id: 'target', label: 'Target', icon: TargetIcon },
  { id: 'vanish', label: 'Vanish', icon: Ghost },
  { id: 'roll',   label: 'Roll',   icon: DiceFive },
  { id: 'flip',   label: 'Flip',   icon: Stack },
  { id: 'spell',  label: 'Spell',  icon: Timer },
  { id: 'call', label: 'Call', icon: Megaphone }
]

const IMPLEMENTED_MODES = ['flash', 'reveal', 'target', 'vanish', 'roll', 'flip', 'spell', 'call']

function Prelaunch({ S, updateS, onBack, onLaunch }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showEditCards, setShowEditCards] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  function removeDeck(deckId) {
    updateS({ selectedDecks: S.selectedDecks.filter(d => d.id !== deckId) })
  }

  function handleSaveDisabledCards(disabledIds) {
    updateS({ disabledCardIds: disabledIds })
    setShowEditCards(false)
  }

  const deckCards = getDeckCards(S.cards, S.selectedDecks)
  const activeCards = getActiveCards(S.cards, S.selectedDecks, S.disabledCardIds)
  const activeMode = MODES.find(m => m.id === S.mode)

  return (
    <div className="prelaunch-screen">
      <div className="prelaunch-topbar">
        <button className="nav-btn" onClick={onBack}>
          <House size={18} weight="fill" />
        </button>

        <div className="mode-toggle-group">
          {MODES.map(m => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                className={`mode-toggle-pill ${S.mode === m.id ? 'active' : ''}`}
                onClick={() => updateS({ mode: m.id })}
              >
                <Icon size={20} weight="fill" />
                {m.label}
              </button>
            )
          })}
        </div>

        <button className="nav-btn" onClick={toggleFullscreen}>
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
      </div>

      <div className="prelaunch-body">
        <div className="prelaunch-left">
          <span className="panel-title">Selected Decks</span>
          {S.selectedDecks.length > 0 && (
            <button className="edit-cards-btn" onClick={() => setShowEditCards(true)}>
              Edit Cards
            </button>
          )}

          <div className="selected-list">
            {S.selectedDecks.length === 0 ? (
              <div className="no-decks">
                <p><strong>No decks selected</strong><br />Please go back and select some decks to use this mode</p>
                <button className="back-home-btn" onClick={onBack}>Back to Home</button>
              </div>
            ) : (
              S.selectedDecks.map(deck => {
                const activeCount = activeCards.filter(c => c.category_id === deck.id).length
                return (
                  <div key={deck.id} className="sel-item">
                    <div className="deck-card-header">
                      <span className="sel-title">{deck.name}</span>
                      <button className="remove-btn" onClick={() => removeDeck(deck.id)}>✕</button>
                    </div>
                    <div className="deck-chip">{activeCount} cards</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="prelaunch-right">
          {S.mode === 'flash' ? (
            <FlashSettings S={S} updateS={updateS} cards={activeCards} />
          ) : S.mode === 'reveal' ? (
            <RevealSettings S={S} updateS={updateS} cards={activeCards} />
          ) : S.mode === 'target' ? (
            <TargetSettings S={S} updateS={updateS} cards={activeCards} />
          ) : S.mode === 'vanish' ? (
            <VanishSettings S={S} updateS={updateS} cards={activeCards} />
          ) : S.mode === 'roll' ? (
            <RollSettings S={S} updateS={updateS} />
          ) : S.mode === 'flip' ? (
            <FlipSettings S={S} updateS={updateS} />
          ) : S.mode === 'spell' ? (
            <SpellSettings S={S} updateS={updateS} />  
          ) : S.mode === 'call' ? (
            <CallSettings S={S} updateS={updateS} />
          ) : (
            <div className="settings-placeholder">
              {activeMode?.label} settings — coming soon
            </div>
          )}

          <button
            className={`launch-btn launch-btn-${S.mode}`}
            disabled={
              S.selectedDecks.length === 0 ||
              activeCards.length === 0 ||
              !IMPLEMENTED_MODES.includes(S.mode) ||
              (S.mode === 'target' && (S.targetWords?.length ?? 0) === 0)
            }
            onClick={() => onLaunch(S.mode, activeCards)}
          >
            Launch {activeMode?.label}
          </button>
        </div>
      </div>

      {showEditCards && (
        <EditCardsModal
          cards={deckCards}
          selectedDecks={S.selectedDecks}
          disabledCardIds={S.disabledCardIds || []}
          onSave={handleSaveDisabledCards}
          onClose={() => setShowEditCards(false)}
        />
      )}
    </div>
  )
}

export default Prelaunch