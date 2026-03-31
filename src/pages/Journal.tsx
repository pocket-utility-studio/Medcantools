import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useStash, type StrainEntry } from '../context/StashContext'
import AddStrain from '../components/AddStrain'
import StrainDetail from '../components/StrainDetail'
import StrainSearch from '../components/StrainSearch'
import PageHeader from '../components/PageHeader'
import BudSprite from '../components/BudSprite'

export default function Journal() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { strains, loading } = useStash()
  const [adding, setAdding] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<StrainEntry | null>(null)

  useEffect(() => {
    if (searchParams.get('add') === '1') setAdding(true)
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: 16 }}>Loading...</p>

  if (adding) return <AddStrain onClose={() => setAdding(false)} />
  if (searching) return <StrainSearch onClose={() => setSearching(false)} />
  if (selected) return <StrainDetail strain={selected} onClose={() => setSelected(null)} />

  const inStock = strains.filter((s) => s.inStock)
  const archived = strains.filter((s) => !s.inStock)

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader
        title="The Stashbox"
        onBack={() => navigate('/')}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSearching(true)}
              title="Search strains with AI"
              style={{
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '2px solid var(--border)',
                borderRadius: 8,
                width: 44,
                height: 44,
                minHeight: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Search size={17} strokeWidth={2} />
            </button>
            <button
              onClick={() => setAdding(true)}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                width: 44,
                height: 44,
                minHeight: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        }
      />

      {strains.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>No strains yet. Add your first one.</p>
      )}

      {inStock.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            In stock
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inStock.map((s) => <StrainRow key={s.id} strain={s} onTap={() => setSelected(s)} />)}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Archived
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {archived.map((s) => <StrainRow key={s.id} strain={s} onTap={() => setSelected(s)} />)}
          </div>
        </section>
      )}
    </div>
  )
}

const TYPE_COLOR: Record<string, string> = {
  sativa: '#6aaa40',
  indica: '#7060c0',
  hybrid: '#c08030',
}

function StrainRow({ strain, onTap }: { strain: StrainEntry; onTap: () => void }) {
  const accentColor = strain.type ? TYPE_COLOR[strain.type] : 'var(--border)'

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 10,
        boxShadow: 'var(--shadow-sm)',
        padding: '14px 16px',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 62,
      }}
    >
      <BudSprite
        name={strain.name}
        type={strain.type}
        contextText={[strain.effects, strain.terpenes, strain.notes].filter(Boolean).join(' ')}
        size={36}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          {strain.name}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {strain.type && (
            <span style={{
              fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase',
              color: accentColor, fontWeight: 600,
            }}>
              {strain.type}
            </span>
          )}
          {strain.thc != null && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>THC {strain.thc}%</span>
          )}
          {strain.cbd != null && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CBD {strain.cbd}%</span>
          )}
        </div>
      </div>
      {strain.notes && (
        <div style={{
          fontSize: 12, color: 'var(--text-dim)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '35%', flexShrink: 0,
        }}>
          {strain.notes}
        </div>
      )}
    </button>
  )
}
