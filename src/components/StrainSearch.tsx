import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Check } from 'lucide-react'
import { useStash } from '../context/StashContext'
import { lookupStrainData, type StrainLookupResult } from '../services/ai'
import PageHeader from './PageHeader'
import DiamondSpinner from './DiamondSpinner'

interface Props {
  onClose: () => void
}

interface StrainRecord {
  Strain: string
  Type?: string
  Effects?: string
  Flavor?: string
  Description?: string
  terpenes?: string
  thc?: number
  cbd?: number
  medical?: string
}

const TYPE_COLOR: Record<string, string> = {
  sativa: '#6aaa40',
  indica: '#7060c0',
  hybrid: '#c08030',
}

let _db: StrainRecord[] | null = null
async function fetchDb(): Promise<StrainRecord[]> {
  if (_db) return _db
  try { _db = await fetch('/Daily-Grind/strains.json').then(r => r.json()) } catch { _db = [] }
  return _db!
}

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function dbToResult(r: StrainRecord): StrainLookupResult & { name: string } {
  const t = r.Type?.toLowerCase()
  return {
    name: r.Strain,
    thc: typeof r.thc === 'number' ? r.thc : undefined,
    cbd: typeof r.cbd === 'number' ? r.cbd : undefined,
    type: t === 'sativa' || t === 'indica' || t === 'hybrid' ? t : undefined,
    terpenes: r.terpenes || undefined,
    effects: r.Effects || undefined,
    history: r.Description ? r.Description.slice(0, 300) : undefined,
  }
}

