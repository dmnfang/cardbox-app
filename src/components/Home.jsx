import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Lightning, Eye, Crosshair as TargetIcon, Ghost, DiceFive, Stack, Timer,
  CheckFat as Check, ArrowsOut, ArrowsIn, User, XCircle,
} from '@phosphor-icons/react'
import { fetchCardboxLibrary } from '../lib/api'
import logo from '../assets/logo.svg'

const MODES = [
  { id: 'flash',  label: 'Flash',  icon: Lightning,  className: 'mode-btn-flash' },
  { id: 'reveal', label: 'Reveal', icon: Eye,        className: 'mode-btn-reveal' },
  { id: 'target', label: 'Target', icon: TargetIcon, className: 'mode-btn-target' },
  { id: 'vanish', label: 'Vanish', icon: Ghost,      className: 'mode-btn-vanish' },
  { id: 'roll',   label: 'Roll',   icon: DiceFive,   className: 'mode-btn-roll' },
  { id: 'flip',   label: 'Flip',   icon: Stack,      className: 'mode-btn-flip' },
  { id: 'spell',  label: 'Spell',  icon: Timer,      className: 'mode-btn-spell' },
]

const PREVIEW_COUNT = 6

const MOCK_ACCOUNT = {
  name: 'Chris Kerr',
  email: 'chris@example.com',
  plan: 'trial', // 'trial' | 'full'
  trialDaysRemaining: 12,
  trialTotalDays: 30,
  cardBrand: 'Mastercard',
  cardLast4: '0567',
  nextChargeDate: '2026-09-07', // trial: day after trial ends · full: next billing date
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function getPreviewLabels(deck, query) {
  if (!query) return deck.labels.slice(0, PREVIEW_COUNT)
  const q = query.toLowerCase()
  const matching = deck.labels.filter(l => l.toLowerCase().includes(q))
  if (matching.length === 0) return deck.labels.slice(0, PREVIEW_COUNT)
  const rest = deck.labels.filter(l => !matching.includes(l))
  return [...matching, ...rest].slice(0, PREVIEW_COUNT)
}

function HighlightedLabel({ label, query }) {
  if (!query) return label
  const idx = label.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return label
  return (
    <>
      {label.slice(0, idx)}
      <mark className="preview-highlight">{label.slice(idx, idx + query.length)}</mark>
      {label.slice(idx + query.length)}
    </>
  )
}

function DeckPreview({ deck, query }) {
  const previewLabels = getPreviewLabels(deck, query)
  const hasMore = deck.labels.length > previewLabels.length
  return (
    <p className="deck-preview">
      {previewLabels.map((label, i) => (
        <span key={i}>
          <HighlightedLabel label={label} query={query} />
          {i < previewLabels.length - 1 ? ', ' : ''}
        </span>
      ))}
      {hasMore ? ',…' : ''}
    </p>
  )
}

function AccountDropdown({ account, onCancelPlan, onEditPayment, onLogout, onDeleteAccount }) {
  const isTrial = account.plan === 'trial'
  const trialPct = isTrial ? (account.trialDaysRemaining / account.trialTotalDays) * 100 : 0

  return (
    <div className="account-dropdown">
      <div className="account-section account-user">
        <div className="account-avatar">
          <User size={18} weight="fill" />
        </div>
        <div className="account-user-info">
          <span className="account-name">{account.name}</span>
          <span className="account-email">{account.email}</span>
        </div>
      </div>

      <div className="account-divider" />

      <div className="account-section">
        <div className="account-plan-row">
          <span className="account-plan-label">Plan</span>
          <span className={`account-plan-badge ${isTrial ? 'trial' : 'full'}`}>
            {isTrial ? 'Trial' : 'Full'}
          </span>
        </div>

        {isTrial ? (
          <>
            <div className="trial-days-row">
              <span className="trial-days-value">{account.trialDaysRemaining}</span>
              <span className="trial-days-label">days left in your trial</span>
            </div>
            <div className="usage-bar">
              <div className="usage-bar-fill" style={{ width: `${trialPct}%` }} />
            </div>
            <p className="account-billing-note">
              You'll be charged on {formatDate(account.nextChargeDate)} using {account.cardBrand} ****{account.cardLast4}.
            </p>
          </>
        ) : (
          <p className="account-billing-note">
            Next billing date: {formatDate(account.nextChargeDate)} · {account.cardBrand} ****{account.cardLast4}
          </p>
        )}
      </div>

      <div className="account-divider" />

      <div className="account-section account-plan-actions">
        <button className="account-primary-btn" onClick={onEditPayment}>Edit payment details</button>
        <button className="account-text-btn" onClick={onCancelPlan}>Cancel plan</button>
      </div>

      <div className="account-divider" />

      <div className="account-section account-footer">
        <button className="account-signout-btn" onClick={onLogout}>Sign out</button>
        <button className="account-text-btn account-text-btn-danger" onClick={onDeleteAccount}>Delete account</button>
      </div>
    </div>
  )
}

function Header({ isFullscreen, onToggleFullscreen, accountOpen, setAccountOpen, onLogout, onCancelPlan, onEditPayment, onDeleteAccount }) {
  const accountRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setAccountOpen])

  return (
    <header className="app-header">
      <div className="brand">
        <img src={logo} alt="Cardbox" className="brand-logo" />
        <span className="brand-name">Cardbox</span>
      </div>
      <div className="header-actions">
        <button className="icon-btn" onClick={onToggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <ArrowsIn size={20} weight="fill" /> : <ArrowsOut size={20} weight="fill" />}
        </button>
        <div className="account-menu" ref={accountRef}>
          <button className="icon-btn" onClick={() => setAccountOpen(o => !o)} aria-label="Account">
            <User size={20} weight="fill" />
          </button>
          {accountOpen && (
            <AccountDropdown
              account={MOCK_ACCOUNT}
              onCancelPlan={onCancelPlan}
              onEditPayment={onEditPayment}
              onLogout={onLogout}
              onDeleteAccount={onDeleteAccount}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function Home({ selectedDecks, onToggleDeck, onClearDecks, onLaunch }) {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    fetchCardboxLibrary()
      .then(setDecks)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const filteredDecks = useMemo(() => {
    if (!query) return decks
    const q = query.toLowerCase()
    return decks.filter(deck =>
      deck.name.toLowerCase().includes(q) ||
      deck.labels.some(label => label.toLowerCase().includes(q))
    )
  }, [decks, query])

  if (loading) return <div className="home-loading">Loading library…</div>
  if (error) return <div className="home-error">Couldn't load decks: {error}</div>

  return (
    <div className="app-shell">
      <div className="home-screen">
        <Header
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          accountOpen={accountOpen}
          setAccountOpen={setAccountOpen}
          onLogout={() => {/* TODO: wire to auth */}}
          onCancelPlan={() => {/* TODO: wire to billing */}}
          onEditPayment={() => {/* TODO: wire to billing */}}
          onDeleteAccount={() => {/* TODO: wire to account deletion — probably wants a confirm step */}}
        />

        <div className="panels-row">
          <div className="decks-panel">
            <div className="decks-header">
              <h1 className="panel-title">Decks</h1>
              {selectedDecks.length > 0 && (
                <div className="decks-selection">
                  <span className="decks-selection-count">
                    <strong>{selectedDecks.length}</strong>{' '}
                    {selectedDecks.length === 1 ? 'deck' : 'decks'} selected
                  </span>
                  <button className="clear-btn" onClick={onClearDecks}>Clear All</button>
                </div>
              )}
            </div>

            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search for a word or deck…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <XCircle size={16} weight="bold" />
                </button>
              )}
            </div>

            <div className="deck-grid">
              {filteredDecks.map(deck => {
                const isSelected = selectedDecks.some(d => d.id === deck.id)
                return (
                  <div
                    key={deck.id}
                    className={`deck-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggleDeck(deck)}
                  >
                    <div className="deck-card-header">
                      <span className="deck-card-title">{deck.name}</span>
                      <div className="deck-dot">
                        <Check size={14} weight="fill" />
                      </div>
                    </div>
                    <DeckPreview deck={deck} query={query} />
                    <div className="deck-chip">{deck.cardCount} cards</div>
                  </div>
                )
              })}
              {filteredDecks.length === 0 && (
                <p className="deck-grid-empty">No decks match "{query}"</p>
              )}
            </div>
          </div>

          <div className="modes-panel">
  <div className="modes-header">
    <h2 className="panel-title">Modes</h2>
  </div>
  <p className="modes-hint">Select at least 1 deck</p>
  <div className="modes-list">
              {MODES.map(mode => {
                const Icon = mode.icon
                const disabled = selectedDecks.length === 0
                return (
                  <button
                    key={mode.id}
                    className={`mode-btn ${mode.className}`}
                    disabled={disabled}
                    onClick={() => onLaunch(mode.id, selectedDecks)}
                  >
                    <Icon size={20} weight="fill" />
                    {mode.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home