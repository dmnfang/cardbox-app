import { useEffect } from 'react'
import { SPEEDS, maxUniqueWords } from '../lib/beatRun'

const WORD_OPTIONS = [2, 3, 4, 5, 6, 7, 8]

function BeatSettings({ S, updateS, cards }) {
  const maxWords = cards ? maxUniqueWords(cards) : 8
  // largest option the deck can actually support (falls back to the smallest option)
  const fitWords = WORD_OPTIONS.filter(n => n <= maxWords).pop() ?? WORD_OPTIONS[0]
  const selectedWords = S.beatWords > maxWords ? fitWords : S.beatWords

  // keep the saved setting in sync so Beat launches with what's highlighted
  useEffect(() => {
    if (S.beatWords !== selectedWords) updateS({ beatWords: selectedWords })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.beatWords, selectedWords])

  return (
    <>
      <div className="settings-row">
        <div className="settings-block">
          <span className="settings-label">Words</span>
          <div className="toggle-group">
            {WORD_OPTIONS.map(n => (
              <button
                key={n}
                className={`toggle-pill ${selectedWords === n ? 'active' : ''}`}
                disabled={n > maxWords}
                onClick={() => updateS({ beatWords: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Speed</span>
          <div className="toggle-group">
            {SPEEDS.map(sp => (
              <button
                key={sp.id}
                className={`toggle-pill ${S.beatSpeed === sp.id ? 'active' : ''}`}
                onClick={() => updateS({ beatSpeed: sp.id })}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-block">
          <span className="settings-label">Card Text</span>
          <div className="toggle-group">
            <button
              className={`toggle-pill ${S.beatShowText ? 'active' : ''}`}
              onClick={() => updateS({ beatShowText: true })}
            >
              Show
            </button>
            <button
              className={`toggle-pill ${!S.beatShowText ? 'active' : ''}`}
              onClick={() => updateS({ beatShowText: false })}
            >
              Hide
            </button>
          </div>
        </div>
      </div>

      <div className="spell-info-text">
        Five rounds per song. Each round, eight cards pop in one at a time while the class memorizes them, then they light up one by one in time with the music and the class says each word as it's highlighted. "Words" is how many different words show up among the eight cards, so fewer words means more repeats.
      </div>
      <div style={{ flex: 1 }} />
    </>
  )
}

export default BeatSettings