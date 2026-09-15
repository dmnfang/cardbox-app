import { useState } from 'react'
import { X, CheckFat as Check, Eye, EyeSlash } from '@phosphor-icons/react'

function EditCardsModal({ cards, selectedDecks, disabledCardIds, onSave, onClose }) {
  const [localDisabled, setLocalDisabled] = useState(() => new Set(disabledCardIds))

  function toggle(cardId) {
    setLocalDisabled(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  function toggleDeck(deckCards, allOff) {
    setLocalDisabled(prev => {
      const next = new Set(prev)
      deckCards.forEach(card => {
        if (allOff) next.delete(card.id)
        else next.add(card.id)
      })
      return next
    })
  }

  function handleSave() {
    onSave(Array.from(localDisabled))
  }

  const enabledCount = cards.length - localDisabled.size

  return (
    <div className="edit-cards-overlay">
      <div className="edit-cards-header">
        <span className="edit-cards-title">Edit Cards</span>
        <span className="edit-cards-counter">
          <strong>{enabledCount}</strong> cards selected
        </span>
        <div className="edit-cards-header-actions">
          <button className="edit-cards-save-btn" onClick={handleSave}>Save</button>
          <button className="nav-btn" onClick={onClose}>
            <X size={18} weight="fill" />
          </button>
        </div>
      </div>

      <div className="edit-cards-body">
        {selectedDecks.map(deck => {
          const deckCards = cards.filter(c => c.category_id === deck.id)
          if (!deckCards.length) return null

          const offCount = deckCards.filter(c => localDisabled.has(c.id)).length
          const allOff = offCount === deckCards.length
          const allOn = offCount === 0

          return (
            <div key={deck.id} className="edit-cards-deck-group">
              <div className="edit-cards-deck-header">
                <span className="edit-cards-deck-name">{deck.name}</span>
                <button
                  className={`edit-deck-toggle-btn ${allOff ? 'all-off' : ''}`}
                  onClick={() => toggleDeck(deckCards, allOff)}
                >
                  {allOff ? <EyeSlash size={14} weight="fill" /> : <Eye size={14} weight="fill" />}
                  {allOn ? 'All On' : allOff ? 'All Off' : `${deckCards.length - offCount}/${deckCards.length} On`}
                </button>
              </div>
              <div className="edit-cards-grid">
                {deckCards.map(card => {
                  const isOff = localDisabled.has(card.id)
                  return (
                    <button
                      key={card.id}
                      className={`edit-card-tile ${isOff ? 'off' : ''}`}
                      onClick={() => toggle(card.id)}
                    >
                      <div className="edit-card-img">
                        <img src={card.image_url} alt={card.label} />
                      </div>
                      <div className="edit-card-label">{card.label}</div>
                      {!isOff && (
                        <div className="edit-card-check">
                          <Check size={14} weight="fill" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EditCardsModal