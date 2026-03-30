import { useState } from 'react'
import { useStash, type StrainEntry } from '../context/StashContext'

interface Props {
  strain: StrainEntry
  onClose: () => void
}

export default function StrainDetail({ strain, onClose }: Props) {
  const { updateStrain, deleteStrain } = useStash()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    deleteStrain(strain.id)
    onClose()
  }

  function toggleStock() {
    updateStrain(strain.id, { inStock: !strain.inStock })
  }

  const typeColor: Record<string, string> = {
    sativa: '#6aaa40',
    indica: '#7060c0',
    hybrid: '#c08030',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 15,
    color: 'var(--text)',
    fontWeight: 500,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', padding: 0, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center' }}>
          &larr;
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, flex: 1 }}>{strain.name}</h2>
        {strain.type && (
          <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: typeColor[strain.type] }}>
            {strain.type}
          </span>
        )}
      </div>

      {strain.imageDataUrl && (
        <img src={strain.imageDataUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 20, maxHeight: 180, objectFit: 'cover' }} />
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 16px', marginBottom: 20 }}>
        {strain.thc != null && (
          <div style={rowStyle}>
            <span style={labelStyle}>THC</span>
            <span style={valueStyle}>{strain.thc}%</span>
          </div>
        )}
        {strain.cbd != null && (
          <div style={rowStyle}>
            <span style={labelStyle}>CBD</span>
            <span style={valueStyle}>{strain.cbd}%</span>
          </div>
        )}
        {strain.amount && (
          <div style={rowStyle}>
            <span style={labelStyle}>Amount</span>
            <span style={valueStyle}>{strain.amount}</span>
          </div>
        )}
        {strain.terpenes && (
          <div style={rowStyle}>
            <span style={labelStyle}>Terpenes</span>
            <span style={{ ...valueStyle, fontSize: 13, textAlign: 'right', maxWidth: '60%' }}>{strain.terpenes}</span>
          </div>
        )}
        {strain.effects && (
          <div style={rowStyle}>
            <span style={labelStyle}>Effects</span>
            <span style={{ ...valueStyle, fontSize: 13, textAlign: 'right', maxWidth: '60%' }}>{strain.effects}</span>
          </div>
        )}
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={labelStyle}>In stock</span>
          <button
            onClick={toggleStock}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: strain.inStock ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer',
              position: 'relative',
              minHeight: 'unset',
              minWidth: 'unset',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: strain.inStock ? 23 : 3,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.15s',
            }} />
          </button>
        </div>
      </div>

      {strain.notes && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>Notes</p>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{strain.notes}</p>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', margin: '0 0 24px' }}>
        Added {new Date(strain.dateAdded).toLocaleDateString()}
      </p>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 14,
            minHeight: 48,
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 14, minHeight: 48, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            style={{ flex: 1, background: '#5a1a1a', border: 'none', borderRadius: 8, color: '#ffaaaa', fontSize: 14, fontWeight: 600, minHeight: 48, cursor: 'pointer' }}
          >
            Confirm delete
          </button>
        </div>
      )}
    </div>
  )
}
