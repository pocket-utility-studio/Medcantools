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
  { to: '/journal',   label: 'My Journal',    desc: '',                                   Icon: BookOpen },
  { to: '/recommend', label: 'Get AI Advice', desc: 'Personalised strain recommendation', Icon: Sparkles },
  { to: '/sessions',  label: 'Sessions',      desc: 'Log and review your usage',           Icon: ClipboardList },
  { to: '/guide',     label: 'Guides',        desc: 'Temperature, AVB, calm down, law',    Icon: Compass },
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
          <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '0 auto' }} />
        </div>

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
          <Settings size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Cards */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '28px 16px 32px',
      }}>
        {cards.map(({ to, label, desc, Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 12,
              boxShadow: 'var(--shadow)',
              padding: '0 16px',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: 72,
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
