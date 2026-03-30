import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  onBack: () => void
  right?: React.ReactNode
}

export default function PageHeader({ title, onBack, right }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: '2px solid var(--border)',
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          padding: 0,
          minHeight: 44,
          minWidth: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginLeft: -6,
        }}
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>

      <h2 style={{
        fontFamily: "'Caveat', cursive",
        fontSize: 24,
        fontWeight: 700,
        margin: 0,
        color: 'var(--text)',
        flex: 1,
        textAlign: 'center',
      }}>
        {title}
      </h2>

      <div style={{ minWidth: 40, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {right ?? null}
      </div>
    </div>
  )
}
