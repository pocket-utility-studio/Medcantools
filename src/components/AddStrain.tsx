import { useState, useRef } from 'react'
import { useStash } from '../context/StashContext'
import { lookupStrainData, parseStrainFromImage } from '../services/ai'

interface Props {
  onClose: () => void
}

export default function AddStrain({ onClose }: Props) {
  const { addStrain } = useStash()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [thc, setThc] = useState('')
  const [cbd, setCbd] = useState('')
  const [type, setType] = useState<'sativa' | 'indica' | 'hybrid' | ''>('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [inStock, setInStock] = useState(true)
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>()

  const [lookingUp, setLookingUp] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  async function handleLookup() {
    if (!name.trim()) return
    setLookingUp(true)
    setError('')
    try {
      const data = await lookupStrainData(name.trim())
      if (data.thc != null) setThc(String(data.thc))
      if (data.cbd != null) setCbd(String(data.cbd))
      if (data.type) setType(data.type)
    } catch {
      setError('Lookup failed. Check your API key.')
    } finally {
      setLookingUp(false)
    }
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setImageDataUrl(dataUrl)

      const base64 = dataUrl.split(',')[1]
      const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

      try {
        const data = await parseStrainFromImage(base64, mimeType)
        if (data.name)  setName(data.name)
        if (data.thc != null) setThc(String(data.thc))
        if (data.cbd != null) setCbd(String(data.cbd))
        if (data.type)  setType(data.type)
        if (data.amount) setAmount(data.amount)
      } catch {
        setError('Scan failed. Try a clearer photo or enter details manually.')
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (!name.trim()) return
    addStrain({
      name: name.trim(),
      thc: thc ? parseFloat(thc) : undefined,
      cbd: cbd ? parseFloat(cbd) : undefined,
      type: type || undefined,
      amount: amount || undefined,
      notes: notes || undefined,
      inStock,
      imageDataUrl,
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    fontSize: 15,
    padding: '12px',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 6,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', padding: 0, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center' }}>
          &larr;
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Add Strain</h2>
      </div>

      {/* Scan photo */}
      <div style={{ marginBottom: 20 }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleScan} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: 8,
            color: scanning ? 'var(--text-dim)' : 'var(--text-muted)',
            fontSize: 14,
            padding: '18px',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {scanning ? 'Scanning...' : imageDataUrl ? 'Retake photo' : 'Scan label (optional)'}
        </button>
        {imageDataUrl && !scanning && (
          <img src={imageDataUrl} alt="" style={{ width: '100%', borderRadius: 6, marginTop: 8, maxHeight: 160, objectFit: 'cover' }} />
        )}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#e05555', marginBottom: 16 }}>{error}</p>
      )}

      {/* Name + lookup */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Strain name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Blue Dream"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleLookup}
            disabled={lookingUp || !name.trim()}
            style={{
              background: 'var(--accent-dim)',
              border: 'none',
              borderRadius: 6,
              color: 'var(--text)',
              fontSize: 13,
              padding: '0 14px',
              cursor: 'pointer',
              minHeight: 44,
              whiteSpace: 'nowrap',
              opacity: !name.trim() ? 0.4 : 1,
            }}
          >
            {lookingUp ? '...' : 'Look up'}
          </button>
        </div>
      </div>

      {/* THC / CBD */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>THC %</label>
          <input type="number" value={thc} onChange={(e) => setThc(e.target.value)} placeholder="e.g. 20" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>CBD %</label>
          <input type="number" value={cbd} onChange={(e) => setCbd(e.target.value)} placeholder="e.g. 0.5" style={inputStyle} />
        </div>
      </div>

      {/* Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['sativa', 'indica', 'hybrid'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(type === t ? '' : t)}
              style={{
                flex: 1,
                background: type === t ? 'var(--accent-dim)' : 'var(--surface)',
                border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6,
                color: type === t ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                minHeight: 44,
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Amount</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3.5g" style={inputStyle} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Flavour? Effects?"
          rows={3}
          style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {/* In stock toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <label style={{ ...labelStyle, margin: 0 }}>In stock</label>
        <button
          onClick={() => setInStock(!inStock)}
          style={{
            width: 48,
            height: 28,
            borderRadius: 14,
            border: 'none',
            background: inStock ? 'var(--accent)' : 'var(--border)',
            cursor: 'pointer',
            position: 'relative',
            minHeight: 'unset',
            minWidth: 'unset',
          }}
        >
          <span style={{
            position: 'absolute',
            top: 3,
            left: inStock ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s',
          }} />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!name.trim()}
        style={{
          width: '100%',
          background: name.trim() ? 'var(--accent)' : 'var(--border)',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          minHeight: 52,
          cursor: name.trim() ? 'pointer' : 'default',
        }}
      >
        Save
      </button>
    </div>
  )
}
