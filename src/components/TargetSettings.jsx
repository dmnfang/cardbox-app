function TargetSettings({ S, updateS }) {
  const isKaruta = S.targetGameType === 'karuta'

  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Game</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${!isKaruta ? 'active' : ''}`}
              onClick={() => updateS({ targetGameType: 'keyword' })}
            >
              Keyword
            </button>
            <button
              className={`toggle-pill ${isKaruta ? 'active' : ''}`}
              onClick={() => updateS({ targetGameType: 'karuta' })}
            >
              Karuta
            </button>
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Text</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${S.showWord ? 'active' : ''}`}
              onClick={() => updateS({ showWord: true })}
            >
              On
            </button>
            <button
              className={`toggle-pill ${!S.showWord ? 'active' : ''}`}
              onClick={() => updateS({ showWord: false })}
            >
              Off
            </button>
          </div>
        </div>
      </div>

      <div className="flip-info-text">
        {isKaruta
          ? 'Tap a card to mark it claimed/said — tap again to undo. Good for Karuta-style games.'
          : 'Tap a card to highlight it as the keyword. Call out the words in any order, saying the keyword whenever you like.'}
      </div>
      <div style={{ flex: 1 }} />
    </>
  )
}

export default TargetSettings