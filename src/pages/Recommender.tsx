import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Thermometer, BookOpen, Eye, Sparkles } from 'lucide-react'
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

  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [timeOfDay] = useState<TimeOfDay>(detectTimeOfDay)
  const [severity, setSeverity] = useState<Severity>('low')
  const [status, setStatus] = useState<Status>('idle')
  const [response, setResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  function toggleTag(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const query = [selected.join(', '), freeText.trim()].filter(Boolean).join('. ')

  async function handleAsk() {
    if (!query || inStock.length === 0) return
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
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    margin: '0 0 10px',
    display: 'block',
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Get AI Advice" onBack={() => navigate('/')} />

      {inStock.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '24px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Add strains to your journal first, then come back for a recommendation.
          </p>
        </div>
      ) : (
        <>
          {/* Effect tags */}
          <div style={{ marginBottom: 20 }}>
            <span style={sectionLabel}>How do you want to feel?</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EFFECT_TAGS.map((tag) => {
                const active = selected.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      background: active ? 'var(--accent-dim)' : 'var(--surface)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 22,
                      color: active ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
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
          <div style={{ marginBottom: 20 }}>
            <span style={sectionLabel}>Symptom severity</span>
            <div style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 4,
              gap: 4,
            }}>
              {SEVERITY_OPTIONS.map(({ value, label }) => {
                const active = severity === value
                return (
                  <button
                    key={value}
                    onClick={() => setSeverity(value)}
                    style={{
                      flex: 1,
                      background: active ? 'var(--accent)' : 'none',
                      border: 'none',
                      borderRadius: 7,
                      color: active ? '#fff' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      minHeight: 40,
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '7px 0 0', lineHeight: 1.5 }}>
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
                border: '1px solid var(--border)',
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
              background: query && status !== 'loading' ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
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
              background: 'rgba(224, 85, 85, 0.08)',
              border: '1px solid rgba(224, 85, 85, 0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 14, color: '#e05555', margin: 0 }}>{errorMsg}</p>
            </div>
          )}

          {/* Response */}
          {(status === 'done' || status === 'loading') && response && (
            <ResponseDisplay text={response} />
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
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
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
  TERPENES:       { icon: <Leaf size={12} strokeWidth={2} />,     label: 'Terpenes' },
  TEMPERATURE:    { icon: <Thermometer size={12} strokeWidth={2} />, label: 'Temperature' },
  HISTORY:        { icon: <BookOpen size={12} strokeWidth={2} />, label: 'History' },
  EXPECT:         { icon: <Eye size={12} strokeWidth={2} />,      label: 'What to expect' },
}

function ResponseDisplay({ text }: { text: string }) {
  const blocks = parseResponse(text)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {blocks.map((block, i) => {
        const meta = SECTION_META[block.heading]
        const isMain = block.heading === 'RECOMMENDATION'
        return (
          <div
            key={i}
            style={{
              background: isMain ? 'rgba(59, 118, 81, 0.07)' : 'var(--surface)',
              border: `1px solid ${isMain ? 'rgba(59, 118, 81, 0.3)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--accent)', marginBottom: 8,
            }}>
              {meta?.icon}
              <span style={{
                fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: 700,
              }}>
                {meta?.label ?? block.heading}
              </span>
            </div>
            <p style={{
              fontSize: isMain ? 15 : 13,
              color: isMain ? 'var(--text)' : 'var(--text-muted)',
              lineHeight: 1.65,
              margin: 0,
              fontWeight: isMain ? 500 : 400,
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
