function CallSettings({ S, updateS }) {
  const isLucky = S.callMode === 'lucky'

  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Mode</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${!isLucky ? 'active' : ''}`}
              onClick={() => updateS({ callMode: 'bingo' })}
            >
              Bingo
            </button>
            <button
              className={`toggle-pill ${isLucky ? 'active' : ''}`}
              onClick={() => updateS({ callMode: 'lucky' })}
            >
              Lucky Draw
            </button>
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Content</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${S.showImage ? 'active' : ''}`}
              onClick={() => updateS({ showImage: !S.showImage })}
            >
              Image
            </button>
            <button
              className={`toggle-pill ${S.showWord ? 'active' : ''}`}
              onClick={() => updateS({ showWord: !S.showWord })}
            >
              Word
            </button>
          </div>
        </div>
      </div>

      <div className="call-info-text">
        {isLucky
          ? 'Every card in the deck is on the board. Pick how many lucky cards to draw (1–5), tap Draw, and the board shuffles and reveals the winners. Draw again as many times as you like.'
          : 'Tap the spinner to call a random card. Called cards collect on the left — once every card\'s been called, the round ends.'}
      </div>
      <div style={{ flex: 1 }} />
    </>
  )
}

export default CallSettings