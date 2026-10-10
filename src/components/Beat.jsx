import { useState, useRef, useEffect } from 'react'
import { Gear, Stop, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import trackUrl from '../assets/beat-track-5rounds.mp3'
import {
  BEAT_INTERVAL, BEAT_FIRST, BEAT_ROUNDS, BEAT_TOTAL_COUNTS, BEAT_FADE_AT_END,
  rateForRound, buildBeatSequence, phaseOf, roundsCompleted,
} from '../lib/beatRun'

const PHASE_LABEL = { countin: 'Get ready…', memorize: 'Memorize', speak: 'Say it!', done: 'Done!' }

function Beat({ S, cards, onBackToSettings, onExit }) {
  // All 5 rounds are dealt up front so nothing has to be built mid-song.
  const [sequences] = useState(() =>
    Array.from({ length: BEAT_ROUNDS }, () => buildBeatSequence(cards, S.beatWords))
  )
  const [status, setStatus] = useState('ready') // 'ready' | 'playing' | 'ended'
  const [countIdx, setCountIdx] = useState(-1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Optional tuning from the URL, e.g. ?beatFirst=0.10&beatCount=0.328
  const tune = useRef(
    (() => {
      const p = new URLSearchParams(window.location.search)
      const f = parseFloat(p.get('beatFirst'))
      const c = parseFloat(p.get('beatCount'))
      return {
        first: Number.isFinite(f) ? f : BEAT_FIRST,
        interval: Number.isFinite(c) && c > 0 ? c : BEAT_INTERVAL,
      }
    })()
  ).current

  const audioRef = useRef(null)
  const lastIdxRef = useRef(-2)
  const rafRef = useRef(0)
  const fadeRef = useRef(null)

  useEffect(() => {
    const a = new Audio(trackUrl)
    a.preload = 'auto'
    a.preservesPitch = true
    a.webkitPreservesPitch = true
    audioRef.current = a
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(fadeRef.current)
      a.pause()
      a.src = ''
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  // Playback must start from a tap (iPad blocks autoplay), so we wait on a Start button.
  function handleStart() {
    const a = audioRef.current
    a.currentTime = 0
    a.playbackRate = rateForRound(S.beatSpeed, 0)
    a.play().then(() => setStatus('playing')).catch(() => {})
  }

  // Everything on screen is derived from the audio clock, so it can't drift from the music.
  useEffect(() => {
    if (status !== 'playing') return
    const a = audioRef.current
    const tick = () => {
      const idx = Math.floor((a.currentTime - tune.first) / tune.interval)
      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx
        const { phase, pos, round } = phaseOf(idx)
        if (phase === 'memorize' && pos === 0) a.playbackRate = rateForRound(S.beatSpeed, round)
        setCountIdx(idx)
        if (idx >= BEAT_TOTAL_COUNTS) {
          setStatus('ended')
          if (BEAT_FADE_AT_END) fadeOutAudio()
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Fade the music out after round 5, then stop it (the song itself keeps going past our last round).
  function fadeOutAudio() {
    const a = audioRef.current
    if (!a) return
    let steps = 0
    clearInterval(fadeRef.current)
    fadeRef.current = setInterval(() => {
      steps += 1
      a.volume = Math.max(0, 1 - steps / 12) // iPadOS ignores volume, so it just stops at the end
      if (steps >= 12) {
        clearInterval(fadeRef.current)
        a.pause()
      }
    }, 100)
  }

  function handleStop() {
    cancelAnimationFrame(rafRef.current)
    clearInterval(fadeRef.current)
    audioRef.current?.pause()
    setStatus('ended')
  }

  const { phase, pos, round } = phaseOf(countIdx)
  const done = roundsCompleted(countIdx)
  const sequence = sequences[round]

  return (
    <div className="mode-screen beat-scope">
      <div className="mode-topbar">
        <button className="nav-btn" onClick={onBackToSettings} aria-label="Settings">
          <Gear size={18} weight="fill" />
        </button>

        <div className="beat-header">
          <span className="beat-phase">{status === 'ready' ? '' : PHASE_LABEL[phase]}</span>
          <div className="beat-pips" aria-label={`Round ${Math.min(done + 1, BEAT_ROUNDS)} of ${BEAT_ROUNDS}`}>
            {Array.from({ length: BEAT_ROUNDS }, (_, i) => (
              <span
                key={i}
                className={`beat-pip ${i < done ? 'done' : phase !== 'countin' && i === round ? 'current' : ''}`}
              />
            ))}
          </div>
        </div>

        <button className="nav-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={18} weight="fill" /> : <ArrowsOut size={18} weight="fill" />}
        </button>
        <button className="nav-btn" onClick={handleStop} aria-label="Stop">
          <Stop size={18} weight="fill" />
        </button>
      </div>

      <div className="beat-body">
        {phase === 'countin' ? (
          <div className="beat-countin">{status === 'playing' ? Math.max(countIdx, 0) + 1 : ''}</div>
        ) : (
          <div className="beat-grid">
            {sequence.map((card, i) => {
              const visible = phase !== 'memorize' || i <= pos
              const active = phase === 'speak' && i === pos
              return (
                <div
                  key={`${round}-${i}`}
                  className={`beat-card ${visible ? 'visible' : ''} ${active ? 'active' : ''}`}
                >
                  <div className="beat-card-img">
                    <img src={card.image_url} alt={card.label} />
                  </div>
                  {S.beatShowText && <div className="beat-card-word">{card.label}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {status === 'ready' && (
        <div className="beat-start-overlay">
          <button className="beat-start-btn" onClick={handleStart}>Start</button>
        </div>
      )}

      {status === 'ended' && (
        <div className="roll-overlay">
          <div className="roll-end-modal">
            <div className="roll-end-title">Great Rhythm!</div>
            <div className="spell-end-stat">
              <span className="spell-end-stat-value">{done}</span>
              <span className="spell-end-stat-label">of {BEAT_ROUNDS} rounds completed</span>
            </div>
            <div className="end-buttons">
              <button className="end-btn end-btn-roll" onClick={onBackToSettings}>Play Again</button>
              <button className="end-btn end-btn-secondary" onClick={onExit}>End Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Beat