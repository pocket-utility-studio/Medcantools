import { useState } from 'react'
import { Sparkles, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStash, type StrainEntry } from '../context/StashContext'
import { lookupStrainData } from '../services/ai'
import PageHeader from './PageHeader'

interface Props {
  strain: StrainEntry
  onClose: () => void
}

const TYPE_COLOR: Record<string, string> = {
  sativa: '#6aaa40',
  indica: '#7060c0',
  hybrid: '#c08030',
}

function getSessionCount(strainName: string): number {
  try {
    const sessions = JSON.parse(localStorage.getItem('dailygrind_sessions') || '[]')
    return sessions.filter((s: { strainName: string }) =>
      s.strainName.toLowerCase() === strainName.toLowerCase()
    ).length
  } catch { return 0 }
}

export default function StrainDetail({ strain, onClose }: Props) {
  const navigate = useNavigate()
  const { updateStrain, deleteStrain } = useStash()
  const sessionCount = getSessionCount(strain.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enriched, setEnriched] = useState(false)
  const [enrichError, setEnrichError] = useState('')

  async function handleEnrich() {
    setEnriching(true)
    setEnrichError('')
    try {
      const data = await lookupStrainData(strain.name)
      const updates: Partial<StrainEntry> = {}
      if (data.thc != null   && strain.thc      == null) updates.thc      = data.thc
      if (data.cbd != null   && strain.cbd      == null) updates.cbd      = data.cbd
      if (data.type          && !strain.type)            updates.type      = data.type
      if (data.terpenes      && !strain.terpenes)        updates.terpenes  = data.terpenes
      if (data.effects       && !strain.effects)         updates.effects   = data.effects
      if (Object.keys(updates).length > 0) updateStrain(strain.id, updates)
      setEnriched(true)
    } catch {
      setEnrichError('Lookup failed. Check your API key in Settings.')
    } finally {
      setEnriching(false)
    }
  }

  function handleDelete() {
    deleteStrain(strain.id)
    onClose()
  }

  function toggleStock() {
    updateStrain(strain.id, { inStock: !strain.inStock })
  }

  const typeColor = strain.type ? TYPE_COLOR[strain.type] : 'var(--border)'

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title={strain.name} onBack={onClose} />

      {/* Type badge */}
      {strain.type && (
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: typeColor,
            border: `2px solid ${typeColor}`,
            borderRadius: 20,
            padding: '3px 12px',
          }}>
            {strain.type}
          </span>
        </div>
      )}

      {/* Scan image */}
      {strain.imageDataUrl && (
        <img
          src={strain.imageDataUrl}
          alt=""
          style={{
            width: '100%', borderRadius: 12, marginBottom: 16,
            maxHeight: 180, objectFit: 'cover',
            border: '2px solid var(--border)',
          }}
        />
      )}

      {/* Stats card */}
      <div style={{
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow)',
        marginBottom: 12,
        overflow: 'hidden',
      }}>
        {[
          strain.thc != null   && { label: 'THC',      value: `${strain.thc}%` },
          strain.cbd != null   && { label: 'CBD',      value: `${strain.cbd}%` },
          strain.amount        && { label: 'Amount',   value: strain.amount },
          strain.terpenes      && { label: 'Terpenes', value: strain.terpenes },
          strain.effects       && { label: 'Effects',  value: strain.effects },
        ].filter(Boolean).map((row, i, arr) => {
          const { label, value } = row as { label: string; value: string }
          return (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '13px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                {label}
              </span>
              <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
                {value}
              </span>
            </div>
          )
        })}

        {/* In stock toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '13px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            In stock
          </span>
          <button
            onClick={toggleStock}
            style={{
              width: 48, height: 28, borderRadius: 14, border: 'none',
              background: strain.inStock ? 'var(--accent)' : 'var(--text-dim)',
              cursor: 'pointer', position: 'relative',
              minHeight: 'unset', minWidth: 'unset',
              transition: 'background 0.15s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: strain.inStock ? 23 : 3,
              width: 22, height: 22, borderRadius: '50%',
              background: '#fff', transition: 'left 0.15s',
            }} />
          </button>
        </div>
      </div>

      {/* Session history link */}
      <button
        onClick={() => navigate(`/sessions/strain?strain=${encodeURIComponent(strain.name)}`)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)', border: '2px solid var(--border)',
          borderRadius: 10, boxShadow: 'var(--shadow-sm)',
          color: 'var(--text)', fontSize: 14, fontWeight: 600,
          minHeight: 48, cursor: 'pointer', padding: '0 16px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={15} color="var(--icon-notes)" strokeWidth={2} />
          Field notes
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
          {sessionCount === 0 ? 'No sessions yet' : `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`}
        </span>
      </button>

      {/* AI enrich */}
      {enrichError && (
        <p style={{ fontSize: 12, color: '#e05555', margin: '0 0 10px' }}>{enrichError}</p>
      )}
      <button
        onClick={handleEnrich}
        disabled={enriching || enriched}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: enriched ? 'var(--accent-dim)' : 'var(--surface)',
          border: `2px solid ${enriched ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 10,
          boxShadow: enriched ? 'none' : 'var(--shadow-sm)',
          color: enriched ? 'var(--accent)' : 'var(--text)',
          fontSize: 14,
          fontWeight: 600,
          minHeight: 48,
          cursor: enriching || enriched ? 'default' : 'pointer',
          marginBottom: 12,
        }}
      >
        <Sparkles size={15} strokeWidth={2} />
        {enriching ? 'Looking up…' : enriched ? 'Info filled in ✓' : 'Fill missing info with AI'}
      </button>

      {/* Notes */}
      {strain.notes && (
        <div style={{
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-sm)',
          padding: 16,
          marginBottom: 12,
        }}>
          <p style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 16, fontWeight: 700,
            color: 'var(--text-muted)', margin: '0 0 6px',
          }}>Notes</p>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
            {strain.notes}
          </p>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', margin: '0 0 24px' }}>
        Added {new Date(strain.dateAdded).toLocaleDateString('en-GB')}
      </p>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 600,
            minHeight: 50,
            cursor: 'pointer',
          }}
        >
          Delete strain
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{
              flex: 1, background: 'var(--surface)',
              border: '2px solid var(--border)', borderRadius: 10,
              color: 'var(--text-muted)', fontSize: 14, minHeight: 50, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            style={{
              flex: 1, background: '#e05555',
              border: '2px solid #c03333',
              boxShadow: '3px 3px 0 #c03333',
              borderRadius: 10, color: '#fff',
              fontSize: 14, fontWeight: 700, minHeight: 50, cursor: 'pointer',
            }}
          >
            Confirm delete
          </button>
        </div>
      )}
    </div>
  )
}
