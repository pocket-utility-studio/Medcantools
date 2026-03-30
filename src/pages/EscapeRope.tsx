import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const SOUNDS = [
  { id: 'rain',  label: 'Rain',   gain: 0.40 },
  { id: 'ocean', label: 'Ocean',  gain: 0.55 },
  { id: 'brown', label: 'Brown',  gain: 0.45 },
  { id: 'white', label: 'White',  gain: 0.22 },
  { id: 'tone',  label: '432Hz',  gain: 0.15 },
  { id: 'off',   label: 'Off',    gain: 0    },
]

function makeNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
  const size = 2 * ctx.sampleRate
  const buf = ctx.createBuffer(1, size, ctx.sampleRate)
  const d = buf.getChannelData(0)
  if (type === 'white') {
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1
  } else if (type === 'pink') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926
    }
  } else {
    let last = 0
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = Math.max(-1, Math.min(1, last * 3.5))
    }
  }
  return buf
}

function connectSound(id: string, ctx: AudioContext, out: GainNode): () => void {
  const loop = (buf: AudioBuffer) => {
    const src = ctx.createBufferSource()
    src.buffer = buf; src.loop = true; return src
  }
  if (id === 'rain') {
    const src = loop(makeNoiseBuffer(ctx, 'white'))
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.35
    src.connect(hp); hp.connect(bp); bp.connect(out); src.start()
    return () => { try { src.stop() } catch (_) {} }
  } else if (id === 'ocean') {
    const src = loop(makeNoiseBuffer(ctx, 'pink'))
    const wg = ctx.createGain(); wg.gain.value = 0.65
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.10; lfo.type = 'sine'
    const la = ctx.createGain(); la.gain.value = 0.28
    lfo.connect(la); la.connect(wg.gain)
    src.connect(wg); wg.connect(out); src.start(); lfo.start()
    return () => { try { src.stop(); lfo.stop() } catch (_) {} }
  } else if (id === 'brown') {
    const src = loop(makeNoiseBuffer(ctx, 'brown'))
    src.connect(out); src.start()
    return () => { try { src.stop() } catch (_) {} }
  } else if (id === 'white') {
    const src = loop(makeNoiseBuffer(ctx, 'white'))
    src.connect(out); src.start()
    return () => { try { src.stop() } catch (_) {} }
  } else if (id === 'tone') {
    const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator()
    o1.type = 'sine'; o2.type = 'sine'
    o1.frequency.value = 432; o2.frequency.value = 436
    const g = ctx.createGain(); g.gain.value = 0.5
    o1.connect(g); o2.connect(g); g.connect(out); o1.start(); o2.start()
    return () => { try { o1.stop(); o2.stop() } catch (_) {} }
  }
  return () => {}
}

function useAmbientSound(soundId: string) {
  useEffect(() => {
    if (soundId === 'off') return
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    let ctx: AudioContext
    try { ctx = new AC() } catch (_) { return }
    const targetGain = SOUNDS.find(s => s.id === soundId)?.gain ?? 0.3
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 2.0)
    master.connect(ctx.destination)
    const stop = connectSound(soundId, ctx, master)
    const ref = ctx
    return () => {
      stop()
      try {
        const now = ref.currentTime
        master.gain.cancelScheduledValues(now)
        master.gain.setValueAtTime(master.gain.value, now)
        master.gain.linearRampToValueAtTime(0, now + 0.8)
        setTimeout(() => { try { ref.close() } catch (_) {} }, 1200)
      } catch (_) {}
    }
  }, [soundId])
}

type BreathPhase = 'in' | 'hold-in' | 'out' | 'hold-out'
const PHASES: BreathPhase[] = ['in', 'hold-in', 'out', 'hold-out']
const PHASE_LABEL: Record<BreathPhase, string> = {
  in: 'Breathe in',
  'hold-in': 'Hold',
  out: 'Breathe out',
  'hold-out': 'Hold',
}

const TECHNIQUES = [
  { id: 'breath478',  label: '4-7-8 Breathing',     desc: 'Slow your heart rate fast with this nerve-calming pattern.' },
  { id: 'cold',       label: 'Cold water reset',     desc: 'Trigger the dive reflex with cold water on your face.' },
  { id: 'peppercorn', label: 'Peppercorn protocol',  desc: 'Chew 3 black peppercorns. Beta-caryophyllene may help.' },
  { id: 'cbd',        label: 'CBD dose',              desc: 'Pure CBD isolate can balance without adding more THC.' },
  { id: 'muscle',     label: 'Muscle release',        desc: 'Progressive tension and release to drain anxiety from the body.' },
  { id: 'humming',    label: 'Vagus nerve reset',     desc: 'Hum or sing for 2 minutes to activate your vagus nerve.' },
]

const TECHNIQUE_STEPS: Record<string, string[]> = {
  breath478:  ['Sit upright and close your eyes.', 'Inhale through your nose for 4 seconds.', 'Hold your breath for 7 seconds.', 'Exhale completely through your mouth for 8 seconds.', 'Repeat 3–4 times.', 'The extended exhale activates your parasympathetic nervous system.'],
  cold:       ['Go to a sink or basin.', 'Fill with the coldest water you can get.', 'Splash your face several times.', 'The mammalian dive reflex will slow your heart rate.'],
  peppercorn: ['Find 3 whole black peppercorns.', 'Chew them slowly.', 'Beta-caryophyllene binds to CB2 receptors.', 'Give it a few minutes to take effect.'],
  cbd:        ['Measure a dose of pure CBD isolate.', 'CBD is anxiolytic and non-intoxicating.', 'It will not increase the high.', 'Give it 15–20 minutes to work.'],
  muscle:     ['Clench your fists. Hold 5 seconds. Release.', 'Scrunch your shoulders to your ears. Hold. Release.', 'Tense your core. Hold. Release.', 'Tense your thighs and calves. Hold. Release.', 'Breathe deeply between each group.'],
  humming:    ['Sit or lie down comfortably.', 'Hum any note and feel the vibration in your chest.', 'Keep going for at least 2 minutes.', 'Or sing any song out loud.', 'This activates your vagus nerve and signals safety to your nervous system.'],
}

export default function EscapeRope() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [sound, setSound] = useState('off')
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('in')

  useAmbientSound(sound)

  useEffect(() => {
    let i = 0
    setBreathPhase(PHASES[0])
    const id = setInterval(() => {
      i = (i + 1) % 4
      setBreathPhase(PHASES[i])
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Calm Down" onBack={() => navigate('/guide')} />

      {/* Breathing box */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <style>{`
          @keyframes breathe {
            0%,100% { width: 80px; height: 80px; opacity: 0.4; }
            25%,50%  { width: 140px; height: 140px; opacity: 1; }
          }
          .breathe-box { animation: breathe 16s ease-in-out infinite; }
        `}</style>
        <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <div className="breathe-box" style={{ background: 'var(--accent-dim)', borderRadius: 12, border: '1px solid var(--accent)' }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent)', margin: '0 0 4px' }}>{PHASE_LABEL[breathPhase]}</p>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>4 seconds each phase</p>
      </div>

      {/* Sound selector */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Ambient sound
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SOUNDS.map((s) => {
            const active = sound === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSound(s.id)}
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
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Techniques */}
      <div>
        <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Grounding techniques
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TECHNIQUES.map((t) => {
            const open = selected === t.id
            return (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setSelected(open ? null : t.id)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 18, marginLeft: 12, flexShrink: 0 }}>{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <ol style={{ margin: '12px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {TECHNIQUE_STEPS[t.id].map((step, i) => (
                        <li key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
