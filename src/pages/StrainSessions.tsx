import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { getImage, sessionImageKey } from '../services/imageStore'

interface SessionEntry {
  id: string
  strainName: string
  strainType?: 'sativa' | 'indica' | 'hybrid'
  date: string
  temp?: number
  symptoms: string[]
  preSeverity: number
  mood?: string
  notes?: string
  imageDataUrl?: string
}

const TYPE_COLOR: Record<string, string> = {
  sativa: '#6aaa40',
  indica: '#7060c0',
  hybrid: '#c08030',
}

function loadSessions(): SessionEntry[] {
  try { return JSON.parse(localStorage.getItem('dailygrind_sessions') || '[]') } catch { return [] }
}

export default function StrainSessions() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const strainName = params.get('strain') ?? ''

  const raw = loadSessions().filter(s => s.strainName.toLowerCase() === strainName.toLowerCase())
  const [sessions, setSessions] = useState<SessionEntry[]>(raw)

  useEffect(() => {
    Promise.all(raw.map(async (s) => {
      const img = await getImage(sessionImageKey(s.id))
      return img ? { ...s, imageDataUrl: img } : s
    })).then(setSessions).catch(() => {})
  }, [])

  const avgSeverity = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + s.preSeverity, 0) / sessions.length).toFixed(1)
    : null

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title={strainName} onBack={() => navigate(-1)} />

      {/* Stats bar */}
      {sessions.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20,
          background: 'var(--surface)', border: '2px solid var(--border)',
          borderRadius: 10, padding: '12px 16px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontFamily: "'Caveat', cursive", fontWeight: 700, color: 'var(--text)' }}>
              {sessions.length}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sessions</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontFamily: "'Caveat', cursive", fontWeight: 700, color: 'var(--text)' }}>
              {avgSeverity}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg severity</div>
          </div>
          {sessions.filter(s => s.mood).length > 0 && (
            <>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>
                  {/* Most common mood */}
                  {(() => {
                    const moods = sessions.map(s => s.mood).filter(Boolean) as string[]
                    const counts: Record<string, number> = {}
                    moods.forEach(m => { counts[m] = (counts[m] ?? 0) + 1 })
                    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
                  })()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Common mood</div>
              </div>
            </>
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No sessions logged for {strainName} yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.sort((a, b) => b.date.localeCompare(a.date)).map(s => (
            <div key={s.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  {s.mood && <span style={{ marginRight: 6 }}>{s.mood}</span>}
                  {s.strainType && (
                    <span style={{ fontSize: 11, color: TYPE_COLOR[s.strainType], marginRight: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      {s.strainType}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                  {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {s.imageDataUrl && (
                <img src={s.imageDataUrl} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
              )}

              <div style={{ display: 'flex', gap: 16, marginBottom: s.symptoms?.length > 0 || s.notes ? 8 : 0 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Severity: <strong style={{ color: 'var(--text)' }}>{s.preSeverity}/10</strong></span>
                {s.temp && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.temp}°C</span>}
              </div>

              {s.symptoms?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: s.notes ? 8 : 0 }}>
                  {s.symptoms.map(sym => (
                    <span key={sym} style={{ fontSize: 11, background: 'var(--border)', borderRadius: 10, padding: '2px 8px', color: 'var(--text-muted)' }}>{sym}</span>
                  ))}
                </div>
              )}

              {s.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{s.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
