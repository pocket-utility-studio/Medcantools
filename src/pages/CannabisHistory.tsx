import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const DATE_FACTS: Record<string, string> = {
  '01-16': 'In 1997, researchers at Hebrew University identified the endocannabinoid 2-AG (2-arachidonoylglycerol), one of the primary natural ligands for cannabinoid receptors in the human body.',
  '02-08': 'In 1976, the US government established the Compassionate Investigational New Drug programme, which supplied federal cannabis cigarettes to a small number of patients with conditions including glaucoma and multiple sclerosis.',
  '03-22': 'In 2001, Canada became the first country in the world to adopt a national medical cannabis programme, establishing a federal framework for licensed production and patient access.',
  '04-01': 'The first documented clinical trial specifically investigating cannabidiol (CBD) for epilepsy was published in 1980 in the journal Pharmacology, reporting significant reductions in seizure frequency.',
  '04-20': 'The term 420 originates from a group of students at San Rafael High School, California, who met at 4:20 PM in 1971 to search for a rumoured abandoned cannabis crop.',
  '05-14': 'In 1986, the US DEA approved dronabinol (synthetic THC) as a Schedule II prescription drug for the treatment of nausea and vomiting associated with chemotherapy.',
  '06-02': 'In 2018, the FDA approved Epidiolex, the first plant-derived cannabidiol medicine, for the treatment of two rare and severe forms of epilepsy.',
  '06-19': 'In 2019, Illinois became the 11th US state to legalise recreational cannabis.',
  '07-04': 'Hemp was one of the first plants to be cultivated by humans, with evidence of fibre production in China dating back over 10,000 years.',
  '07-18': 'In 2018, Canada became the second country in the world — after Uruguay — to legalise recreational cannabis nationally.',
  '08-02': 'In 1937, the US Marihuana Tax Act was passed, effectively criminalising cannabis at a federal level for the first time.',
  '08-14': 'Dr. Raphael Mechoulam first isolated and synthesised THC in 1964 at the Hebrew University of Jerusalem, a breakthrough that launched modern cannabis science.',
  '09-01': 'In 2003, the US government was granted Patent 6,630,507 covering the use of cannabinoids as neuroprotectants — despite simultaneously classifying cannabis as having no accepted medical use.',
  '09-15': 'The terpene myrcene, found in high concentrations in many cannabis strains, is also present in hops, lemongrass, and thyme. It is associated with sedating, relaxing effects.',
  '10-01': 'In 1993, the CB2 receptor was discovered, primarily located in immune tissues. This opened research into cannabis compounds for inflammation and immune modulation.',
  '10-17': 'In 2018, Canada fully legalised recreational cannabis nationally — the first G7 nation to do so.',
  '11-02': 'The word "cannabis" derives from the ancient Greek "kannabis," which itself is thought to originate from a Scythian or Thracian root word.',
  '11-20': 'In 1988, the first cannabinoid receptor (CB1) was identified by Allyn Howlett and William Devane, revealing that the human brain contains a dedicated system for responding to cannabinoid compounds.',
  '12-04': 'In 1964, the UN Single Convention on Narcotic Drugs placed cannabis in Schedule IV. In 2020, the UN voted to remove it from Schedule IV, though it remains in Schedule I.',
  '12-20': 'In 2020, the US House of Representatives passed the MORE Act to federally decriminalise cannabis — it did not pass the Senate.',
}

type Fact = { text: string; category: string; color: string }

