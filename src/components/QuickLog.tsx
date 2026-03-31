import { useState } from 'react'
import { Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useStash } from '../context/StashContext'

const MOODS = [
  { emoji: '😊', label: 'Good' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤕', label: 'Pain' },
  { emoji: '😰', label: 'Anxious' },
]

export default function QuickLog() {
  const { strains } = useStash()
  const [open, setOpen] = useState(false)
  const [strainName, setStrainName] = useState('')
  const [mood, setMood] = useState('')
  const [severity, setSeverity] = useState(5)
  const [done, setDone] = useState(false)

  const inStock = strains.filter(s => s.inStock)

  function log() {
    if (!strainName) return
    try {
      const sessions = JSON.parse(localStorage.getItem('dailygrind_sessions') || '[]')
      const entry = {
        id: crypto.randomUUID(),
        strainName,
        date: new Date().toISOString(),
        symptoms: [],
        preSeverity: severity,
        mood: mood || undefined,
      }
      localStorage.setItem('dailygrind_sessions', JSON.stringify([entry, ...sessions]))
    } catch { /* ignore */ }
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setOpen(false)
      setStrainName('')
      setMood('')
      setSeverity(5)
    }, 1500)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '2px solid var(--border)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 8, padding: '12px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          minHeight: 48,
        }}
      >
        <Zap size={14} color="var(--icon-notes)" strokeWidth={2.5} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.01em' }}>
          Quick log
        </span>
        {open
          ? <ChevronUp size={14} color="var(--text-dim)" strokeWidth={2} />
          : <ChevronDown size={14} color="var(--text-dim)" strokeWidth={2} />
        }
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {/* Strain picker */}
          <div style={{ marginTop: 14, marginBottom: 12 }}>
            {inStock.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {inStock.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStrainName(strainName === s.name ? '' : s.name)}
                    style={{
                      background: strainName === s.name ? 'var(--accent-dim)' : 'var(--bg)',
                      border: `1.5px solid ${strainName === s.name ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 20, fontSize: 13, fontWeight: strainName === s.name ? 700 : 400,
                      color: strainName === s.name ? 'var(--text)' : 'var(--text-muted)',
                      padding: '0 12px', height: 36, minHeight: 36, cursor: 'pointer',
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            ) : (
              <input
                value={strainName}
                onChange={e => setStrainName(e.target.value)}
                placeholder="Strain name"
                style={{
                  width: '100%', background: 'var(--bg)', border: '1.5px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 14, padding: '10px 12px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Mood */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {MOODS.map(m => (
              <button
                key={m.emoji}
                onClick={() => setMood(mood === m.emoji ? '' : m.emoji)}
                title={m.label}
                style={{
                  flex: 1, fontSize: 20, background: mood === m.emoji ? 'var(--accent-dim)' : 'var(--bg)',
                  border: `1.5px solid ${mood === m.emoji ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, minHeight: 42, cursor: 'pointer', padding: 0,
                }}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          {/* Severity */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{severity}/10</span>
            </div>
            <input
              type="range" min={1} max={10} value={severity}
              onChange={e => setSeverity(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          {/* Log button */}
          <button
            onClick={log}
            disabled={!strainName}
            style={{
              width: '100%',
              background: done ? 'var(--accent-dim)' : strainName ? 'var(--accent)' : 'var(--border)',
              border: done ? '2px solid var(--accent)' : 'none',
              borderRadius: 8, color: done ? 'var(--accent)' : '#fff',
              fontSize: 14, fontWeight: 700, minHeight: 48, cursor: strainName ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
          >
            {done ? 'Logged ✓' : 'Log session'}
          </button>
        </div>
      )}
    </div>
  )
}
