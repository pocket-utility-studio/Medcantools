import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const METHODS = [
  {
    name: 'Gel capsules',
    difficulty: 'Easy',
    time: '10 min',
    materials: ['AVB', 'Empty gel capsules (size 00)', 'Small funnel or toothpick', 'Coconut oil (optional)'],
    description: 'The simplest AVB method. Fill empty gel capsules with ground AVB and swallow like a supplement. Effects take 1–2 hours but last significantly longer than vaping.',
    tips: ['Mix with melted coconut oil first for better absorption', 'Start with 0.3–0.5g per capsule until you know your tolerance', 'Store caps in a dark, cool place — they keep for months'],
  },
  {
    name: 'Cannabis tea',
    difficulty: 'Easy',
    time: '20 min',
    materials: ['AVB', 'Full-fat milk or coconut milk', 'Water', 'Tea bag (optional)', 'Honey to taste'],
    description: 'Steep AVB in hot water with a fat source. Cannabinoids are fat-soluble — full-fat milk is essential, otherwise most of the goodness goes down the drain.',
    tips: ["Simmer on low for 15+ mins — don't boil", 'Strain through a coffee filter before drinking', 'Strong tea or honey masks the earthy taste well', 'Effects hit in 45–90 mins'],
  },
  {
    name: 'Alcohol tincture',
    difficulty: 'Medium',
    time: '2–4 weeks',
    materials: ['AVB', 'High-proof alcohol (95%+)', 'Mason jar', 'Cheesecloth', 'Dropper bottle'],
    description: 'Soak AVB in high-proof alcohol for weeks, shaking daily. Strain and store in a dropper bottle. Place drops under the tongue for fast-acting, measured effects.',
    tips: ['Keep the jar in a cool, dark cupboard while soaking', 'Shake once daily for best extraction', 'Start with 5–10 drops and wait an hour', 'Use Everclear (95%) for maximum extraction'],
  },
  {
    name: 'Twaxing',
    difficulty: 'Easy',
    time: '2 min',
    materials: ['AVB', 'Fresh flower', 'Pipe, bong, or rolling papers'],
    description: 'Sprinkle AVB directly into a bowl with fresh flower, or inside a joint. A quick way to use up small amounts while adding potency.',
    tips: ['Mix thoroughly with fresh flower for an even burn', 'Use pungent flower to mask the stale AVB taste', 'Great for low-dose sessions — AVB is already partially decarbed'],
  },
  {
    name: 'Topical salve',
    difficulty: 'Medium',
    time: '2–3 hrs',
    materials: ['AVB', 'Coconut oil', 'Beeswax pellets', 'Double boiler', 'Cheesecloth', 'Small tins or jars'],
    description: 'Infuse AVB into coconut oil on low heat, strain it, then combine with melted beeswax. Apply directly to sore muscles or joints. No psychoactive effect.',
    tips: ['1:1 coconut oil to beeswax = firm salve texture', 'Add lavender or peppermint essential oil for scent', 'Infuse at 60–70°C for 2 hours — do not overheat'],
  },
  {
    name: 'Bath soak',
    difficulty: 'Easy',
    time: '5 min prep',
    materials: ['AVB', 'Epsom salts', 'Coconut oil or bath oil', 'Muslin bag', 'Essential oils (optional)'],
    description: 'Fill a muslin bag with AVB and Epsom salts, hang it under the hot tap as your bath fills. Heat pulls terpenes through the skin for topical relaxation.',
    tips: ['No psychoactive effect — purely topical', 'Squeeze the bag occasionally while soaking', 'Add lavender or eucalyptus essential oil'],
  },
]

const diffColor: Record<string, string> = { Easy: '#6aaa40', Medium: '#c08030', Advanced: '#e05555' }

export default function AVBGuide() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="AVB Guide" onBack={() => navigate('/guide')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {METHODS.map((m) => {
          const open = expanded === m.name
          return (
            <div key={m.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setExpanded(open ? null : m.name)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, textAlign: 'left' }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{m.name}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 11, color: diffColor[m.difficulty] }}>{m.difficulty}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.time}</span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: 18, marginLeft: 12, flexShrink: 0 }}>{open ? '−' : '+'}</span>
              </button>

              {open && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: '14px 0' }}>{m.description}</p>

                  <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>Materials</p>
                  <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.materials.map((mat) => <li key={mat} style={{ fontSize: 13, color: 'var(--text)' }}>{mat}</li>)}
                  </ul>

                  <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>Tips</p>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.tips.map((tip) => <li key={tip} style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
