import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Settings, BookOpen, Sparkles, ClipboardList, Compass, ChevronRight, Moon, Sun } from 'lucide-react'
import { useStash } from './context/StashContext'
import Onboarding from './components/Onboarding'
import QuickLog from './components/QuickLog'
import Journal from './pages/Journal'
import Recommender from './pages/Recommender'
import SessionLog from './pages/SessionLog'
import Guide from './pages/Guide'
import TempGuide from './pages/TempGuide'
import EscapeRope from './pages/EscapeRope'
import AVBGuide from './pages/AVBGuide'
import LawGuide from './pages/LawGuide'
import SettingsPage from './pages/Settings'

// ── Dark mode ──────────────────────────────────────────────────────────────────

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(() => localStorage.getItem('dg_theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('dg_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Apply on first render too
  useEffect(() => {
    const saved = localStorage.getItem('dg_theme')
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  return [dark, () => setDark(d => !d)]
}

// ── Per-section icon config ────────────────────────────────────────────────────

const CARD_CONFIG: Record<string, { iconColor: string; iconBg: string }> = {
  '/journal':   { iconColor: 'var(--icon-stash)',  iconBg: 'var(--icon-stash-bg)'  },
  '/recommend': { iconColor: 'var(--icon-ai)',      iconBg: 'var(--icon-ai-bg)'     },
  '/sessions':  { iconColor: 'var(--icon-notes)',   iconBg: 'var(--icon-notes-bg)'  },
  '/guide':     { iconColor: 'var(--icon-guide)',   iconBg: 'var(--icon-guide-bg)'  },
}

const DEFAULT_ORDER = ['/journal', '/recommend', '/sessions', '/guide']

export function loadCardOrder(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem('dg_card_order') || 'null')
    if (Array.isArray(saved) && saved.length === DEFAULT_ORDER.length) return saved
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

// ── Ripple helper ──────────────────────────────────────────────────────────────

function fireRipple(e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0]?.clientX ?? rect.left : e.clientX
  const clientY = 'touches' in e ? e.touches[0]?.clientY ?? rect.top  : e.clientY
  const wave = document.createElement('span')
  wave.className = 'ripple-wave'
  wave.style.left = `${clientX - rect.left}px`
  wave.style.top  = `${clientY - rect.top}px`
  el.appendChild(wave)
  setTimeout(() => wave.remove(), 600)
}

// ── Home ───────────────────────────────────────────────────────────────────────

function Home() {
  const navigate = useNavigate()
  const { strains } = useStash()
  const [dark, toggleDark] = useDarkMode()
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('dg_onboarded'))
  const [cardOrder] = useState(loadCardOrder)

  // Stashbox data
  const inStock = strains.filter(s => s.inStock)
  const inStockCount = inStock.length
  const totalWeight = inStock.reduce((sum, s) => {
    const match = s.amount?.match(/[\d.]+/)
    return sum + (match ? parseFloat(match[0]) : 0)
  }, 0)
  const lastUpdated = (() => {
    if (strains.length === 0) return null
    const latest = strains.reduce((a, b) => a.dateAdded > b.dateAdded ? a : b)
    return new Date(latest.dateAdded).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  })()

  // Field Notes data
  const lastLogged = (() => {
    try {
      const sessions: Array<{ date: string }> = JSON.parse(localStorage.getItem('dailygrind_sessions') || '[]')
      if (sessions.length > 0) {
        const last = sessions.sort((a, b) => b.date.localeCompare(a.date))[0]
        return new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      }
    } catch { /* ignore */ }
    return null
  })()

  // Cyber-Botanist last query
  const lastQuery = localStorage.getItem('dg_last_query')

  // Card descriptors
  const stashDesc = inStockCount === 0
    ? 'Nothing in the stash yet'
    : `${inStockCount} strain${inStockCount !== 1 ? 's' : ''}${totalWeight > 0 ? ` · ${totalWeight}g` : ''}${lastUpdated ? ` · updated ${lastUpdated}` : ''}`

  const allCards = [
    {
      to: '/journal',
      label: 'The Stashbox',
      desc: stashDesc,
      Icon: BookOpen,
      longPressAction: () => navigate('/journal?add=1'),
    },
    {
      to: '/recommend',
      label: 'Ask the Cyber-Botanist',
      desc: lastQuery ? `Last: "${lastQuery}"` : 'Algorithmic strain matchmaking',
      Icon: Sparkles,
    },
    {
      to: '/sessions',
      label: 'Field Notes',
      desc: lastLogged ? `Last logged ${lastLogged}` : 'Sketch out your daily doses',
      Icon: ClipboardList,
    },
    {
      to: '/guide',
      label: 'Cheat Sheets',
      desc: 'Temps, tips, and the fine print',
      Icon: Compass,
    },
  ]

  const cards = cardOrder.map(to => allCards.find(c => c.to === to)!).filter(Boolean)

  function startLongPress(action?: () => void) {
    if (!action) return
    longPressRef.current = setTimeout(() => action(), 600)
  }

  function cancelLongPress() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {showOnboarding && (
        <Onboarding onDone={() => {
          localStorage.setItem('dg_onboarded', '1')
          setShowOnboarding(false)
        }} />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '36px 16px 0' }}>
        <h1 style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 'clamp(28px, 9vw, 42px)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          margin: '0 0 6px',
          color: 'var(--text)',
          lineHeight: 1.1,
        }}>
          Daily Grind
        </h1>
        <svg
          viewBox="0 0 52 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', margin: '0 auto', width: 'clamp(42px, 12vw, 60px)', height: 'auto' }}
        >
          <path
            d="M1 5 C6 2.5, 13 6, 21 3.5 C29 1, 37 5.5, 44 3 C47 2, 50 3.5, 51 4"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Cards */}
      <div
        className="hub-cards-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '28px 16px 16px',
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {cards.map(({ to, label, desc, Icon, longPressAction }) => {
          const cfg = CARD_CONFIG[to]
          return (
            <button
              key={to}
              onClick={(e) => { fireRipple(e); navigate(to) }}
              onMouseDown={() => startLongPress(longPressAction)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={(e) => { startLongPress(longPressAction) }}
              onTouchEnd={cancelLongPress}
              className="hub-card ripple-container home-animate"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                border: '2px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow)',
                padding: '14px 16px',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                minHeight: 'unset',
                gap: 14,
              }}
            >
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                border: `2px solid ${cfg.iconColor}`,
                background: cfg.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={19} color={cfg.iconColor} strokeWidth={2} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginBottom: 3,
                  letterSpacing: '0.01em',
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {desc}
                </div>
              </div>

              <ChevronRight
                size={16}
                color="var(--text-dim)"
                strokeWidth={2.5}
                className="hub-chevron"
                style={{ flexShrink: 0 }}
              />
            </button>
          )
        })}
      </div>

      {/* Quick Log */}
      <div style={{ padding: '0 16px 16px', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <QuickLog />
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '16px 0 28px',
        marginTop: 'auto',
      }}>
        <button
          onClick={toggleDark}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '50%',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            minHeight: 'unset',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {dark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>

        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          v{__APP_VERSION__}
        </span>

        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '50%',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            minHeight: 'unset',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

// ── App shell ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter basename="/Medcantools">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg)',
        maxWidth: 640,
        margin: '0 auto',
      }}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/journal"      element={<Journal />} />
          <Route path="/recommend"    element={<Recommender />} />
          <Route path="/sessions"     element={<SessionLog />} />
          <Route path="/guide"        element={<Guide />} />
          <Route path="/guide/temp"   element={<TempGuide />} />
          <Route path="/guide/escape" element={<EscapeRope />} />
          <Route path="/guide/avb"    element={<AVBGuide />} />
          <Route path="/guide/law"    element={<LawGuide />} />
          <Route path="/settings"     element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
