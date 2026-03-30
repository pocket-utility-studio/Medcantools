import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Journal from './pages/Journal'
import Recommender from './pages/Recommender'
import Guide from './pages/Guide'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 80px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/recommend" element={<Recommender />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          height: 60,
        }}>
          {[
            { to: '/', label: 'Home' },
            { to: '/journal', label: 'Journal' },
            { to: '/recommend', label: 'Advise' },
            { to: '/guide', label: 'Guide' },
            { to: '/settings', label: 'Settings' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400,
                minHeight: 44,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </BrowserRouter>
  )
}
