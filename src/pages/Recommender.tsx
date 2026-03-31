import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Thermometer, BookOpen, Eye, Sparkles, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react'
import { useStash } from '../context/StashContext'
import { getRecommendation, type EnrichedStrain } from '../services/ai'
import PageHeader from '../components/PageHeader'

const EFFECT_TAGS = [
  'Sleep', 'Focus', 'Energy', 'Creative',
  'Relaxed', 'Social', 'Pain relief', 'Anxiety',
]

type Status = 'idle' | 'loading' | 'done' | 'error'
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
type Severity = 'low' | 'medium' | 'high'

function detectTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

const SEVERITY_DESC: Record<Severity, string> = {
  low:    'Time of day respected',
  medium: 'Flexible approach',
  high:   'All options considered',
}

export default function Recommender() {
  const navigate = useNavigate()
  const { strains } = useStash()
  const inStock = strains.filter((s) => s.inStock)

  const [tab, setTab] = useState<'ask' | 'saved'>('ask')
  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [timeOfDay] = useState<TimeOfDay>(detectTimeOfDay)
  const [severity, setSeverity] = useState<Severity>('low')
  const [status, setStatus] = useState<Status>('idle')
  const [response, setResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saved, setSaved] = useState<boolean>(false)
  const [savedRecs, setSavedRecs] = useState<Array<{ query: string; text: string; date: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('dg_saved_recs') || '[]') } catch { return [] }
  })

  function toggleTag(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const query = [selected.join(', '), freeText.trim()].filter(Boolean).join('. ')

  function saveRec() {
    if (!response) return
    const rec = { query, text: response, date: new Date().toISOString() }
    const updated = [rec, ...savedRecs].slice(0, 20)
    setSavedRecs(updated)
    localStorage.setItem('dg_saved_recs', JSON.stringify(updated))
    setSaved(true)
  }

  function deleteRec(date: string) {
    const updated = savedRecs.filter(r => r.date !== date)
    setSavedRecs(updated)
    localStorage.setItem('dg_saved_recs', JSON.stringify(updated))
  }

  async function handleAsk() {
    if (!query || inStock.length === 0) return
    localStorage.setItem('dg_last_query', selected.length > 0 ? selected.join(', ') : freeText.trim())
    setSaved(false)
    setStatus('loading')
    setResponse('')
    setErrorMsg('')

    const party: EnrichedStrain[] = inStock.map((s) => ({
      name: s.name, type: s.type, thc: s.thc, cbd: s.cbd,
      terpenes: s.terpenes, effects: s.effects, notes: s.notes,
    }))

    try {
      await getRecommendation(query, party, timeOfDay, severity, undefined, undefined, (chunk) => {
        setResponse(chunk)
        setStatus('done')
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setErrorMsg(
        msg === 'NO_KEY'
          ? 'No API key set. Add your Gemini key in Settings.'
          : 'Something went wrong. Try again.'
      )
      setStatus('error')
    }
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: "'Caveat', cursive",
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 10px',
    display: 'block',
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Cyber-Botanist" onBack={() => navigate('/')} />

      {/* Tab switcher */}
      <div style={{
        display: 'flex', background: 'var(--surface)',
        border: '2px solid var(--border)', borderRadius: 10,
        padding: 3, gap: 3, marginBottom: 20,
      }}>
        {(['ask', 'saved'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: tab === t ? 'var(--border)' : 'none',
            border: 'none', borderRadius: 7,
            color: tab === t ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: tab === t ? 700 : 400,
            minHeight: 40, cursor: 'pointer',
          }}>
            {t === 'ask' ? 'Ask' : `Saved${savedRecs.length > 0 ? ` (${savedRecs.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'saved' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {savedRecs.length === 0 && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
              No saved recommendations yet. Ask a question and save the answer.
            </p>
          )}
          {savedRecs.map(rec => (
            <div key={rec.date} style={{
              background: 'var(--surface)', border: '2px solid var(--border)',
              borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{rec.query}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '2px 0 0' }}>
                    {new Date(rec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => deleteRec(rec.date)} style={{
                  background: 'none', border: 'none', color: 'var(--text-dim)',
                  cursor: 'pointer', minHeight: 'unset', padding: 4,
                }}>
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, padding: '12px 14px', margin: 0 }}>
                {rec.text.slice(0, 300)}{rec.text.length > 300 ? '…' : ''}
              </p>
            </div>
          ))}
        </div>
      ) : inStock.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow)',
          padding: '24px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Add strains to your journal first, then come back for a recommendation.
          </p>
        </div>
      ) : (
        <>
          {/* Effect tags */}
          <div style={{ marginBottom: 22 }}>
            <span style={sectionLabel}>How do you want to feel?</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EFFECT_TAGS.map((tag) => {
                const active = selected.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      background: active ? 'var(--border)' : 'var(--surface)',
                      border: '2px solid var(--border)',
                      borderRadius: 22,
                      color: active ? '#ffffff' : 'var(--text)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      padding: '0 16px',
                      height: 44,
                      minHeight: 44,
                      cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div style={{ marginBottom: 22 }}>
            <span style={sectionLabel}>Symptom severity</span>
            <div style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 10,
              padding: 3,
              gap: 3,
            }}>
              {SEVERITY_OPTIONS.map(({ value, label }) => {
                const active = severity === value
                return (
                  <button
                    key={value}
                    onClick={() => setSeverity(value)}
                    style={{
                      flex: 1,
                      background: active ? 'var(--border)' : 'none',
                      border: 'none',
                      borderRadius: 7,
                      color: active ? '#fff' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: active ? 700 : 400,
                      minHeight: 40,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '7px 0 0', lineHeight: 1.5 }}>
              {SEVERITY_DESC[severity]}
            </p>
          </div>

          {/* Free text */}
          <div style={{ marginBottom: 24 }}>
            <span style={sectionLabel}>More detail (optional)</span>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g. I want to watch a film and wind down without feeling groggy tomorrow"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '2px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 14,
                padding: '12px 14px',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleAsk}
            disabled={!query || status === 'loading'}
            style={{
              width: '100%',
              background: query && status !== 'loading' ? 'var(--accent)' : 'var(--text-dim)',
              border: '2px solid ' + (query && status !== 'loading' ? 'var(--accent)' : 'var(--text-dim)'),
              boxShadow: query && status !== 'loading' ? 'var(--shadow)' : 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              minHeight: 54,
              cursor: query && status !== 'loading' ? 'pointer' : 'default',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {status === 'loading' ? <LoadingDots /> : (
              <>
                <Sparkles size={16} strokeWidth={2} />
                Get recommendation
              </>
            )}
          </button>

          {/* Error */}
          {status === 'error' && (
            <div style={{
              background: '#fff5f5',
              border: '2px solid #e05555',
              borderRadius: 10,
              boxShadow: '2px 2px 0 #e05555',
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 14, color: '#c03333', margin: 0, fontWeight: 500 }}>{errorMsg}</p>
            </div>
          )}

          {/* Response */}
          {(status === 'done' || status === 'loading') && response && (
            <>
              <ResponseDisplay text={response} />
              {status === 'done' && (
                <button
                  onClick={saveRec}
                  disabled={saved}
                  style={{
                    marginTop: 12, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: saved ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `2px solid ${saved ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, boxShadow: saved ? 'none' : 'var(--shadow-sm)',
                    color: saved ? 'var(--accent)' : 'var(--text)',
                    fontSize: 14, fontWeight: 600,
                    minHeight: 48, cursor: saved ? 'default' : 'pointer',
                  }}
                >
                  {saved ? <BookmarkCheck size={15} strokeWidth={2} /> : <Bookmark size={15} strokeWidth={2} />}
                  {saved ? 'Saved to favourites' : 'Save this recommendation'}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function LoadingDots() {
  return (
    <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <style>{`
        @keyframes canopy-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          display: 'inline-block', width: 6, height: 6,
          borderRadius: '50%', background: '#fff',
          animation: `canopy-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  )
}

const SECTIONS = ['RECOMMENDATION', 'TERPENES', 'TEMPERATURE', 'HISTORY', 'EXPECT'] as const

const SECTION_META: Record<string, { icon: React.ReactNode; label: string }> = {
  RECOMMENDATION: { icon: <Sparkles size={12} strokeWidth={2} />, label: 'Recommendation' },
  TERPENES:       { icon: <Leaf size={12} strokeWidth={2} />,        label: 'Terpenes' },
  TEMPERATURE:    { icon: <Thermometer size={12} strokeWidth={2} />, label: 'Temperature' },
  HISTORY:        { icon: <BookOpen size={12} strokeWidth={2} />,    label: 'History' },
  EXPECT:         { icon: <Eye size={12} strokeWidth={2} />,         label: 'What to expect' },
}

function ResponseDisplay({ text }: { text: string }) {
  const blocks = parseResponse(text)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block, i) => {
        const meta = SECTION_META[block.heading]
        const isMain = block.heading === 'RECOMMENDATION'
        return (
          <div
            key={i}
            style={{
              background: isMain ? 'var(--accent-dim)' : 'var(--surface)',
              border: `2px solid ${isMain ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 12,
              boxShadow: isMain ? `3px 3px 0 var(--accent)` : 'var(--shadow-sm)',
              padding: '14px 16px',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: isMain ? 'var(--accent)' : 'var(--text-muted)',
              marginBottom: 8,
            }}>
              {meta?.icon}
              <span style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}>
                {meta?.label ?? block.heading}
              </span>
            </div>
            <p style={{
              fontSize: isMain ? 15 : 13,
              color: 'var(--text)',
              lineHeight: 1.65,
              margin: 0,
              fontWeight: isMain ? 600 : 400,
            }}>
              {block.body}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function parseResponse(text: string): { heading: string; body: string }[] {
  const results: { heading: string; body: string }[] = []

  for (let i = 0; i < SECTIONS.length; i++) {
    const header = SECTIONS[i]
    const nextHeader = SECTIONS[i + 1]
    const start = text.indexOf(header)
    if (start === -1) continue

    const contentStart = start + header.length
    const end = nextHeader ? text.indexOf(nextHeader, contentStart) : text.length
    const body = text.slice(contentStart, end === -1 ? text.length : end).trim()
    if (body) results.push({ heading: header, body })
  }

  if (results.length === 0 && text.trim()) {
    results.push({ heading: 'Response', body: text.trim() })
  }

  return results
}
