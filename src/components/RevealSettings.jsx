import RevealPreview from './RevealPreview'

const MODES = [
  { id: 'tiles', label: 'Tiles' },
  { id: 'flashlight', label: 'Flashlight' },
  { id: 'pixelate', label: 'Pixelate' },
]
const SHAPES = [
  { id: 'circle', label: 'Circle' },
  { id: 'star', label: 'Star' },
  { id: 'square', label: 'Square' },
  { id: 'triangle', label: 'Triangle' },
]

function RevealSettings({ S, updateS, cards }) {
  const sample = cards[0]
  const mode = S.revealMode || 'tiles'

  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Mode</span>
          <div className="toggle-group">
            {MODES.map(m => (
              <button
                key={m.id}
                className={`toggle-pill ${mode === m.id ? 'active' : ''}`}
                onClick={() => updateS({ revealMode: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Content</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${S.revealContent === 'image' ? 'active' : ''}`}
              onClick={() => updateS({ revealContent: 'image' })}
            >
              Image
            </button>
            <button
              className={`toggle-pill ${S.revealContent === 'word' ? 'active' : ''}`}
              onClick={() => updateS({ revealContent: 'word' })}
            >
              Word
            </button>
          </div>
        </div>

        {mode === 'tiles' && (
          <div className="settings-block">
            <span className="settings-label">Grid Size</span>
            <div className="toggle-group">
              {['4x4', '6x4', '8x4', '10x4'].map(g => (
                <button
                  key={g}
                  className={`toggle-pill ${S.revealGrid === g ? 'active' : ''}`}
                  onClick={() => updateS({ revealGrid: g })}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'flashlight' && (
          <>
            <div className="settings-block">
              <span className="settings-label">Light Size</span>
              <div className="toggle-group">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    className={`toggle-pill-circle ${S.revealLightSize === s ? 'active' : ''}`}
                    onClick={() => updateS({ revealLightSize: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-block">
              <span className="settings-label">Shape</span>
              <div className="toggle-group">
                {SHAPES.map(sh => (
                  <button
                    key={sh.id}
                    className={`toggle-pill ${S.revealLightShape === sh.id ? 'active' : ''}`}
                    onClick={() => updateS({ revealLightShape: sh.id })}
                  >
                    {sh.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="settings-block">
          <span className="settings-label">Speed</span>
          <div className="toggle-group">
            {[1, 2, 3].map(s => (
              <button
                key={s}
                className={`toggle-pill-circle ${S.revealSpeed === s ? 'active' : ''}`}
                onClick={() => updateS({ revealSpeed: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="preview-area">
        <span className="settings-label">Card Preview</span>
        <RevealPreview
          sample={sample}
          content={S.revealContent}
          mode={mode}
          grid={S.revealGrid}
          speed={S.revealSpeed}
          lightSize={S.revealLightSize}
          lightShape={S.revealLightShape}
        />
      </div>
    </>
  )
}

export default RevealSettings