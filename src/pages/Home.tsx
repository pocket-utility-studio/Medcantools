export default function Home() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>
        Canopy
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 32px' }}>
        Your cannabis companion
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Journal', desc: 'Log and review strains' },
          { label: 'Guide', desc: 'Temps, terpenes, methods' },
        ].map(({ label, desc }) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px',
          }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
