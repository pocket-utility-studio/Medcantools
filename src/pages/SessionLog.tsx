import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStash } from '../context/StashContext'
import PageHeader from '../components/PageHeader'

interface SessionEntry {
  id: string
  strainName: string
  strainType?: 'sativa' | 'indica' | 'hybrid'
  date: string
  temp?: number
  symptoms: string[]
  preSeverity: number
  postSeverity?: number
  notes?: string
}

const STORAGE_KEY = 'canopy_sessions'
const SYMPTOM_OPTS = ['Pain', 'Anxiety', 'Nausea', 'Depression', 'Fatigue', 'Insomnia', 'Stress', 'Focus', 'Mood', 'Appetite']
const VAPE_TEMPS = [160, 170, 180, 190, 200, 210]

function loadSessions(): SessionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSessions(sessions: SessionEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export default function SessionLog() {
  const navigate = useNavigate()
  const { strains } = useStash()
  const [sessions, setSessions] = useState<SessionEntry[]>(loadSessions)
  const [adding, setAdding] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Form state
  const [strainName, setStrainName] = useState('')
  const [strainType, setStrainType] = useState<'sativa' | 'indica' | 'hybrid' | ''>('')
  const [temp, setTemp] = useState<number | undefined>()
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [preSeverity, setPreSeverity] = useState(5)
  const [notes, setNotes] = useState('')

  function toggleSymptom(s: string) {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function selectStrain(name: string, type?: 'sativa' | 'indica' | 'hybrid') {
    setStrainName(name)
    setStrainType(type ?? '')
  }

  function logSession() {
    if (!strainName.trim()) return
    const entry: SessionEntry = {
      id: crypto.randomUUID(),
      strainName: strainName.trim(),
      strainType: strainType || undefined,
      date: new Date().toISOString(),
      temp,
      symptoms,
      preSeverity,
      notes: notes || undefined,
    }
    const updated = [entry, ...sessions]
    setSessions(updated)
    saveSessions(updated)
    // Reset
    setStrainName(''); setStrainType(''); setTemp(undefined)
    setSymptoms([]); setPreSeverity(5); setNotes('')
    setAdding(false)
  }

  function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id)
    setSessions(updated)
    saveSessions(updated)
    setConfirmId(null)
  }

  const typeColor: Record<string, string> = { sativa: '#6aaa40', indica: '#7060c0', hybrid: '#c08030' }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text)', fontSize: 14, padding: '12px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', display: 'block', marginBottom: 8,
  }

  if (adding) return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Log Session" onBack={() => setAdding(false)} />

      {/* Quick-pick from stash */}
      {strains.filter(s => s.inStock).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>From your stash</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {strains.filter(s => s.inStock).map((s) => (
              <button
                key={s.id}
                onClick={() => selectStrain(s.name, s.type)}
                style={{
                  background: strainName === s.name ? 'var(--accent-dim)' : 'var(--surface)',
                  border: `1px solid ${strainName === s.name ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 20, color: strainName === s.name ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13, padding: '0 14px', height: 36, minHeight: 36, cursor: 'pointer',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strain name */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Strain name</label>
        <input value={strainName} onChange={(e) => setStrainName(e.target.value)} placeholder="e.g. Blue Dream" style={inputStyle} />
      </div>

      {/* Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['sativa', 'indica', 'hybrid'] as const).map((t) => (
            <button key={t} onClick={() => setStrainType(strainType === t ? '' : t)} style={{
              flex: 1, background: strainType === t ? 'var(--accent-dim)' : 'var(--surface)',
              border: `1px solid ${strainType === t ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6, color: strainType === t ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 13, cursor: 'pointer', minHeight: 44, textTransform: 'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Temperature</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VAPE_TEMPS.map((t) => (
            <button key={t} onClick={() => setTemp(temp === t ? undefined : t)} style={{
              background: temp === t ? 'var(--accent-dim)' : 'var(--surface)',
              border: `1px solid ${temp === t ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6, color: temp === t ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 13, padding: '0 12px', minHeight: 44, cursor: 'pointer',
            }}>
              {t}°C
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Symptoms being treated (optional)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOM_OPTS.map((s) => {
            const on = symptoms.includes(s)
            return (
              <button key={s} onClick={() => toggleSymptom(s)} style={{
                background: on ? 'var(--accent-dim)' : 'var(--surface)',
                border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 20, color: on ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, padding: '0 12px', height: 36, minHeight: 36, cursor: 'pointer',
              }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pre-severity */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Symptom severity before ({preSeverity}/10)</label>
        <input type="range" min={1} max={10} value={preSeverity} onChange={(e) => setPreSeverity(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Mild</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Severe</span>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel? Onset time? Any observations?" rows={3}
          style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
      </div>

      <button onClick={logSession} disabled={!strainName.trim()} style={{
        width: '100%', background: strainName.trim() ? 'var(--accent)' : 'var(--border)',
        border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
        minHeight: 52, cursor: strainName.trim() ? 'pointer' : 'default',
      }}>
        Log session
      </button>
    </div>
  )

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader
        title="Sessions"
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

      {sessions.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No sessions logged yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map((s) => (
          <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{s.strainName}</span>
                {s.strainType && (
                  <span style={{ fontSize: 11, color: typeColor[s.strainType], marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.strainType}</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: s.symptoms.length > 0 || s.notes ? 10 : 0 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Severity: <strong style={{ color: 'var(--text)' }}>{s.preSeverity}/10</strong></span>
              {s.temp && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.temp}°C</span>}
            </div>

            {s.symptoms.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: s.notes ? 10 : 0 }}>
                {s.symptoms.map((sym) => (
                  <span key={sym} style={{ fontSize: 11, background: 'var(--border)', borderRadius: 10, padding: '2px 8px', color: 'var(--text-muted)' }}>{sym}</span>
                ))}
              </div>
            )}

            {s.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{s.notes}</p>}

            <div style={{ marginTop: 12 }}>
              {confirmId === s.id ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmId(null)} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 13, minHeight: 36, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => deleteSession(s.id)} style={{ flex: 1, background: '#5a1a1a', border: 'none', borderRadius: 6, color: '#ffaaaa', fontSize: 13, minHeight: 36, cursor: 'pointer' }}>Delete</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', padding: 0, minHeight: 'unset' }}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
