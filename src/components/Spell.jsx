import { useState, useRef, useEffect, useMemo } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn, Trophy } from '@phosphor-icons/react'
import { buildSpellWords, isLetterChar, formatClock, ALPHABET } from '../lib/spellRun'
import { spawnConfetti } from '../lib/confetti'

const CONFETTI_COLORS = ['var(--flash)', 'var(--reveal)', 'var(--target)', 'var(--vanish)', 'var(--roll)', 'var(--flip)']

// Finished-all-words runs always outrank unfinished ones; within the same
// outcome type, more time left / more words completed is better.
function scoreValue(result) {
  if (!result) return -1
  return result.finishedEarly ? 1000 + result.timeLeft : result.wordsCompleted
}

function Spell({ S, updateS, cards, onBackToSettings, onExit }) {
  const isUpper = S.spellLetterCase === 'upper'

  const spellWords = useRef(buildSpellWords(cards, S.spellWordCount))
  const previousResult = useRef(S.spellLastResult || null).current

  const [wordIdx, setWordIdx] = useState(0)
  const [filledPositions, setFilledPositions] = useState(() => new Set())
  const [wrongFlashLetter, setWrongFlashLetter] = useState(null)
  const [bonusFlash, setBonusFlash] = useState(null)
  const [timeLeft, setTimeLeft] = useState(S.spellTotalTime)
  const [status, setStatus] = useState('playing') // 'playing' | 'wordComplete' | 'timeUp' | 'allDone' | 'quit'
  const [showEnd, setShowEnd] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const timerRef = useRef(null)
  const advanceTimeoutRef = useRef(null)
  const wrongFlashTimeoutRef = useRef(null)
  const bonusFlashTimeoutRef = useRef(null)

  const currentWord = spellWords.current[wordIdx]
  const wordChars = currentWord ? [...currentWord.label] : []

  const currentPos = useMemo(() => {
    for (let i = 0; i < wordChars.length; i++) {
      if (isLetterChar(wordChars[i]) && !filledPositions.has(i)) return i
    }
    return -1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordChars, filledPositions])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  useEffect(() => {
    if (status !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setStatus('timeUp')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [status])

  useEffect(() => {
    if (status === 'timeUp' || status === 'allDone' || status === 'quit') {
      const result = {
        finishedEarly: status === 'allDone',
        wordsCompleted: status === 'allDone' ? spellWords.current.length : wordIdx,
        totalWords: spellWords.current.length,
        timeLeft: status === 'allDone' ? timeLeft : 0,
      }
      updateS({ spellLastResult: result })
      setShowEnd(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    return () => {
      clearTimeout(advanceTimeoutRef.current)
      clearTimeout(wrongFlashTimeoutRef.current)
      clearTimeout(bonusFlashTimeoutRef.current)
    }
  }, [])

  function tapLetter(letter) {
    if (status !== 'playing' || currentPos === -1) return

    const targetLetter = wordChars[currentPos].toUpperCase()
    if (letter !== targetLetter) {
      clearTimeout(wrongFlashTimeoutRef.current)
      setWrongFlashLetter(letter)
      wrongFlashTimeoutRef.current = setTimeout(() => setWrongFlashLetter(null), 400)
      return
    }

    const nextFilled = new Set(filledPositions)
    nextFilled.add(currentPos)
    setFilledPositions(nextFilled)
    setTimeLeft(t => t + S.spellLetterBonus)

    clearTimeout(bonusFlashTimeoutRef.current)
    setBonusFlash(S.spellLetterBonus)
    bonusFlashTimeoutRef.current = setTimeout(() => setBonusFlash(null), 700)

    const allFilled = wordChars.every((ch, i) => !isLetterChar(ch) || nextFilled.has(i))
    if (allFilled) {
      clearInterval(timerRef.current)
      spawnConfetti(CONFETTI_COLORS)
      const isLastWord = wordIdx === spellWords.current.length - 1
      setStatus(isLastWord ? 'allDone' : 'wordComplete')
      if (!isLastWord) {
        advanceTimeoutRef.current = setTimeout(() => nextWord(), 900)
      }
    }
  }

  function nextWord() {
    setWordIdx(i => i + 1)
    setFilledPositions(new Set())
    setWrongFlashLetter(null)
    setBonusFlash(null)
    setStatus('playing')
  }

  function handleQuit() {
    clearInterval(timerRef.current)
    setStatus('quit')
  }

  const finishedEarly = status === 'allDone'
  const endTitle = finishedEarly ? 'All Words Spelled!' : status === 'quit' ? 'Round Ended' : "Time's Up!"

  const currentResult = {
    finishedEarly,
    wordsCompleted: finishedEarly ? spellWords.current.length : wordIdx,
    totalWords: spellWords.current.length,
    timeLeft: finishedEarly ? timeLeft : 0,
  }
  const isNewBest = previousResult && scoreValue(currentResult) > scoreValue(previousResult)

  return (
    <div className="mode-screen spell-scope">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>
        <span className="topbar-counter">Word {Math.min(wordIdx + 1, spellWords.current.length)} of {spellWords.current.length}</span>
        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleQuit} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="spell-body">
        <div className="spell-card-panel">
          {currentWord && (
            <div className="spell-card">
              <div className="spell-card-img">
                <img src={currentWord.image_url} alt={currentWord.label} />
              </div>
              <div className="spell-word-boxes">
                {wordChars.map((ch, i) => {
                  if (!isLetterChar(ch)) {
                    return <span key={i} className="spell-word-space">{ch === ' ' ? '' : ch}</span>
                  }
                  const isFilled = filledPositions.has(i)
                  const isActive = i === currentPos
                  const displayCh = ch.toUpperCase()
                  return (
                    <div key={i} className={`spell-letter-box ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''}`}>
                      {isFilled ? (isUpper ? displayCh : displayCh.toLowerCase()) : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="spell-side-panel">
          <div className="spell-timer-box">
            <span className="spell-timer-label">Timer</span>
            <span className="spell-timer-value">{formatClock(timeLeft)}</span>
            {bonusFlash !== null && (
              <span key={Date.now()} className="spell-bonus-flash">+{bonusFlash}s</span>
            )}
          </div>

          {previousResult && (
            <div className="spell-last-run-box">
              <span className="spell-last-run-label">Last Run</span>
              <span className="spell-last-run-value">
                {previousResult.finishedEarly
                  ? `${formatClock(previousResult.timeLeft)} to spare`
                  : `${previousResult.wordsCompleted}/${previousResult.totalWords} words`}
              </span>
            </div>
          )}

          <div className="spell-alpha-grid">
            {ALPHABET.map(letter => (
              <button
                key={letter}
                className={`spell-alpha-key ${wrongFlashLetter === letter ? 'wrong shake' : ''}`}
                disabled={status !== 'playing'}
                onClick={() => tapLetter(letter)}
              >
                {isUpper ? letter : letter.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showEnd && (
        <div className="roll-overlay">
          <div className="roll-end-modal">
            {isNewBest && (
              <div className="spell-new-best">
                <Trophy size={20} weight="fill" />
                New Best!
              </div>
            )}
            <div className="roll-end-title">{endTitle}</div>
            <div className="spell-end-stat">
              {finishedEarly ? (
                <>
                  <span className="spell-end-stat-value">{formatClock(timeLeft)}</span>
                  <span className="spell-end-stat-label">time remaining</span>
                </>
              ) : (
                <>
                  <span className="spell-end-stat-value">{wordIdx}</span>
                  <span className="spell-end-stat-label">of {spellWords.current.length} words spelled</span>
                </>
              )}
            </div>
            <div className="end-buttons">
              <button className="end-btn end-btn-roll" onClick={onBackToSettings}>Revenge Round</button>
              <button className="end-btn end-btn-secondary" onClick={onExit}>End Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Spell