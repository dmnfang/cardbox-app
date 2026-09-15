function FlipSettings({ S, updateS }) {
  const isCoins = S.flipType === 'coins'

  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Type</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${!isCoins ? 'active' : ''}`}
              onClick={() => updateS({ flipType: 'points' })}
            >
              Points
            </button>
            <button
              className={`toggle-pill ${isCoins ? 'active' : ''}`}
              onClick={() => updateS({ flipType: 'coins' })}
            >
              Coins
            </button>
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Teams</span>
          <div className="toggle-group">
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`toggle-pill ${S.flipTeams === n ? 'active' : ''}`}
                onClick={() => updateS({ flipTeams: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Text</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${S.flipShowText ? 'active' : ''}`}
              onClick={() => updateS({ flipShowText: true })}
            >
              On
            </button>
            <button
              className={`toggle-pill ${!S.flipShowText ? 'active' : ''}`}
              onClick={() => updateS({ flipShowText: false })}
            >
              Off
            </button>
          </div>
        </div>
      </div>

      <div className="settings-block flip-scaffold-inputs">
        <span className="settings-label">Question</span>
        <input
          className="flip-text-input"
          type="text"
          placeholder="e.g. What sport do you like?"
          value={S.flipQuestion || ''}
          onChange={e => updateS({ flipQuestion: e.target.value })}
        />
        <span className="settings-label">Answer</span>
        <input
          className="flip-text-input"
          type="text"
          placeholder="e.g. I like ..."
          value={S.flipAnswer || ''}
          onChange={e => updateS({ flipAnswer: e.target.value })}
        />
        <div className="flip-scaffold-hint">Leave both blank if you're just practicing vocabulary — the deck name will show instead.</div>
      </div>

      <div className="flip-info-text">
        {isCoins
          ? 'Each team flips one of two cards, hoping to find the coin. Find it and go again — hit the stop card and the turn ends, banking however many coins you found in a row.'
          : 'Each team flips a grid of 6 cards worth 5, 4, 3, 2, and 1 points. Hit the stop card and the turn ends — no penalty, you just bank what you found. Teams cycle in order until you end the game.'}
      </div>
      <div style={{ flex: 1 }} />
    </>
  )
}

export default FlipSettings