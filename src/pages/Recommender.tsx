import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStash } from '../context/StashContext'
import { getRecommendation, type EnrichedStrain } from '../services/ai'
import PageHeader from '../components/PageHeader'

const EFFECT_TAGS = [
  'Sleep',
  'Focus',
  'Energy',
  'Creative',
  'Relaxed',
  'Social',
  'Pain relief',
  'Anxiety',
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

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning:   'Morning',
  afternoon: 'Afternoon',
  evening:   'Evening',
  night:     'Night',
}

const SEVERITY_OPTIONS: { value: Severity; label: string; desc: string }[] = [
  { value: 'low',    label: 'Low',    desc: 'Mild — time of day respected' },
  { value: 'medium', label: 'Medium', desc: 'Moderate — flexible approach' },
  { value: 'high',   label: 'High',   desc: 'Severe — all options considered' },
]

export default function Recommender() {
  const navigate = useNavigate()
  const { strains } = useStash()
  const inStock = strains.filter((s) => s.inStock)

  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(detectTimeOfDay)
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
      name:     s.name,
      type:     s.type,
      thc:      s.thc,
      cbd:      s.cbd,
      terpenes: s.terpenes,
      effects:  s.effects,
      notes:    s.notes,
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

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    margin: '0 0 10px',
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Get AI Advice" onBack={() => navigate('/')} />

      {inStock.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Add strains to your journal first.
        </p>
      ) : (
        <>
          {/* Effect tags */}
          <p style={labelStyle}>How do you want to feel?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {EFFECT_TAGS.map((tag) => {
              const active = selected.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    background: active ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 20,
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: 13,
                    padding: '0 14px',
                    height: 36,
                    minHeight: 36,
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>

          {/* Time of day */}
          <div style={{ marginBottom: 24 }}>
            <p style={labelStyle}>Time of day</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.keys(TIME_LABELS) as TimeOfDay[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeOfDay(t)}
                  style={{
                    flex: 1,
                    background: timeOfDay === t ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `1px solid ${timeOfDay === t ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8,
                    color: timeOfDay === t ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: 12,
                    minHeight: 44,
                    cursor: 'pointer',
                  }}
                >
                  {TIME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom severity */}
          <div style={{ marginBottom: 24 }}>
            <p style={labelStyle}>Symptom severity</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {SEVERITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSeverity(value)}
                  style={{
                    flex: 1,
                    background: severity === value ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `1px solid ${severity === value ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8,
                    color: severity === value ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: severity === value ? 600 : 400,
                    minHeight: 44,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '8px 0 0', lineHeight: 1.5 }}>
              {SEVERITY_OPTIONS.find((o) => o.value === severity)?.desc}
            </p>
          </div>

          {/* Free text */}
          <div style={{ marginBottom: 24 }}>
            <p style={labelStyle}>More detail (optional)</p>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g. I want to watch a film and wind down without feeling groggy tomorrow"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 14,
                padding: '12px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Ask button */}
          <button
            onClick={handleAsk}
            disabled={!query || status === 'loading'}
            style={{
              width: '100%',
              background: query && status !== 'loading' ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              minHeight: 52,
              cursor: query && status !== 'loading' ? 'pointer' : 'default',
              marginBottom: 28,
            }}
          >
            {status === 'loading' ? 'Thinking...' : 'Get recommendation'}
          </button>

          {/* Error */}
          {status === 'error' && (
            <p style={{ fontSize: 14, color: '#e05555', marginBottom: 16 }}>{errorMsg}</p>
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

const SECTIONS = ['RECOMMENDATION', 'TERPENES', 'TEMPERATURE', 'HISTORY', 'EXPECT']

function ResponseDisplay({ text }: { text: string }) {
  const blocks = parseResponse(text)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      {blocks.map((block, i) => (
        <div
          key={i}
          style={{
            padding: '14px 16px',
            borderBottom: i < blocks.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            fontWeight: 600,
            display: 'block',
            marginBottom: 6,
          }}>
            {block.heading}
          </span>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
            {block.body}
          </p>
        </div>
      ))}
    </div>
  )
}

function parseResponse(text: string): { heading: string; body: string }[] {
  const results: { heading: string; body: string }[] = []
  let remaining = text

  for (let i = 0; i < SECTIONS.length; i++) {
    const header = SECTIONS[i]
    const nextHeader = SECTIONS[i + 1]
    const start = remaining.indexOf(header)
    if (start === -1) continue

    const contentStart = start + header.length
    const end = nextHeader ? remaining.indexOf(nextHeader, contentStart) : remaining.length

    const body = remaining.slice(contentStart, end === -1 ? remaining.length : end).trim()
    if (body) results.push({ heading: header, body })
  }

  if (results.length === 0 && text.trim()) {
    results.push({ heading: 'Response', body: text.trim() })
  }

  return results
}
