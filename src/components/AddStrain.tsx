import { useState, useRef } from 'react'
import { Camera, Search, Check, X } from 'lucide-react'
import { useStash } from '../context/StashContext'
import { lookupStrainData, parseStrainFromImage } from '../services/ai'
import PageHeader from './PageHeader'

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
  const [scanDone, setScanDone] = useState(false)
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
      setError('Lookup failed. Check your API key in Settings.')
    } finally {
      setLookingUp(false)
    }
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setScanDone(false)
    setError('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setImageDataUrl(dataUrl)

      const base64 = dataUrl.split(',')[1]
      const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

      try {
        const data = await parseStrainFromImage(base64, mimeType)
        if (data.name)        setName(data.name)
        if (data.thc != null) setThc(String(data.thc))
        if (data.cbd != null) setCbd(String(data.cbd))
        if (data.type)        setType(data.type)
        if (data.amount)      setAmount(data.amount)
        setScanDone(true)
      } catch {
        setError('Could not read the label. Try a clearer photo or enter details manually.')
        setImageDataUrl(undefined)
      } finally {
        setScanning(false)
        // Reset file input so same file can be re-scanned
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageDataUrl(undefined)
    setScanDone(false)
    if (fileRef.current) fileRef.current.value = ''
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
    borderRadius: 10,
    color: 'var(--text)',
    fontSize: 15,
    padding: '13px 14px',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 8,
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Add Strain" onBack={onClose} />

      {/* Camera scan — hero action */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleScan}
        style={{ display: 'none' }}
      />

      {!imageDataUrl ? (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: `1px dashed ${scanning ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 14,
            color: scanning ? 'var(--accent)' : 'var(--text-muted)',
            cursor: scanning ? 'default' : 'pointer',
            minHeight: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {scanning ? (
            <>
              <ScanSpinner />
              <span style={{ fontSize: 13 }}>Reading label…</span>
            </>
          ) : (
            <>
              <Camera size={28} strokeWidth={1.5} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Scan product label</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>AI reads THC, CBD and strain name</span>
            </>
          )}
        </button>
      ) : (
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src={imageDataUrl}
            alt=""
            style={{ width: '100%', borderRadius: 12, maxHeight: 180, objectFit: 'cover', display: 'block' }}
          />
          {scanDone && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'var(--accent)', borderRadius: 20,
              padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Check size={12} strokeWidth={3} color="#fff" />
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Filled from label</span>
            </div>
          )}
          <button
            onClick={clearImage}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, minHeight: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} strokeWidth={2.5} color="#fff" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(224, 85, 85, 0.08)', border: '1px solid rgba(224, 85, 85, 0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, color: '#e05555', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Name + AI lookup */}
      <div style={{ marginBottom: 14 }}>
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
            title="AI auto-fill from name"
            style={{
              background: name.trim() && !lookingUp ? 'var(--accent-dim)' : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: name.trim() ? 'var(--text)' : 'var(--text-dim)',
              fontSize: 13,
              padding: '0 14px',
              cursor: name.trim() ? 'pointer' : 'default',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Search size={14} strokeWidth={2} />
            {lookingUp ? '…' : 'Look up'}
          </button>
        </div>
      </div>

      {/* THC / CBD */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
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
      <div style={{ marginBottom: 14 }}>
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
                borderRadius: 10,
                color: type === t ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: type === t ? 600 : 400,
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
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Amount</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3.5g" style={inputStyle} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Flavour, effects, observations…"
          rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
        />
      </div>

      {/* In stock toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 24,
      }}>
        <span style={{ fontSize: 14, color: 'var(--text)' }}>In stock</span>
        <button
          onClick={() => setInStock(!inStock)}
          style={{
            width: 48, height: 28, borderRadius: 14, border: 'none',
            background: inStock ? 'var(--accent)' : 'var(--border)',
            cursor: 'pointer', position: 'relative',
            minHeight: 'unset', minWidth: 'unset',
            transition: 'background 0.15s',
          }}
        >
          <span style={{
            position: 'absolute', top: 3,
            left: inStock ? 23 : 3,
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff', transition: 'left 0.15s',
          }} />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!name.trim()}
        style={{
          width: '100%',
          background: name.trim() ? 'var(--accent)' : 'var(--border)',
          border: 'none', borderRadius: 12, color: '#fff',
          fontSize: 15, fontWeight: 600, minHeight: 54,
          cursor: name.trim() ? 'pointer' : 'default',
        }}
      >
        Save strain
      </button>
    </div>
  )
}

function ScanSpinner() {
  return (
    <div style={{ position: 'relative', width: 32, height: 32 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}
