import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

type TempRange = 'low' | 'mid-low' | 'mid' | 'mid-high' | 'high'

function getTempRange(temp: number): TempRange {
  if (temp <= 174) return 'low'
  if (temp <= 184) return 'mid-low'
  if (temp <= 194) return 'mid'
  if (temp <= 204) return 'mid-high'
  return 'high'
}

const EFFECT_PROFILES: Record<TempRange, { label: string; text: string; terpenes: string; color: string }> = {
  low: {
    label: 'Light & Clear',
    text: 'Myrcene and limonene active. Alert, creative, minimal cough. Good for daytime tasks.',
    terpenes: 'Limonene, Pinene, Terpinolene',
    color: '#6aaa40',
  },
  'mid-low': {
    label: 'Balanced',
    text: 'THC peaks. Euphoric, social, mild body relaxation. The classic vape experience.',
    terpenes: 'Myrcene, Limonene, Caryophyllene',
    color: '#6aaa40',
  },
  mid: {
    label: 'Full Spectrum',
    text: 'CBN activating. Deeper relaxation, stronger body effects. Good for unwinding.',
    terpenes: 'Myrcene, Linalool, Caryophyllene',
    color: '#c08030',
  },
  'mid-high': {
    label: 'Heavy Relief',
    text: 'CBC and higher cannabinoids active. Strong sedation, pain relief. Evening use.',
    terpenes: 'Myrcene, Linalool, Humulene',
    color: '#c08030',
  },
  high: {
    label: 'Maximum Extraction',
    text: 'All compounds active. Intense, heavy. Best for severe symptoms or AVB production.',
    terpenes: 'Myrcene, Linalool, Bisabolol',
    color: '#e05555',
  },
}

const RANGE_LABELS: Record<TempRange, string> = {
  low: '160 – 174°C',
  'mid-low': '175 – 184°C',
  mid: '185 – 194°C',
  'mid-high': '195 – 204°C',
  high: '205 – 210°C',
}

export default function TempGuide() {
  const navigate = useNavigate()
  const [temp, setTemp] = useState(185)
  const range = getTempRange(temp)
  const profile = EFFECT_PROFILES[range]

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Temperature Guide" onBack={() => navigate('/guide')} />

      {/* Temp display */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 52, fontWeight: 700, color: profile.color, lineHeight: 1, letterSpacing: '-2px' }}>
          {temp}°
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {RANGE_LABELS[range]}
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 32, padding: '0 4px' }}>
        <input
          type="range"
          min={160}
          max={210}
          step={1}
          value={temp}
          onChange={(e) => setTemp(Number(e.target.value))}
          style={{ width: '100%', accentColor: profile.color, height: 4, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>160°C</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>210°C</span>
        </div>
      </div>

      {/* Profile card */}
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${profile.color}40`,
        borderLeft: `3px solid ${profile.color}`,
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: profile.color, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {profile.label}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: '0 0 14px' }}>
          {profile.text}
        </p>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px' }}>
          Active terpenes
        </p>
        <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>
          {profile.terpenes}
        </p>
      </div>

      {/* Scale reference */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {(Object.keys(EFFECT_PROFILES) as TempRange[]).map((r) => (
          <div
            key={r}
            onClick={() => setTemp(r === 'low' ? 167 : r === 'mid-low' ? 180 : r === 'mid' ? 190 : r === 'mid-high' ? 200 : 208)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: range === r ? 'var(--border)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 13, color: range === r ? 'var(--text)' : 'var(--text-muted)', fontWeight: range === r ? 600 : 400 }}>
              {EFFECT_PROFILES[r].label}
            </span>
            <span style={{ fontSize: 12, color: EFFECT_PROFILES[r].color }}>
              {RANGE_LABELS[r]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
