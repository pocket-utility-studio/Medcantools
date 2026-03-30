import { useState } from 'react'
import { useStash } from '../context/StashContext'
import { getRecommendation, type EnrichedStrain } from '../services/ai'

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

export default function Recommender() {
  const { strains } = useStash()
  const inStock = strains.filter((s) => s.inStock)

  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
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
      await getRecommendation(query, party, undefined, undefined, (chunk) => {
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

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Recommend</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
        {inStock.length === 0
          ? 'Add strains to your journal first.'
          : `${inStock.length} strain${inStock.length !== 1 ? 's' : ''} in stock`}
      </p>

      {inStock.length === 0 ? null : (
        <>
          {/* Effect tags */}
          <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            How do you want to feel?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
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

          {/* Free text */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
              More detail (optional)
            </p>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g. I want to watch a film and wind down without feeling groggy tomorrow"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
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
              borderRadius: 8,
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

const SECTIONS = ['RECOMMENDATION', 'TERPENE SCIENCE', 'TEMPERATURE GUIDE', 'STRAIN HISTORY', 'WHAT TO EXPECT']

function ResponseDisplay({ text }: { text: string }) {
  const blocks = parseResponse(text)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {blocks.map((block, i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px',
          }}
        >
          <p style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            margin: '0 0 10px',
            fontWeight: 600,
          }}>
            {block.heading}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
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

  // If parsing fails (streaming not yet at a section header), show raw
  if (results.length === 0 && text.trim()) {
    results.push({ heading: 'Response', body: text.trim() })
  }

  return results
}
