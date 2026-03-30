import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
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
  {
    to: '/journal',
    label: 'My Journal',
    desc: 'Browse and manage your stash',
  },
  {
    to: '/recommend',
    label: 'Get AI Advice',
    desc: 'Personalised strain recommendation',
  },
  {
    to: '/sessions',
    label: 'Sessions',
    desc: 'Log and review your usage',
  },
  {
    to: '/guide',
    label: 'Guides',
    desc: 'Temperature, AVB, calm down, law',
  },
]

function Home() {
  const navigate = useNavigate()
  const { strains } = useStash()
  const inStock = strains.filter((s) => s.inStock).length

  const cards = HUB_CARDS.map((c) =>
    c.to === '/journal'
      ? { ...c, desc: `${inStock} strain${inStock !== 1 ? 's' : ''} in stash` }
      : c
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hub header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '20px 16px 0',
      }}>
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.18em',
          margin: 0,
          color: 'var(--text)',
          textTransform: 'uppercase',
        }}>
          Canopy
        </h1>
        <button
          onClick={() => navigate('/settings')}
          style={{
            position: 'absolute',
            right: 8,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            minHeight: 44,
            minWidth: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={20} strokeWidth={1.75} />
        </button>
      </div>

      {/* Hub cards */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '28px 16px 32px',
      }}>
        {cards.map(({ to, label, desc }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0 20px',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: 80,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {desc}
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 12 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
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
        maxWidth: 480,
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
