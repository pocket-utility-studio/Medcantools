import { useState, useRef } from 'react'
import { Sparkles, ClipboardList, Pencil, ImagePlus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStash, type StrainEntry } from '../context/StashContext'
import { lookupStrainData, crossCheckStrainWithClaude, judgeStrainData, type CrossCheckResult, type StrainJudgment } from '../services/ai'
import legendaryStrains from '../data/legendaryStrains'
import DiamondSpinner from './DiamondSpinner'
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
  const [enrichModel, setEnrichModel] = useState('')

  const [checkResult, setCheckResult] = useState<CrossCheckResult | null>(null)
  const [checkError, setCheckError] = useState('')
  const [judgment, setJudgment] = useState<StrainJudgment | null>(null)
  const hasClaudeKey = !!localStorage.getItem('claude_api_key')

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(strain.name)
  const [editThc, setEditThc] = useState(strain.thc != null ? String(strain.thc) : '')
  const [editCbd, setEditCbd] = useState(strain.cbd != null ? String(strain.cbd) : '')
  const [editType, setEditType] = useState<'sativa' | 'indica' | 'hybrid' | ''>(strain.type ?? '')
  const [editTerpenes, setEditTerpenes] = useState(strain.terpenes ?? '')
  const [editEffects, setEditEffects] = useState(strain.effects ?? '')
  const [editAmount, setEditAmount] = useState(strain.amount ?? '')
  const [editNotes, setEditNotes] = useState(strain.notes ?? '')
  const [editImageDataUrl, setEditImageDataUrl] = useState<string | undefined>(strain.imageDataUrl)
  const [editBudImageDataUrl, setEditBudImageDataUrl] = useState<string | undefined>(strain.budImageDataUrl)
  const packagingFileRef = useRef<HTMLInputElement>(null)
  const budFileRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditName(strain.name)
    setEditThc(strain.thc != null ? String(strain.thc) : '')
    setEditCbd(strain.cbd != null ? String(strain.cbd) : '')
    setEditType(strain.type ?? '')
    setEditTerpenes(strain.terpenes ?? '')
    setEditEffects(strain.effects ?? '')
    setEditAmount(strain.amount ?? '')
    setEditNotes(strain.notes ?? '')
    setEditImageDataUrl(strain.imageDataUrl)
    setEditBudImageDataUrl(strain.budImageDataUrl)
    setEditing(true)
  }

  function handleEditPhoto(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setter(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function saveEdit() {
    if (!editName.trim()) return
    updateStrain(strain.id, {
      name: editName.trim(),
      thc: editThc ? parseFloat(editThc) : undefined,
      cbd: editCbd ? parseFloat(editCbd) : undefined,
      type: editType || undefined,
      terpenes: editTerpenes || undefined,
      effects: editEffects || undefined,
      amount: editAmount || undefined,
      notes: editNotes || undefined,
      imageDataUrl: editImageDataUrl,
      budImageDataUrl: editBudImageDataUrl,
    })
    setEditing(false)
  }

  async function handleEnrich() {
    setEnriching(true)
    setEnrichError('')
    setEnrichModel('')
    setCheckResult(null)
    setCheckError('')
    setJudgment(null)

    const [geminiResult, claudeResult] = await Promise.allSettled([
      lookupStrainData(strain.name),
      hasClaudeKey ? crossCheckStrainWithClaude(strain.name) : Promise.reject(new Error('no key')),
    ])

    let geminiData: Awaited<ReturnType<typeof lookupStrainData>> | null = null

    if (geminiResult.status === 'fulfilled') {
      geminiData = geminiResult.value
      if (geminiResult.value.modelUsed) setEnrichModel(geminiResult.value.modelUsed)
      const data = geminiResult.value
      const updates: Partial<StrainEntry> = {}
      if (data.thc != null   && strain.thc      == null) updates.thc      = data.thc
      if (data.cbd != null   && strain.cbd      == null) updates.cbd      = data.cbd
      if (data.type          && !strain.type)            updates.type      = data.type
      if (data.terpenes      && !strain.terpenes)        updates.terpenes  = data.terpenes
      if (data.effects       && !strain.effects)         updates.effects   = data.effects
      if (data.history       && !strain.history)         updates.history   = data.history
      if (Object.keys(updates).length > 0) updateStrain(strain.id, updates)
      setEnriched(true)
    } else {
      setEnrichError('Lookup failed. Check your Gemini API key in Settings.')
    }

    if (claudeResult.status === 'fulfilled') {
      setCheckResult(claudeResult.value)
      if (geminiData) {
        judgeStrainData(strain.name, geminiData, claudeResult.value)
          .then(setJudgment)
          .catch(() => {/* silent — judgment is bonus, not critical */})
      }
    } else if (hasClaudeKey) {
      setCheckError('Claude cross-check failed. Check your Claude API key.')
    }

    setEnriching(false)
  }

  function handleDelete() {
    deleteStrain(strain.id)
    onClose()
  }

  function toggleStock() {
    updateStrain(strain.id, { inStock: !strain.inStock })
  }

  const typeColor = strain.type ? TYPE_COLOR[strain.type] : 'var(--border)'
  const legendaryMatch = legendaryStrains.find(
    l => l.name.toLowerCase() === strain.name.toLowerCase()
  )
  const historyText = legendaryMatch?.lore ?? strain.history ?? null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
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

  if (editing) {
    return (
      <div style={{ padding: '20px 16px 40px' }}>
        <PageHeader title="Edit Strain" onBack={() => setEditing(false)} />

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Strain name</label>
          <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>THC %</label>
            <input type="number" value={editThc} onChange={e => setEditThc(e.target.value)} placeholder="e.g. 20" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CBD %</label>
            <input type="number" value={editCbd} onChange={e => setEditCbd(e.target.value)} placeholder="e.g. 0.5" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['sativa', 'indica', 'hybrid'] as const).map(t => (
              <button key={t} onClick={() => setEditType(editType === t ? '' : t)} style={{
                flex: 1,
                background: editType === t ? 'var(--accent-dim)' : 'var(--surface)',
                border: `2px solid ${editType === t ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, color: editType === t ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: editType === t ? 600 : 400,
                cursor: 'pointer', minHeight: 44, textTransform: 'capitalize',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Amount</label>
          <input value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="e.g. 3.5g" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Terpenes</label>
          <input value={editTerpenes} onChange={e => setEditTerpenes(e.target.value)} placeholder="e.g. Myrcene, Limonene" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Effects</label>
          <input value={editEffects} onChange={e => setEditEffects(e.target.value)} placeholder="e.g. Relaxed, Happy" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
          />
        </div>

        {/* Packaging photo */}
        <input ref={packagingFileRef} type="file" accept="image/*" onChange={e => handleEditPhoto(e, setEditImageDataUrl)} style={{ display: 'none' }} />
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Packaging photo</label>
          {editImageDataUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={editImageDataUrl} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => packagingFileRef.current?.click()}
                style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
              >
                <ImagePlus size={12} color="#fff" />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Change</span>
              </button>
              <button
                onClick={() => setEditImageDataUrl(undefined)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} strokeWidth={2.5} color="#fff" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => packagingFileRef.current?.click()}
              style={{ width: '100%', background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 14, color: 'var(--text-muted)', cursor: 'pointer', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <ImagePlus size={20} strokeWidth={1.5} />
              <span style={{ fontSize: 13 }}>Add packaging photo</span>
            </button>
          )}
        </div>

        {/* Bud photo */}
        <input ref={budFileRef} type="file" accept="image/*" onChange={e => handleEditPhoto(e, setEditBudImageDataUrl)} style={{ display: 'none' }} />
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Bud photo</label>
          {editBudImageDataUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={editBudImageDataUrl} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => budFileRef.current?.click()}
                style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
              >
                <ImagePlus size={12} color="#fff" />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Change</span>
              </button>
              <button
                onClick={() => setEditBudImageDataUrl(undefined)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} strokeWidth={2.5} color="#fff" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => budFileRef.current?.click()}
              style={{ width: '100%', background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: 14, color: 'var(--text-muted)', cursor: 'pointer', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <ImagePlus size={20} strokeWidth={1.5} />
              <span style={{ fontSize: 13 }}>Add bud photo</span>
            </button>
          )}
        </div>

        <button
          onClick={saveEdit}
          disabled={!editName.trim()}
          style={{
            width: '100%',
            background: editName.trim() ? 'var(--accent)' : 'var(--border)',
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 15, fontWeight: 600, minHeight: 54,
            cursor: editName.trim() ? 'pointer' : 'default',
          }}
        >
          Save changes
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title={strain.name} onBack={onClose} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={startEdit}
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 600,
            padding: '0 14px',
            minHeight: 36,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Pencil size={13} strokeWidth={2} />
          Edit
        </button>
      </div>

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

      {/* Photos */}
      {(strain.imageDataUrl || strain.budImageDataUrl) && (
        <div style={{
          display: strain.imageDataUrl && strain.budImageDataUrl ? 'grid' : 'block',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}>
          {strain.imageDataUrl && (
            <div>
              {strain.budImageDataUrl && (
                <p style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, marginTop: 0 }}>Packaging</p>
              )}
              <img src={strain.imageDataUrl} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', display: 'block', border: '2px solid var(--border)' }} />
            </div>
          )}
          {strain.budImageDataUrl && (
            <div>
              {strain.imageDataUrl && (
                <p style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, marginTop: 0 }}>Bud</p>
              )}
              <img src={strain.budImageDataUrl} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', display: 'block', border: '2px solid var(--border)' }} />
            </div>
          )}
        </div>
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
              <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
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
        {enriching ? <DiamondSpinner size={40} /> : enriched ? 'Info filled in ✓' : 'Fill missing info with AI'}
      </button>
      {enrichModel && (
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', margin: '-8px 0 10px', letterSpacing: '0.04em' }}>
          {enrichModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash (Pro unavailable)'}
        </p>
      )}

      {/* Cross-check results */}
      {checkError && (
        <p style={{ fontSize: 12, color: '#e05555', margin: '0 0 10px' }}>{checkError}</p>
      )}
      {checkResult && (
        <div style={{
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-sm)',
              marginBottom: 12,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Claude vs Gemini
                </span>
              </div>
              {([
                {
                  label: 'THC',
                  gemini: strain.thc != null ? `${strain.thc}%` : null,
                  claude: checkResult.thc != null ? `${checkResult.thc}%` : null,
                  agree: strain.thc != null && checkResult.thc != null && Math.abs(strain.thc - checkResult.thc) <= 2,
                },
                {
                  label: 'CBD',
                  gemini: strain.cbd != null ? `${strain.cbd}%` : null,
                  claude: checkResult.cbd != null ? `${checkResult.cbd}%` : null,
                  agree: strain.cbd != null && checkResult.cbd != null && Math.abs(strain.cbd - checkResult.cbd) <= 0.5,
                },
                {
                  label: 'Type',
                  gemini: strain.type ?? null,
                  claude: checkResult.type ?? null,
                  agree: !!strain.type && strain.type === checkResult.type,
                },
              ] as { label: string; gemini: string | null; claude: string | null; agree: boolean }[])
                .filter(r => r.gemini != null || r.claude != null)
                .map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr 1fr',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {row.label}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Gemini</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: row.agree ? '#6aaa40' : '#c08030' }}>
                        {row.gemini ?? '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Claude</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: row.agree ? '#6aaa40' : '#c08030' }}>
                        {row.claude ?? '—'}
                      </div>
                    </div>
                  </div>
                ))
              }
              {checkResult.effects && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                    Claude — Effects
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {checkResult.effects}
                  </p>
                </div>
              )}
              {checkResult.history && !strain.history && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                    Claude — History
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {checkResult.history}
                  </p>
                </div>
              )}
        </div>
      )}

      {/* Verdict */}
      {judgment && (
        <div style={{
          background: 'var(--surface)',
          border: `2px solid ${judgment.confidence === 'high' ? '#6aaa40' : judgment.confidence === 'medium' ? '#c08030' : '#e05555'}`,
          borderRadius: 12,
          boxShadow: `var(--shadow-sm)`,
          padding: 16,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
              {judgment.modelUsed === 'gemini-2.5-pro' ? 'Gemini Pro Verdict' : 'Gemini Flash Verdict'}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: judgment.confidence === 'high' ? '#6aaa40' : judgment.confidence === 'medium' ? '#c08030' : '#e05555',
              border: `1.5px solid currentColor`, borderRadius: 4, padding: '2px 7px',
            }}>
              {judgment.confidence} confidence
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            {judgment.thc != null && (
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 2 }}>THC</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{judgment.thc}%</div>
              </div>
            )}
            {judgment.cbd != null && (
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 2 }}>CBD</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{judgment.cbd}%</div>
              </div>
            )}
            {judgment.type && (
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 2 }}>Type</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{judgment.type}</div>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, wordBreak: 'break-word' }}>
            {judgment.notes}
          </p>
        </div>
      )}

      {/* History */}
      {historyText && (
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
            color: 'var(--text-muted)', margin: '0 0 8px',
          }}>Origin & History</p>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0, wordBreak: 'break-word' }}>
            {historyText}
          </p>
          {legendaryMatch && (
            <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '10px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {legendaryMatch.era}
            </p>
          )}
        </div>
      )}

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
