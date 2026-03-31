import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Thermometer, Wind, Leaf, Scale, ChevronRight, Search, ChevronDown, ChevronUp, BookOpen, Star } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const GUIDES = [
  { to: '/guide/temp',    label: 'Temperature guide', desc: 'Find your ideal vape temp',           Icon: Thermometer, tags: ['temp','vape','heat','degrees','celsius'] },
  { to: '/guide/escape',  label: 'Calm down',          desc: 'Breathing, sounds, grounding',        Icon: Wind,        tags: ['calm','anxiety','panic','breathing','grounding','stress'] },
  { to: '/guide/avb',     label: 'AVB guide',          desc: '6 ways to use already-vaped bud',     Icon: Leaf,        tags: ['avb','already vaped','edibles','reclaim'] },
  { to: '/guide/law',     label: 'Law guide',          desc: 'UK and Spain cannabis law reference', Icon: Scale,       tags: ['law','legal','uk','spain','rules'] },
  { to: '/guide/history', label: 'Cannabis history',   desc: 'On this day + science & culture facts', Icon: BookOpen,  tags: ['history','facts','science','culture','trivia','law'] },
  { to: '/guide/strains', label: 'Famous strains',     desc: '25 iconic strains from every era',    Icon: Star,        tags: ['strains','famous','legendary','og kush','skunk','haze','history'] },
]

const TERPENES = [
  { name: 'Myrcene',       aroma: 'Earthy, musky, herbal',     effects: 'Sedating, relaxing, enhances THC uptake',  found: 'Mango, lemongrass, thyme' },
  { name: 'Limonene',      aroma: 'Citrus, lemon, orange',     effects: 'Uplifting, anti-anxiety, mood boost',       found: 'Lemon, orange peel, juniper' },
  { name: 'Caryophyllene', aroma: 'Peppery, spicy, woody',     effects: 'Anti-inflammatory, pain relief, stress',    found: 'Black pepper, cloves, rosemary' },
  { name: 'Linalool',      aroma: 'Floral, lavender, sweet',   effects: 'Calming, sleep-inducing, anti-anxiety',     found: 'Lavender, coriander, birch' },
  { name: 'Pinene',        aroma: 'Pine, fresh, earthy',       effects: 'Alertness, memory, bronchodilator',         found: 'Pine needles, rosemary, basil' },
  { name: 'Humulene',      aroma: 'Hoppy, earthy, woody',      effects: 'Appetite suppressant, anti-inflammatory',   found: 'Hops, sage, ginseng' },
  { name: 'Ocimene',       aroma: 'Sweet, herbal, woody',      effects: 'Uplifting, antiviral, decongestant',        found: 'Mint, parsley, orchids' },
  { name: 'Terpinolene',   aroma: 'Floral, piney, fresh',      effects: 'Mildly sedating, antioxidant, uplifting',   found: 'Nutmeg, tea tree, apples' },
  { name: 'Bisabolol',     aroma: 'Floral, sweet, chamomile',  effects: 'Skin-soothing, anti-irritant, calming',     found: 'Chamomile, candeia tree' },
  { name: 'Geraniol',      aroma: 'Rose, floral, fruity',      effects: 'Neuroprotective, antioxidant, relaxing',    found: 'Geraniums, roses, citronella' },
  { name: 'Valencene',     aroma: 'Sweet citrus, orange',      effects: 'Uplifting, anti-inflammatory',              found: 'Valencia oranges, grapefruit' },
  { name: 'Nerolidol',     aroma: 'Woody, floral, citrus',     effects: 'Sedating, antifungal, anti-parasitic',      found: 'Ginger, jasmine, lemongrass' },
]

function getTerpeneOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const day = Math.floor((Date.now() - start.getTime()) / 86_400_000)
  return TERPENES[day % TERPENES.length]
}

export default function Guide() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [terpExpanded, setTerpExpanded] = useState(false)
  const terpene = getTerpeneOfTheDay()

  const filtered = query.trim()
    ? GUIDES.filter(g =>
        g.label.toLowerCase().includes(query.toLowerCase()) ||
        g.desc.toLowerCase().includes(query.toLowerCase()) ||
        g.tags.some(t => t.includes(query.toLowerCase()))
      )
    : GUIDES

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Cheat Sheets" onBack={() => navigate('/')} />

      {/* Terpene of the Day */}
      <div style={{
        background: 'var(--accent-dim)',
        border: '2px solid var(--accent)',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setTerpExpanded(e => !e)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none', border: 'none',
            padding: '12px 14px', cursor: 'pointer', minHeight: 'unset', gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--accent)', flexShrink: 0,
            }}>
              Terpene of the day
            </span>
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {terpene.name}
            </span>
          </div>
          {terpExpanded
            ? <ChevronUp  size={16} color="var(--accent)" strokeWidth={2} style={{ flexShrink: 0 }} />
            : <ChevronDown size={16} color="var(--accent)" strokeWidth={2} style={{ flexShrink: 0 }} />
          }
        </button>

        {terpExpanded && (
          <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--accent)' }}>
            {[
              { label: 'Aroma',    value: terpene.aroma   },
              { label: 'Effects',  value: terpene.effects  },
              { label: 'Found in', value: terpene.found    },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginTop: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--accent)',
                }}>
                  {label}
                </span>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: '3px 0 0', lineHeight: 1.5 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} strokeWidth={2} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search guides…"
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 14,
            padding: '11px 14px 11px 34px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Guide list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No guides match "{query}".</p>
        )}
        {filtered.map(({ to, label, desc, Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 12, boxShadow: 'var(--shadow-sm)',
              padding: '0 16px', width: '100%', textAlign: 'left',
              cursor: 'pointer', minHeight: 68, gap: 14,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              border: '2px solid var(--border)', background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={17} color="var(--accent)" strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            <ChevronRight size={15} color="var(--text-muted)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
