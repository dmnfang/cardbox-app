import { useState } from 'react'

function GuessModal({ title, words, disabledWords, accentClassName, onGuess, onClose }) {
  const [shakeWord, setShakeWord] = useState(null)

  function handleTap(word) {
    if (disabledWords.includes(word)) return
    const correct = onGuess(word)
    if (!correct) {
      setShakeWord(word)
      setTimeout(() => setShakeWord(null), 400)
    }
  }

  return (
    <div className="guess-modal">
      <div className="guess-top">
        <div className="guess-top-header">
          <div className="guess-title">{title}</div>
          <button className="guess-close" onClick={onClose}>✕</button>
        </div>

        <div className={`guess-accent-bar ${accentClassName}`} />

        <div className="guess-word-grid">
          {words.map(word => {
            const isDisabled = disabledWords.includes(word)
            return (
              <button
                key={word}
                className={`guess-word-btn ${shakeWord === word ? 'shake' : ''}`}
                disabled={isDisabled}
                onClick={() => handleTap(word)}
              >
                {word}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GuessModal