const TRIVIA: Fact[] = [
  { category: 'Science',  color: '#7060c0', text: 'THC and CBD are both derived from CBGa — the "mother cannabinoid" from which all major cannabinoids are synthesised.' },
  { category: 'Science',  color: '#7060c0', text: 'The endocannabinoid system was only discovered in 1988 when CB1 receptors were first identified.' },
  { category: 'Science',  color: '#7060c0', text: 'THCA is non-psychoactive until decarboxylated by heat above approximately 105°C — raw cannabis will not get you high.' },
  { category: 'Science',  color: '#7060c0', text: 'Caryophyllene is unique: the only terpene that also acts as a cannabinoid, binding directly to CB2 receptors.' },
  { category: 'Science',  color: '#7060c0', text: 'The entourage effect proposes that cannabinoids and terpenes work synergistically — whole-plant extracts typically outperform isolated compounds.' },
  { category: 'Science',  color: '#7060c0', text: 'Terpenes evaporate at lower temperatures than cannabinoids. The first vapour below 160°C is mostly terpenes, not THC.' },
  { category: 'Science',  color: '#7060c0', text: 'Cannabis flavonoids called cannflavins A and B are approximately 30 times more potent than aspirin as anti-inflammatory agents in lab studies.' },
  { category: 'Science',  color: '#7060c0', text: 'Linalool activates GABA receptors — the same receptors targeted by benzodiazepines — potentially explaining its anxiolytic effects.' },
  { category: 'Science',  color: '#7060c0', text: 'CBN forms as THC oxidises over time. Aged, air-exposed cannabis has significantly higher CBN and lower THC.' },
  { category: 'History',  color: '#b06020', text: 'Cannabis cultivation evidence dates back over 10,000 years in China — the oldest known woven hemp textile was found there.' },
  { category: 'History',  color: '#b06020', text: "The Pen-ts'ao Ching (2700 BCE), attributed to Emperor Shen Nong, is the first written record of cannabis as medicine." },
  { category: 'History',  color: '#b06020', text: "In 1839, William B. O'Shaughnessy introduced cannabis to Western medicine via his landmark paper on its use in tetanus and convulsions." },
  { category: 'History',  color: '#b06020', text: 'The 1937 US Marihuana Tax Act was largely driven by a lobbying campaign connected to newspaper magnate William Randolph Hearst.' },
  { category: 'History',  color: '#b06020', text: 'Uruguay became the first country to fully legalise recreational cannabis in 2013 under President José Mujica.' },
  { category: 'History',  color: '#b06020', text: 'In 1996, California passed Proposition 215 — the first US state medical cannabis law.' },
  { category: 'Culture',  color: '#3b7651', text: 'The term "420" traces to a group of San Rafael High School students who met at 4:20 PM in 1971 to search for an abandoned cannabis crop.' },
  { category: 'Culture',  color: '#3b7651', text: 'Bob Marley was buried with a Bible, a guitar, and a bud of cannabis.' },
  { category: 'Culture',  color: '#3b7651', text: 'Carl Sagan wrote essays under the pseudonym "Mr X" describing his cannabis use and its role in inspiring his scientific thinking.' },
  { category: 'Culture',  color: '#3b7651', text: "The word 'assassin' may derive from 'hashishin' — members of an 11th century Persian sect allegedly rewarded with hashish." },
  { category: 'Culture',  color: '#3b7651', text: 'Cannabis was listed in the United States Pharmacopeia as a recognised medicine from 1850 to 1942.' },
  { category: 'Law',      color: '#2070a0', text: 'In 2003, the US held Patent 6,630,507 covering cannabinoids as neuroprotectants while simultaneously classifying cannabis as Schedule I with no accepted medical use.' },
  { category: 'Law',      color: '#2070a0', text: "The Netherlands' cannabis tolerance policy has been in place since the 1970s — cannabis is illegal but prosecution is formally deprioritised." },
  { category: 'Law',      color: '#2070a0', text: "Spain's cannabis social clubs operate under constitutional rights of privacy — not explicit legislation — creating regional legal fragmentation." },
  { category: 'Law',      color: '#2070a0', text: 'Malta became the first EU member state to legalise personal cannabis use and home cultivation in 2021.' },
  { category: 'Botany',   color: '#3b7651', text: 'Cannabis is dioecious — it produces separate male and female plants. Only unfertilised females produce resin-rich flowers.' },
  { category: 'Botany',   color: '#3b7651', text: 'Hemp and cannabis are the same species (Cannabis sativa L.) — distinguished legally by THC content, not by biology.' },
  { category: 'Botany',   color: '#3b7651', text: 'Trichomes — the crystal-like structures on cannabis flowers — are the primary site of cannabinoid and terpene production.' },
  { category: 'Botany',   color: '#3b7651', text: 'The ruderalis subspecies is autoflowering — it flowers based on age rather than light cycle — enabling faster grows at northern latitudes.' },
  { category: 'Cannabinoids', color: '#2070a0', text: 'There are over 140 known cannabinoids in cannabis. CBG, CBC, CBN, and THCV each have distinct properties beyond THC and CBD.' },
  { category: 'Cannabinoids', color: '#2070a0', text: 'CBG (cannabigerol) is the precursor cannabinoid — all major cannabinoids derive from CBGA through enzymatic conversion in the plant.' },
  { category: 'Cannabinoids', color: '#2070a0', text: 'THCV may suppress appetite at low doses rather than stimulate it — the opposite of what THC does.' },
  { category: 'Cannabinoids', color: '#2070a0', text: 'CBG has shown antibacterial activity against MRSA strains in preliminary lab studies.' },
]

function getTodayKey(): string {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function CannabisHistory() {
  const navigate = useNavigate()
  const [triviaIndex, setTriviaIndex] = useState(() => Math.floor(Math.random() * TRIVIA.length))

  const todayKey = getTodayKey()
  const dateFact = DATE_FACTS[todayKey]
  const trivia = TRIVIA[triviaIndex]

  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Cannabis History" onBack={() => navigate('/guide')} />

      {/* On This Day */}
      {dateFact && (
        <div style={{
          background: 'var(--accent-dim)',
          border: '2px solid var(--accent)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            On this day — {todayDate}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{dateFact}</p>
        </div>
      )}

      {/* Trivia card */}
      <div style={{
        background: 'var(--surface)',
        border: `2px solid ${trivia.color}`,
        borderRadius: 12,
        boxShadow: `2px 2px 0 ${trivia.color}55`,
        padding: '14px 16px',
        marginBottom: 12,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: trivia.color, marginBottom: 8,
        }}>
          {trivia.category}
        </div>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          {trivia.text}
        </p>
      </div>

      <button
        onClick={() => setTriviaIndex(i => (i + 1) % TRIVIA.length)}
        style={{
          width: '100%',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--text)',
          fontSize: 14, fontWeight: 600,
          minHeight: 50, cursor: 'pointer',
          marginBottom: 32,
        }}
      >
        Next fact →
      </button>

      {/* All trivia list */}
      <span style={{
        fontFamily: "'Caveat', cursive",
        fontSize: 20, fontWeight: 700, color: 'var(--text)',
        display: 'block', marginBottom: 12,
      }}>
        All facts
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TRIVIA.map((f, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${f.color}`,
            borderRadius: 8,
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {f.category}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
