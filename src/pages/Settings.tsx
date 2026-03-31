import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useStash } from '../context/StashContext'
import { loadCardOrder } from '../App'
import PageHeader from '../components/PageHeader'

const CARD_LABELS: Record<string, string> = {
  '/journal':   'The Stashbox',
  '/recommend': 'Ask the Cyber-Botanist',
  '/sessions':  'Field Notes',
  '/guide':     'Cheat Sheets',
}

type Feedback = 'idle' | 'saved' | 'loaded' | 'error'

export default function Settings() {
  const navigate = useNavigate()
  const { strains } = useStash()

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')
  const [cardOrder, setCardOrder] = useState<string[]>(loadCardOrder)

  function moveCard(index: number, dir: -1 | 1) {
    const next = [...cardOrder]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setCardOrder(next)
    localStorage.setItem('dg_card_order', JSON.stringify(next))
  }
  const [keySaved, setKeySaved] = useState(false)
  const [exportFb, setExportFb] = useState<Feedback>('idle')
  const [csvFb, setCsvFb] = useState<Feedback>('idle')
  const [importFb, setImportFb] = useState<Feedback>('idle')
  const [confirmClear, setConfirmClear] = useState(false)

  function saveKey() {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim())
    } else {
      localStorage.removeItem('gemini_api_key')
    }
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  function exportCSV() {
    const headers = ['name','type','thc','cbd','amount','terpenes','effects','notes','inStock','dateAdded']
    const rows = strains.map(s => headers.map(h => {
      const v = (s as Record<string, unknown>)[h]
      if (v == null) return ''
      const str = String(v)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str
    }).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dailygrind-stash-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setCsvFb('saved')
    setTimeout(() => setCsvFb('idle'), 2000)
  }

  function exportData() {
    const data = { strains, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dailygrind-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportFb('saved')
    setTimeout(() => setExportFb('idle'), 2000)
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.strains && Array.isArray(data.strains)) {
          localStorage.setItem('dailygrind_stash', JSON.stringify(data.strains))
          setImportFb('loaded')
          setTimeout(() => window.location.reload(), 1000)
        } else {
          setImportFb('error')
        }
      } catch {
        setImportFb('error')
      }
    }
    reader.readAsText(file)
  }

  function clearData() {
    localStorage.removeItem('dailygrind_stash')
    window.location.reload()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text)',
    fontSize: 14,
    padding: '13px 14px',
    outline: 'none',
    fontFamily: 'monospace',
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: "'Caveat', cursive",
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 12px',
    display: 'block',
  }

  const outlineBtn: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: 10,
    boxShadow: 'var(--shadow-sm)',
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 600,
    minHeight: 50,
    cursor: 'pointer',
    justifyContent: 'center',
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <PageHeader title="Settings" onBack={() => navigate('/')} />

      {/* API Key */}
      <section style={{ marginBottom: 32 }}>
        <span style={sectionLabel}>Gemini API key</span>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Required for AI recommendations and strain lookup. Get a free key at aistudio.google.com.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIza..."
          style={inputStyle}
        />
        <button
          onClick={saveKey}
          style={{
            marginTop: 10,
            width: '100%',
            background: keySaved ? 'var(--accent-dim)' : 'var(--accent)',
            border: `2px solid ${keySaved ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: keySaved ? 'none' : 'var(--shadow)',
            borderRadius: 10,
            color: keySaved ? 'var(--accent)' : '#fff',
            fontSize: 14,
            fontWeight: 700,
            minHeight: 50,
            cursor: 'pointer',
            justifyContent: 'center',
          }}
        >
          {keySaved ? 'Saved ✓' : 'Save key'}
        </button>
      </section>

      {/* Data */}
      <section style={{ marginBottom: 32 }}>
        <span style={sectionLabel}>Data</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={exportData}
            style={{
              ...outlineBtn,
              color: exportFb === 'saved' ? 'var(--accent)' : 'var(--text)',
              borderColor: exportFb === 'saved' ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {exportFb === 'saved' ? 'Exported ✓' : 'Export backup (JSON)'}
          </button>
          <button
            onClick={exportCSV}
            style={{
              ...outlineBtn,
              color: csvFb === 'saved' ? 'var(--accent)' : 'var(--text)',
              borderColor: csvFb === 'saved' ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {csvFb === 'saved' ? 'Exported ✓' : 'Export stash (CSV)'}
          </button>

          <label style={{
            ...outlineBtn,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: importFb === 'loaded' ? 'var(--accent)' : importFb === 'error' ? '#e05555' : 'var(--text)',
            borderColor: importFb === 'loaded' ? 'var(--accent)' : importFb === 'error' ? '#e05555' : 'var(--border)',
          }}>
            {importFb === 'loaded' ? 'Imported — reloading...' : importFb === 'error' ? 'Invalid file' : 'Import backup'}
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
        </div>
      </section>

      {/* Card order */}
      <section style={{ marginBottom: 32 }}>
        <span style={sectionLabel}>Card order</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cardOrder.map((to, i) => (
            <div key={to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)', border: '2px solid var(--border)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {CARD_LABELS[to]}
              </span>
              <button onClick={() => moveCard(i, -1)} disabled={i === 0} style={{
                background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer',
                color: i === 0 ? 'var(--text-dim)' : 'var(--text-muted)',
                minHeight: 'unset', padding: 4,
              }}>
                <ChevronUp size={16} strokeWidth={2} />
              </button>
              <button onClick={() => moveCard(i, 1)} disabled={i === cardOrder.length - 1} style={{
                background: 'none', border: 'none', cursor: i === cardOrder.length - 1 ? 'default' : 'pointer',
                color: i === cardOrder.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)',
                minHeight: 'unset', padding: 4,
              }}>
                <ChevronDown size={16} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '8px 0 0' }}>
          Changes take effect next time you open the app.
        </p>
      </section>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 32px' }}>
        Version {__APP_VERSION__}
      </p>

      {/* Danger zone */}
      <section>
        <span style={{ ...sectionLabel, color: '#c03333' }}>Danger zone</span>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            style={{ ...outlineBtn, color: 'var(--text-muted)', borderColor: 'var(--text-dim)' }}
          >
            Clear all data
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setConfirmClear(false)}
              style={{ flex: 1, background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, minHeight: 50, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={clearData}
              style={{
                flex: 1, background: '#e05555',
                border: '2px solid #c03333',
                boxShadow: '3px 3px 0 #c03333',
                borderRadius: 10, color: '#fff',
                fontSize: 14, fontWeight: 700, minHeight: 50, cursor: 'pointer',
              }}
            >
              Confirm clear
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
