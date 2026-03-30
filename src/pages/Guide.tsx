import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const GUIDES = [
  { to: '/guide/temp',    label: 'Temperature guide',  desc: 'Find your ideal vape temp and what it does' },
  { to: '/guide/escape',  label: 'Calm down',           desc: 'Breathing exercises, sounds, and techniques' },
  { to: '/guide/avb',     label: 'AVB guide',           desc: '6 ways to use already-vaped bud' },
  { to: '/guide/law',     label: 'Law guide',           desc: 'UK and Spain cannabis law reference' },
]

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Guides" onBack={() => navigate('/')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GUIDES.map(({ to, label, desc }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: 64,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 12 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
