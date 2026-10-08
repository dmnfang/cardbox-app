import VanishPreview from './VanishPreview'

function VanishSettings({ S, updateS, cards }) {
  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Card Text</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${S.vanishShowText ? 'active' : ''}`}
              onClick={() => updateS({ vanishShowText: true })}
            >
              On
            </button>
            <button
              className={`toggle-pill ${!S.vanishShowText ? 'active' : ''}`}
              onClick={() => updateS({ vanishShowText: false })}
            >
              Off
            </button>
          </div>
        </div>
      </div>

      <div className="vanish-info-text">
        Choose how many cards vanish from the Shuffle button on the play screen — change it any time, it takes effect next round. Grid size is set automatically.
      </div>

      <div className="preview-area">
        <span className="settings-label">Grid Preview</span>
        <VanishPreview cards={cards} showText={S.vanishShowText} />
      </div>
    </>
  )
}

export default VanishSettings