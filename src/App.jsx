import { useState, useEffect } from 'react'
import Home from './components/Home'
import Prelaunch from './components/Prelaunch'
import LoadingModal from './components/LoadingModal'
import Flash from './components/Flash'
import Reveal from './components/Reveal'
import Target from './components/Target'
import Vanish from './components/Vanish'
import Roll from './components/Roll'
import Flip from './components/Flip'
import Spell from './components/Spell'
import Call from './components/Call'
import Beat from './components/Beat'
import Bet from './components/Bet'
import LuckyDraw from './components/LuckyDraw'
import { fetchDeckCards } from './lib/api'
import { getSession, getProfile, onAuthStateChange } from './lib/auth'
import { installSound, sound } from './lib/sound'

function App() {
  const [screen, setScreen] = useState('home')
  const [pending, setPending] = useState(null)
  const [S, setS] = useState({
    selectedDecks: [],
    cards: [],
    mode: null,
    cardOrder: 'sequential',
    showImage: true,
    showWord: true,
    previewGrid: false,
    revealContent: 'image',
    revealGrid: '4x4',
    revealSpeed: 1,
    targetWords: [],
    vanishRounds: 1,
    vanishShowText: true,
    rollTeams: 2,
    rollGrid: '4x4',
    flipTeams: 2,
    flipShowText: true,
    flipQuestion: '',
    flipAnswer: '',
    disabledCardIds: [],
    spellWordCount: 8,
    spellTotalTime: 90,
    spellLetterBonus: 5,
    spellLetterCase: 'upper',
    spellLastResult: null,
    beatWords: 8,
    beatSpeed: 'normal',
    beatShowText: true,
    callMode: 'bingo',
    revealMode: 'tiles',        // 'tiles' | 'flashlight' | 'pixelate'
    revealLightSize: 2,         // 1-3
    revealLightShape: 'circle', // circle | star | square | triangle
    betTeams: 3,
    betChoices: 8,
    betShowText: true,
  })

  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Sound: unlock audio on first tap + automatic UI click sounds
  useEffect(() => installSound(), [])

  // Menu music: plays on Home + Prelaunch, fades out for loading and games
  useEffect(() => {
    if (screen === 'home' || screen === 'prelaunch') sound.startLoop('lofi')
    else sound.stopLoop('lofi')
  }, [screen])

  useEffect(() => {
    getSession().then(s => {
      setSession(s)
      setAuthLoading(false)
    })

    const subscription = onAuthStateChange(s => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user.id).then(setProfile).catch(() => setProfile(null))
    } else {
      setProfile(null)
    }
  }, [session])

  function updateS(patch) {
    setS(prev => ({ ...prev, ...patch }))
  }

  function toggleDeck(deck) {
    setS(prev => ({
      ...prev,
      selectedDecks: prev.selectedDecks.some(d => d.id === deck.id)
        ? prev.selectedDecks.filter(d => d.id !== deck.id)
        : [...prev.selectedDecks, deck]
    }))
  }

  async function handleLaunch(mode, decks) {
    const cards = await fetchDeckCards(decks.map(d => d.id))
    updateS({ selectedDecks: decks, cards, mode })
    setScreen('prelaunch')
  }

  function handleBackHome() {
    setScreen('home')
  }

  function handleLaunchGame(mode, cards) {
    setPending({ mode, cards })
    setScreen('loading')
  }

  function handleLoadingDone() {
    setScreen(pending.mode)
  }

  function handleBackToSettings() {
    setScreen('prelaunch')
  }

  if (screen === 'loading') {
    return <LoadingModal cards={pending.cards} mode={pending.mode} onDone={handleLoadingDone} />
  }

  if (screen === 'flash') {
    return <Flash S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'reveal') {
    return <Reveal S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'target') {
    return <Target S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'vanish') {
    return <Vanish S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'roll') {
    return <Roll S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'flip') {
    return <Flip S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'spell') {
    return <Spell S={S} updateS={updateS} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'call') {
    const CallScreen = S.callMode === 'lucky' ? LuckyDraw : Call
    return <CallScreen S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'beat') {
    return <Beat S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'bet') {
    return <Bet S={S} cards={pending.cards} onBackToSettings={handleBackToSettings} onExit={handleBackHome} />
  }

  if (screen === 'prelaunch') {
    return <Prelaunch S={S} updateS={updateS} onBack={handleBackHome} onLaunch={handleLaunchGame} />
  }

  return (
    <Home
      selectedDecks={S.selectedDecks}
      onToggleDeck={toggleDeck}
      onClearDecks={() => updateS({ selectedDecks: [] })}
      onLaunch={handleLaunch}
    />
  )
}

export default App