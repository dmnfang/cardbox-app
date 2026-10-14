function BetSettings({ S, updateS }) {
  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Teams</span>
          <div className="toggle-group">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`toggle-pill ${S.betTeams === n ? 'active' : ''}`}
                onClick={() => updateS({ betTeams: n })}
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
              className={`toggle-pill ${S.betShowText ? 'active' : ''}`}
              onClick={() => updateS({ betShowText: true })}
            >
              On
            </button>
            <button
              className={`toggle-pill ${!S.betShowText ? 'active' : ''}`}
              onClick={() => updateS({ betShowText: false })}
            >
              Off
            </button>
          </div>
        </div>
      </div>

      <div className="bet-info-text">
        One card is hidden. Teams put their coins on the cards they think it could be, on up to 5 different cards.
        When it's revealed, coins on the right card come back doubled and coins on the wrong cards are lost.
        Everyone starts with 5 coins and gets 2 more every round.
      </div>
      <div style={{ flex: 1 }} />
    </>
  )
}

export default BetSettings