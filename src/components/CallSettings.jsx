function CallSettings({ S, updateS }) {
  return (
    <>
      <div className="settings-row">
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
        Tap the spinner to call a random card. Called cards collect on the left — once every card's been called, the round ends.
      </div>
      <div style={{ flex: 1 }} />
    </>
  )
}

export default CallSettings