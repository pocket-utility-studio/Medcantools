import { useState } from 'react'
import { BookOpen, Sparkles, ClipboardList, Compass, X } from 'lucide-react'

const STEPS = [
  {
    icon: '🌿',
    title: 'Welcome to Daily Grind',
    body: 'Your minimalist cannabis companion. Track strains, log sessions, and get AI-powered recommendations — all stored privately on your device.',
  },
  {
    Icon: BookOpen,
    color: 'var(--icon-stash)',
    bg: 'var(--icon-stash-bg)',
    title: 'The Stashbox',
    body: 'Add strains to your stash manually, scan a product label with your camera, or search by name and let AI fill in the details.',
  },
  {
    Icon: Sparkles,
    color: 'var(--icon-ai)',
    bg: 'var(--icon-ai-bg)',
    title: 'Ask the Cyber-Botanist',
    body: 'Tell it how you want to feel. It reads your stash and recommends the best match based on the time of day and symptom severity.',
  },
  {
    Icon: ClipboardList,
    color: 'var(--icon-notes)',
    bg: 'var(--icon-notes-bg)',
    title: 'Field Notes',
    body: 'Log each session — which strain, what temp, how you felt before and after. Builds up a picture of what works for you.',
  },
  {
    Icon: Compass,
    color: 'var(--icon-guide)',
    bg: 'var(--icon-guide-bg)',
    title: 'Cheat Sheets',
    body: 'Quick reference guides for vape temperatures, AVB recipes, the calm-down toolkit, and legal notes. Tap the terpene card for today\'s featured terpene.',
  },
]

interface Props {
  onDone: () => void
}

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  function advance() {
    if (isLast) { onDone(); return }
    setStep(step + 1)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '2px solid var(--border)',
        borderRadius: 16,
        boxShadow: '4px 4px 0 var(--border)',
        padding: '28px 24px 24px',
        maxWidth: 340,
        width: '100%',
        position: 'relative',
      }}>
        {/* Skip */}
        <button
          onClick={onDone}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none',
            color: 'var(--text-dim)', cursor: 'pointer',
            minHeight: 'unset', padding: 4,
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Icon */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          {'Icon' in s && s.Icon ? (
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              border: `2px solid ${s.color}`,
              background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
            }}>
              <s.Icon size={26} color={s.color} strokeWidth={2} />
            </div>
          ) : (
            <div style={{ fontSize: 40, lineHeight: 1 }}>{(s as { icon: string }).icon}</div>
          )}
        </div>

        {/* Text */}
        <h2 style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 24, fontWeight: 700,
          color: 'var(--text)', margin: '0 0 10px',
          textAlign: 'center',
        }}>
          {s.title}
        </h2>
        <p style={{
          fontSize: 14, color: 'var(--text-muted)',
          lineHeight: 1.6, margin: '0 0 24px',
          textAlign: 'center',
        }}>
          {s.body}
        </p>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 6,
              height: 6, borderRadius: 3,
              background: i === step ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'width 0.2s ease, background 0.2s ease',
            }} />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={advance}
          style={{
            width: '100%',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 15, fontWeight: 700,
            minHeight: 50,
            cursor: 'pointer',
          }}
        >
          {isLast ? "Let's go" : 'Next'}
        </button>
      </div>
    </div>
  )
}
