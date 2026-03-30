import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

type Tab = 'uk' | 'es'

const UK_SECTIONS = [
  { title: 'The 2018 law change', accent: '#6aaa40', text: 'On 1 November 2018, the UK government rescheduled cannabis-based medicinal products from Schedule 1 to Schedule 2 of the Misuse of Drugs Regulations 2001. Specialist clinicians on the GMC register can now prescribe cannabis-based products for medicinal use (CBPMs).' },
  { title: 'Keep original packaging', accent: '#6aaa40', text: 'Your medication must remain in the original pharmacy-dispensed packaging with the dispensary label intact. This label is your proof of lawful possession. Decanting removes legal protection.' },
  { title: 'Vaporizing vs smoking', accent: '#c08030', text: 'Vaporizing is the accepted inhalation method under a CBPM prescription. Smoking — combustion with tobacco or alone — is not covered by your prescription and remains illegal in all circumstances.' },
  { title: 'Driving & road law', accent: '#c08030', text: 'Section 5A of the Road Traffic Act 1988 sets a drug drive limit of 2μg/L blood for THC. A valid prescription is a statutory medical defence. Carry your prescription when driving. You must still not drive if impaired.' },
  { title: 'Public possession', accent: '#c08030', text: 'You may carry your prescribed cannabis in public in its original packaging. If stopped by police, present your prescription. Officers may not recognise CBPMs — remain calm. Carry a printed copy of your prescription.' },
  { title: 'International travel', accent: '#c08030', text: 'Travel with prescribed cannabis is possible, but rules are country-by-country. Always carry original pharmacy packaging and your prescription. Some countries require advance permission — check with the destination embassy before travel.' },
  { title: 'Recreational use', accent: '#e05555', text: 'Recreational cannabis remains illegal in the UK. Cannabis is Class B under the Misuse of Drugs Act 1971. Possession without a prescription: up to 5 years. Supply or intent to supply: up to 14 years.' },
  { title: 'CBD products', accent: '#6aaa40', text: 'CBD products with less than 0.2% THC are legal to buy and sell in the UK as food supplements, provided they do not make medical claims. Always buy from reputable suppliers with third-party lab results.' },
]

const POLICE_STEPS = [
  { label: 'Stay calm', text: 'Do not argue, raise your voice, or walk away. Keep hands visible. Composure protects you more than confrontation.' },
  { label: 'Know your rights', text: 'Police can search you under Section 23 of the Misuse of Drugs Act if they suspect possession. Ask: "Am I being detained, or am I free to go?" Note the officer\'s name and badge number.' },
  { label: 'Show your prescription', text: 'Present your prescription and original pharmacy packaging. Explain it is a legally prescribed CBPM under Schedule 2 of the Misuse of Drugs Regulations 2001.' },
  { label: 'Right to silence', text: 'You do not have to answer questions beyond confirming identity when required. Say: "I am exercising my right to remain silent and would like to speak to a solicitor."' },
  { label: 'If arrested', text: 'You have the right to free legal advice. Ask for a duty solicitor immediately — this is your right under PACE 1984. Do not sign anything without a solicitor present.' },
  { label: 'After the stop', text: 'Write down everything as soon as possible: officer names, badge numbers, time, location, what was said. If medication was seized unlawfully, you can complain to the IOPC.' },
]

const ES_SECTIONS = [
  { title: 'Private use', accent: '#6aaa40', text: 'Personal cultivation of a small number of plants at home is generally tolerated. Cannabis clubs operate in a legal gray area — privately organised, membership-based, and not formally regulated nationally.' },
  { title: 'Public use', accent: '#c08030', text: 'Consuming or possessing cannabis in public spaces is a sanctionable civil offense under the Public Safety Law (Ley Mordaza). Administrative fines apply. It is not a criminal matter.' },
  { title: 'Cannabis clubs', accent: '#6aaa40', text: 'Private, member-only associations that collectively cultivate and distribute among members. Tolerated in some regions but not formally regulated at national level.' },
  { title: 'Trafficking', accent: '#e05555', text: 'Supply or sale of cannabis is a criminal offense under Article 368 of the Penal Code. This applies regardless of quantity and carries custodial sentences.' },
]

export default function LawGuide() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('uk')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [policeOpen, setPoliceOpen] = useState(false)

  const sections = tab === 'uk' ? UK_SECTIONS : ES_SECTIONS

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Law Guide" onBack={() => navigate('/guide')} />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['uk', 'es'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpanded(null) }}
            style={{
              flex: 1, background: tab === t ? 'var(--accent-dim)' : 'var(--surface)',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6, color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 14, fontWeight: tab === t ? 600 : 400, minHeight: 44, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            {t === 'uk' ? 'United Kingdom' : 'Spain'}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {sections.map((s) => {
          const open = expanded === s.title
          return (
            <div key={s.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${s.accent}`, borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setExpanded(open ? null : s.title)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{s.title}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 18, marginLeft: 12, flexShrink: 0 }}>{open ? '−' : '+'}</span>
              </button>
              {open && (
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0, padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                  {s.text}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* If stopped — UK only */}
      {tab === 'uk' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid #c08030', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setPoliceOpen(!policeOpen)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, textAlign: 'left' }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>If stopped by police</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 18, marginLeft: 12 }}>{policeOpen ? '−' : '+'}</span>
          </button>
          {policeOpen && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              {POLICE_STEPS.map((step, i) => (
                <div key={step.label} style={{ paddingTop: 14, paddingBottom: i < POLICE_STEPS.length - 1 ? 14 : 0, borderBottom: i < POLICE_STEPS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.label}</p>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{step.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
