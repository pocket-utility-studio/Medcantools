import { useNavigate } from 'react-router-dom'
import { Thermometer, Wind, Leaf, Scale, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const GUIDES = [
  { to: '/guide/temp',   label: 'Temperature guide', desc: 'Find your ideal vape temp',           Icon: Thermometer },
  { to: '/guide/escape', label: 'Calm down',          desc: 'Breathing, sounds, grounding',        Icon: Wind },
  { to: '/guide/avb',    label: 'AVB guide',          desc: '6 ways to use already-vaped bud',     Icon: Leaf },
  { to: '/guide/law',    label: 'Law guide',          desc: 'UK and Spain cannabis law reference', Icon: Scale },
]

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Guides" onBack={() => navigate('/')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GUIDES.map(({ to, label, desc, Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-sm)',
              padding: '0 16px',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              minHeight: 68,
              gap: 14,
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: '2px solid var(--border)',
              background: 'var(--accent-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={17} color="var(--accent)" strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            <ChevronRight size={15} color="var(--text-muted)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
