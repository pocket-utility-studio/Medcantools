import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import legendaryStrains from '../data/legendaryStrains'
import BudSprite from '../components/BudSprite'

const ERA_COLOR: Record<string, string> = {
  'The Ancestors':  '#b06020',
  'The Foundation': '#3b7651',
  'The Modern Era': '#7060c0',
}

const TYPE_COLOR: Record<string, string> = {
  Sativa: '#6aaa40',
  Indica: '#7060c0',
  Hybrid: '#c08030',
}

export default function FamousStrains() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = query.trim()
    ? legendaryStrains.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.era.toLowerCase().includes(query.toLowerCase()) ||
        s.type.toLowerCase().includes(query.toLowerCase())
      )
    : legendaryStrains

  const eras = [...new Set(filtered.map(s => s.era))]

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Famous Strains" onBack={() => navigate('/guide')} />

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
        {legendaryStrains.length} iconic strains — from ancient landraces to modern classics.
      </p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={14} strokeWidth={2} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search strains…"
          style={{
            width: '100%', background: 'var(--surface)',
            border: '2px solid var(--border)', borderRadius: 10,
            color: 'var(--text)', fontSize: 14,
            padding: '11px 14px 11px 34px', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {filtered.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No strains match "{query}".</p>
      )}

      {eras.map(era => (
        <section key={era} style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: ERA_COLOR[era] ?? 'var(--text-muted)',
            marginBottom: 10, paddingBottom: 6,
            borderBottom: `2px solid ${ERA_COLOR[era] ?? 'var(--border)'}`,
          }}>
            {era}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.filter(s => s.era === era).map(strain => {
              const expanded = expandedId === strain.id
              return (
                <div key={strain.id} style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : strain.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 12, padding: '12px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      minHeight: 52, textAlign: 'left',
                    }}
                  >
                    <BudSprite name={strain.name} type={strain.type.toLowerCase()} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{strain.name}</div>
                      <div style={{ fontSize: 11, color: TYPE_COLOR[strain.type] ?? 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {strain.type}
                      </div>
                    </div>
                    {expanded
                      ? <ChevronUp size={15} color="var(--text-dim)" strokeWidth={2} style={{ flexShrink: 0 }} />
                      : <ChevronDown size={15} color="var(--text-dim)" strokeWidth={2} style={{ flexShrink: 0 }} />
                    }
                  </button>
                  {expanded && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: '12px 0 0' }}>
                        {strain.lore}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
