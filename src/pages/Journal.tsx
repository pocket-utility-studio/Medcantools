import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStash, type StrainEntry } from '../context/StashContext'
import AddStrain from '../components/AddStrain'
import StrainDetail from '../components/StrainDetail'
import PageHeader from '../components/PageHeader'

export default function Journal() {
  const navigate = useNavigate()
  const { strains, loading } = useStash()
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<StrainEntry | null>(null)

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: 16 }}>Loading...</p>

  if (adding) return <AddStrain onClose={() => setAdding(false)} />
  if (selected) return <StrainDetail strain={selected} onClose={() => setSelected(null)} />

  const inStock = strains.filter((s) => s.inStock)
  const archived = strains.filter((s) => !s.inStock)

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader
        title="My Journal"
        onBack={() => navigate('/')}
        right={
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

function StrainRow({ strain, onTap }: { strain: StrainEntry; onTap: () => void }) {
  const typeColor: Record<string, string> = {
    sativa: '#6aaa40',
    indica: '#7060c0',
    hybrid: '#c08030',
  }
  const color = strain.type ? typeColor[strain.type] : 'var(--text-dim)'

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '14px 16px',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 44,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
          {strain.name}
        </div>
        {strain.notes && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {strain.notes}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {strain.thc != null && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{strain.thc}% THC</span>
        )}
        {strain.type && (
          <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{strain.type}</span>
        )}
      </div>
    </button>
  )
}
