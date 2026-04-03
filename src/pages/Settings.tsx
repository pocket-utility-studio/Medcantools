import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useStash, readBackupMeta, restoreBackupToStorage, readFullBackup, restoreFullBackup } from '../context/StashContext'
import { clearImageDB } from '../services/imageStore'
import { loadCardOrder } from '../App'
import PageHeader from '../components/PageHeader'

function getLocalStorageUsageKB(): number {
  try {
    let total = 0
    for (const key of Object.keys(localStorage)) {
      total += (localStorage.getItem(key) ?? '').length * 2
    }
    return Math.round(total / 1024)
  } catch { return 0 }
}

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
  const [claudeKey, setClaudeKey] = useState(() => localStorage.getItem('claude_api_key') || '')
  const [claudeKeySaved, setClaudeKeySaved] = useState(false)
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
  const [backups] = useState(() => readBackupMeta())
  const [restoringBackup, setRestoringBackup] = useState<number | null>(null)
  const [fullBackup] = useState(() => readFullBackup())
  const [storageKB] = useState(() => getLocalStorageUsageKB())
  const storagePct = Math.min(100, Math.round((storageKB / 5120) * 100))

  function saveKey() {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim())
    } else {
      localStorage.removeItem('gemini_api_key')
    }
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  function saveClaudeKey() {
    if (claudeKey.trim()) {
      localStorage.setItem('claude_api_key', claudeKey.trim())
    } else {
      localStorage.removeItem('claude_api_key')
    }
    setClaudeKeySaved(true)
    setTimeout(() => setClaudeKeySaved(false), 2000)
  }

  function exportCSV() {
    const headers = ['name','type','thc','cbd','amount','terpenes','effects','notes','inStock','dateAdded']
    const rows = strains.map(s => headers.map(h => {
      const v = (s as unknown as Record<string, unknown>)[h]
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
    let sessions: unknown[] = []
    let savedRecs: unknown[] = []
    try { sessions  = JSON.parse(localStorage.getItem('dailygrind_sessions') || '[]') } catch { /* ignore */ }
    try { savedRecs = JSON.parse(localStorage.getItem('dg_saved_recs')       || '[]') } catch { /* ignore */ }
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      strains,
      sessions,
      savedRecs,
    }
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
    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string
        const parsed = JSON.parse(raw)
        // Accept either { strains: [...] } or a bare array
        const strains = Array.isArray(parsed) ? parsed : parsed?.strains
        if (Array.isArray(strains) && strains.length > 0) {
          localStorage.setItem('dailygrind_stash', JSON.stringify(strains))
          // Restore sessions and saved recs if present in the backup
          if (Array.isArray(parsed.sessions))  localStorage.setItem('dailygrind_sessions', JSON.stringify(parsed.sessions))
          if (Array.isArray(parsed.savedRecs))  localStorage.setItem('dg_saved_recs',       JSON.stringify(parsed.savedRecs))
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

  function restoreBackup(index: number) {
    setRestoringBackup(index)
    const restored = restoreBackupToStorage(index)
    if (restored) {
      setTimeout(() => window.location.reload(), 800)
    } else {
      setRestoringBackup(null)
    }
  }

  const [restoringFull, setRestoringFull] = useState(false)
  function restoreFull() {
    setRestoringFull(true)
    const ok = restoreFullBackup()
    if (ok) {
      setTimeout(() => window.location.reload(), 800)
    } else {
      setRestoringFull(false)
    }
  }

  function clearData() {
    localStorage.removeItem('dailygrind_stash')
    clearImageDB()
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

      {/* Claude API Key */}
      <section style={{ marginBottom: 32 }}>
        <span style={sectionLabel}>Claude API key</span>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Optional. Used to cross-check strain data accuracy against a second AI model (Claude Sonnet). Get a key at console.anthropic.com.
        </p>
        <input
          type="password"
          value={claudeKey}
          onChange={(e) => setClaudeKey(e.target.value)}
          placeholder="sk-ant-..."
          style={inputStyle}
        />
        <button
          onClick={saveClaudeKey}
          style={{
            marginTop: 10,
            width: '100%',
            background: claudeKeySaved ? 'var(--accent-dim)' : 'var(--accent)',
            border: `2px solid ${claudeKeySaved ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: claudeKeySaved ? 'none' : 'var(--shadow)',
            borderRadius: 10,
            color: claudeKeySaved ? 'var(--accent)' : '#fff',
            fontSize: 14,
            fontWeight: 700,
            minHeight: 50,
            cursor: 'pointer',
            justifyContent: 'center',
          }}
        >
          {claudeKeySaved ? 'Saved ✓' : 'Save key'}
        </button>
      </section>

      {/* Data */}
      <section style={{ marginBottom: 32 }}>
        <span style={sectionLabel}>Data</span>

        {/* Storage usage */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: storagePct >= 80 ? '#c05000' : 'var(--text-muted)' }}>
              Storage: {storageKB} KB / 5120 KB
            </span>
            <span style={{ fontSize: 12, color: storagePct >= 80 ? '#c05000' : 'var(--text-dim)' }}>
              {storagePct}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${storagePct}%`,
              background: storagePct >= 80 ? '#c05000' : 'var(--accent)',
              borderRadius: 3,
              transition: 'width 0.3s',
            }} />
          </div>
          {storagePct >= 80 && (
            <p style={{ fontSize: 12, color: '#c05000', margin: '6px 0 0', lineHeight: 1.4 }}>
              Storage is nearly full. Export a backup and consider clearing old data.
            </p>
          )}
        </div>

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

      {/* Auto-backups */}
      {(backups.length > 0 || fullBackup) && (
        <section style={{ marginBottom: 32 }}>
          <span style={sectionLabel}>Auto-backups</span>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
            The app saves snapshots automatically every 5 minutes and on close. Restore one if your data looks wrong.
          </p>

          {fullBackup && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--accent-dim)', border: '2px solid var(--accent)',
              borderRadius: 10, padding: '10px 14px', gap: 12, marginBottom: 8,
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Full backup</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {new Date(fullBackup.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {' at '}
                  {new Date(fullBackup.savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{fullBackup.strains.length} strains · sessions + saved recs included
                </p>
              </div>
              <button
                onClick={restoreFull}
                disabled={restoringFull}
                style={{
                  flexShrink: 0,
                  background: restoringFull ? 'var(--accent-dim)' : 'var(--accent)',
                  border: '2px solid var(--accent)',
                  borderRadius: 8,
                  color: restoringFull ? 'var(--accent)' : '#fff',
                  fontSize: 12, fontWeight: 600,
                  minHeight: 36, padding: '0 12px',
                  cursor: restoringFull ? 'default' : 'pointer',
                }}
              >
                {restoringFull ? 'Restoring...' : 'Restore all'}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {backups.map((bk) => {
              const label = bk.index === 0 ? 'Most recent' : bk.index === 1 ? '2nd most recent' : 'Oldest'
              const date = new Date(bk.savedAt)
              const timeStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                + ' at ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              const isRestoring = restoringBackup === bk.index
              return (
                <div key={bk.index} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface)', border: '2px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {timeStr} · {bk.strainCount} strain{bk.strainCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreBackup(bk.index)}
                    disabled={isRestoring}
                    style={{
                      flexShrink: 0,
                      background: isRestoring ? 'var(--accent-dim)' : 'var(--surface)',
                      border: `2px solid ${isRestoring ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 8,
                      color: isRestoring ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 600,
                      minHeight: 36, padding: '0 12px',
                      cursor: isRestoring ? 'default' : 'pointer',
                    }}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

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
