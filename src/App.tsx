import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Settings, BookOpen, Sparkles, ClipboardList, Compass, ChevronRight } from 'lucide-react'
import { useStash } from './context/StashContext'
import Journal from './pages/Journal'
import Recommender from './pages/Recommender'
import SessionLog from './pages/SessionLog'
import Guide from './pages/Guide'
import TempGuide from './pages/TempGuide'
import EscapeRope from './pages/EscapeRope'
import AVBGuide from './pages/AVBGuide'
import LawGuide from './pages/LawGuide'
import SettingsPage from './pages/Settings'

const HUB_CARDS = [
  { to: '/journal',   label: 'The Stashbox',          desc: '',                                    Icon: BookOpen },
  { to: '/recommend', label: 'Ask the Cyber-Botanist', desc: 'Algorithmic strain matchmaking',     Icon: Sparkles },
  { to: '/sessions',  label: 'Field Notes',            desc: 'Sketch out your daily doses',         Icon: ClipboardList },
  { to: '/guide',     label: 'Cheat Sheets',           desc: 'Temps, tips, and the fine print',     Icon: Compass },
]

function Home() {
  const navigate = useNavigate()
  const { strains } = useStash()
  const inStock = strains.filter((s) => s.inStock).length

  const cards = HUB_CARDS.map((c) =>
    c.to === '/journal'
      ? { ...c, desc: `${inStock} strain${inStock !== 1 ? 's' : ''} currently on hand` }
      : c
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '32px 16px 0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '0.04em',
            margin: '0 0 6px',
            color: 'var(--text)',
          }}>
            Daily Grind
          </h1>
          <svg width="52" height="7" viewBox="0 0 52 7" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
              <path d="M1 5 C6 2.5, 13 6, 21 3.5 C29 1, 37 5.5, 44 3 C47 2, 50 3.5, 51 4" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>

        <button
          onClick={() => navigate('/settings')}
          style={{
            position: 'absolute',
            right: 12,
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

      {/* Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '24px 16px 32px',
        maxWidth: 600,
        width: '100%',
        margin: '0 auto',
      }}>
        {cards.map(({ to, label, desc, Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="hub-card"
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
              width: 40,
              height: 40,
              borderRadius: 8,
              border: '2px solid var(--border)',
              background: 'var(--accent-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={18} color="var(--accent)" strokeWidth={2} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {desc}
              </div>
            </div>

            <ChevronRight size={16} color="var(--text-muted)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
      <p style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--text-dim)',
        padding: '0 0 20px',
        margin: 0,
        fontFamily: 'monospace',
      }}>
        v{__APP_VERSION__}
      </p>
    </div>
  )
}

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
