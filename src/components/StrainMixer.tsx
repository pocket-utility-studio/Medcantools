import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { generateFourBlends, type FourBlendResult, type EnrichedStrain } from '../services/ai'
import type { StrainEntry } from '../context/StashContext'
import DiamondSpinner from './DiamondSpinner'

const BLEND_CONFIG: Record<keyof FourBlendResult, { label: string; color: string; emoji: string }> = {
  taste:    { label: 'Taste',    color: '#b06020', emoji: '★' },
  euphoric: { label: 'Euphoric', color: '#3b7651', emoji: '▲' },
  relax:    { label: 'Relax',    color: '#7060c0', emoji: '●' },
  wildcard: { label: 'Wild Card',color: '#2070a0', emoji: '◆' },
}

export default function StrainMixer({ strains }: { strains: StrainEntry[] }) {
  const [result, setResult] = useState<FourBlendResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inStock = strains.filter(s => s.inStock)
  if (inStock.length < 2) return null

  async function handleGet() {
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const party: EnrichedStrain[] = inStock.map(s => ({
        name: s.name, type: s.type, thc: s.thc, cbd: s.cbd,
        terpenes: s.terpenes, effects: s.effects, notes: s.notes,
      }))
      const r = await generateFourBlends(party)
      setResult(r)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg === 'NO_KEY' ? 'No API key set — add it in Settings.' : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <span style={{
        fontFamily: "'Caveat', cursive",
        fontSize: 20, fontWeight: 700,
        color: 'var(--text)', display: 'block', marginBottom: 8,
      }}>
        Strain Mixer
      </span>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
        AI suggests four pairings from your stash — taste, euphoric, relax, and a wild card.
      </p>

      <button
        onClick={handleGet}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: loading ? 'var(--surface)' : 'var(--accent)',
          border: `2px solid ${loading ? 'var(--border)' : 'var(--accent)'}`,
          boxShadow: loading ? 'none' : 'var(--shadow)',
          borderRadius: 10,
          color: loading ? 'var(--text-muted)' : '#fff',
          fontSize: 14, fontWeight: 700,
          minHeight: 52, cursor: loading ? 'default' : 'pointer',
          marginBottom: error || result ? 14 : 0,
        }}
      >
        {loading ? <DiamondSpinner size={40} /> : <Shuffle size={15} strokeWidth={2.5} />}
        {loading ? 'Asking the Cyber-Botanist…' : 'Get blend suggestions'}
      </button>

      {error && (
        <p style={{ fontSize: 13, color: '#c03333', margin: '0 0 10px' }}>{error}</p>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.keys(result) as (keyof FourBlendResult)[]).map((key) => {
            const card = result[key]
            const { label, color, emoji } = BLEND_CONFIG[key]
            return (
              <div key={key} style={{
                background: 'var(--surface)',
                border: `2px solid ${color}`,
                borderRadius: 10,
                boxShadow: `2px 2px 0 ${color}55`,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color, marginBottom: 6,
                }}>
                  {emoji} {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  {card.strainA} + {card.strainB}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  {card.reason}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