export default function StrainSearch({ onClose }: Props) {
  const { addStrain, strains } = useStash()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<(StrainLookupResult & { name: string }) | null>(null)
  const [source, setSource] = useState<'offline' | 'ai' | null>(null)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  // Live suggestions from offline DB as user types
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    let cancelled = false
    fetchDb().then(db => {
      if (cancelled) return
      const q = normalise(query)
      const starts: string[] = []
      const contains: string[] = []
      for (const r of db) {
        const n = r.Strain
        const nl = normalise(n)
        if (nl.startsWith(q)) starts.push(n)
        else if (nl.includes(q)) contains.push(n)
        if (starts.length >= 6 && contains.length >= 4) break
      }
      setSuggestions([...starts, ...contains].slice(0, 10))
    })
    return () => { cancelled = true }
  }, [query])

  // Close suggestions on outside tap
  useEffect(() => {
    function onTap(e: MouseEvent | TouchEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onTap)
    document.addEventListener('touchstart', onTap)
    return () => {
      document.removeEventListener('mousedown', onTap)
      document.removeEventListener('touchstart', onTap)
    }
  }, [])

  async function selectSuggestion(name: string) {
    setQuery(name)
    setSuggestions([])
    setShowSuggestions(false)
    setAdded(false)
    setError('')
    setLoading(true)
    try {
      const db = await fetchDb()
      const match = db.find(r => normalise(r.Strain) === normalise(name))
      if (match) {
        setResult(dbToResult(match))
        setSource('offline')
      } else {
        await lookupAI(name)
      }
    } finally {
      setLoading(false)
    }
  }

  async function lookupAI(name: string) {
    setLoading(true)
    setError('')
    try {
      const data = await lookupStrainData(name)
      setResult({ ...data, name })
      setSource('ai')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg === 'NO_KEY'
        ? 'Add your Gemini API key in Settings to look up strains not in the offline database.'
        : 'Search failed. Check your connection and API key.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    const name = query.trim()
    if (!name) return
    setLoading(true)
    setResult(null)
    setAdded(false)
    setError('')
    try {
      const db = await fetchDb()
      const match = db.find(r => normalise(r.Strain) === normalise(name))
      if (match) {
        setResult(dbToResult(match))
        setSource('offline')
        setLoading(false)
      } else {
        await lookupAI(name)
      }
    } catch {
      setLoading(false)
    }
  }

  function handleAdd() {
    if (!result) return
    addStrain({
      name: result.name,
      thc: result.thc,
      cbd: result.cbd,
      type: result.type,
      terpenes: result.terpenes,
      effects: result.effects,
      medical: result.medical,
      inStock: true,
    })
    setAdded(true)
  }

  const alreadyInStash = result
    ? strains.some((s) => s.name.toLowerCase() === result.name.toLowerCase())
    : false

  const typeColor = result?.type ? TYPE_COLOR[result.type] : 'var(--border)'

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '13px 16px',
    borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Strain Search" onBack={onClose} />

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
        Search 4,300+ strains offline. AI enrichment available with an API key.
      </p>

      {/* Search input + suggestions */}
      <div ref={suggestRef} style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} strokeWidth={2} style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setResult(null)
                setAdded(false)
                setError('')
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Blue Dream, OG Kush…"
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '2px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 15,
                padding: '13px 14px 13px 36px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{
              background: query.trim() && !loading ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              padding: '0 18px',
              minHeight: 50,
              cursor: query.trim() && !loading ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? <DiamondSpinner size={32} /> : 'Search'}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'var(--surface)', border: '2px solid var(--accent)',
            borderRadius: 10, boxShadow: 'var(--shadow)',
            zIndex: 100, overflow: 'hidden', marginTop: 4,
          }}>
            {suggestions.map((s, i) => (
              <button
                key={s}
                onMouseDown={e => { e.preventDefault(); selectSuggestion(s) }}
                onTouchStart={e => { e.preventDefault(); selectSuggestion(s) }}
                style={{
                  width: '100%', textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text)', fontSize: 14,
                  padding: '12px 14px', cursor: 'pointer',
                  minHeight: 44, display: 'block',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fff5f5', border: '2px solid #e05555',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, color: '#e05555', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div style={{
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* Name + type + source badge */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '2px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 24, fontWeight: 700,
                color: 'var(--text)', margin: 0,
              }}>
                {result.name}
              </h2>
              <span style={{
                fontSize: 10, color: source === 'offline' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {source === 'offline' ? 'Offline' : 'AI'}
              </span>
            </div>
            {result.type && (
              <span style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: typeColor, border: `2px solid ${typeColor}`,
                borderRadius: 20, padding: '3px 12px',
              }}>
                {result.type}
              </span>
            )}
          </div>

          {/* Stats */}
          {[
            result.thc != null   && { label: 'THC',      value: `${result.thc}%` },
            result.cbd != null   && { label: 'CBD',      value: `${result.cbd}%` },
            result.terpenes      && { label: 'Terpenes', value: result.terpenes },
            result.effects       && { label: 'Effects',  value: result.effects },
            result.medical       && { label: 'Medical',  value: result.medical },
          ].filter(Boolean).map((row, i, arr) => {
            const { label, value } = row as { label: string; value: string }
            return (
              <div key={label} style={{
                ...rowStyle,
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, paddingRight: 12,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 14, color: 'var(--text)', fontWeight: 600,
                  textAlign: 'right', maxWidth: '65%',
                }}>
                  {value}
                </span>
              </div>
            )
          })}

          {result.history && (
            <div style={{ padding: '13px 16px', borderTop: '1px solid var(--border)' }}>
              <p style={{
                fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 6px',
              }}>Origin</p>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                {result.history}
              </p>
            </div>
          )}

          {/* Enrich with AI if offline result */}
          {source === 'offline' && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => lookupAI(result.name)}
                disabled={loading}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 600,
                }}
              >
                Enrich with AI →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add button */}
      {result && (
        added || alreadyInStash ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--accent-dim)', border: '2px solid var(--accent)',
            borderRadius: 10, minHeight: 50, color: 'var(--accent)', fontWeight: 600, fontSize: 14,
          }}>
            <Check size={16} strokeWidth={2.5} />
            {alreadyInStash && !added ? 'Already in your stash' : 'Added to stash'}
          </div>
        ) : (
          <button
            onClick={handleAdd}
            style={{
              width: '100%',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 10,
              boxShadow: 'var(--shadow)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              minHeight: 50,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add to stash
          </button>
        )
      )}
    </div>
  )
}
