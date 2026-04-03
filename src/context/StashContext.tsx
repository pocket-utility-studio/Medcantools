import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'

export interface StrainEntry {
  id: string
  name: string
  thc?: number
  cbd?: number
  type?: 'sativa' | 'indica' | 'hybrid'
  notes?: string
  imageDataUrl?: string
  budImageDataUrl?: string
  dateAdded: string
  inStock: boolean
  amount?: string
  terpenes?: string
  effects?: string
  history?: string
}

export interface BackupMeta {
  savedAt: string
  strainCount: number
  index: number
}

const STORAGE_KEY = 'dailygrind_stash'
const LEGACY_KEY  = 'canopy_stash'
const BACKUP_KEYS = ['dailygrind_bk_1', 'dailygrind_bk_2', 'dailygrind_bk_3'] as const
const BACKUP_INTERVAL_MS = 5 * 60 * 1000 // rotate backups at most every 5 minutes

const SEED_STRAINS: StrainEntry[] = [
  {
    id: '1',
    name: 'Blue Dream',
    thc: 21,
    cbd: 0.5,
    type: 'sativa',
    inStock: true,
    amount: '3.5g',
    dateAdded: '2026-01-15T10:00:00Z',
    notes: 'Uplifting and creative',
  },
  {
    id: '2',
    name: 'Northern Lights',
    thc: 18,
    cbd: 1,
    type: 'indica',
    inStock: true,
    amount: '2g',
    dateAdded: '2026-01-20T10:00:00Z',
    notes: 'Good for sleep',
  },
  {
    id: '3',
    name: 'Jack Herer',
    thc: 23,
    cbd: 0.3,
    type: 'sativa',
    inStock: false,
    amount: '0g',
    dateAdded: '2026-01-10T10:00:00Z',
    notes: 'Focused and clear',
  },
]

// ── Other storage keys backed up alongside strains ────────────────────────────

const FULL_BACKUP_KEY = 'dailygrind_full_backup'

export interface FullBackup {
  strains: StrainEntry[]
  sessions: unknown[]
  savedRecs: unknown[]
  savedAt: string
}

export function readFullBackup(): FullBackup | null {
  try {
    const raw = localStorage.getItem(FULL_BACKUP_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FullBackup
    if (Array.isArray(parsed.strains) && typeof parsed.savedAt === 'string') return parsed
  } catch { /* corrupt */ }
  return null
}

export function restoreFullBackup(): boolean {
  const bk = readFullBackup()
  if (!bk) return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bk.strains))
    if (Array.isArray(bk.sessions)) localStorage.setItem('dailygrind_sessions', JSON.stringify(bk.sessions))
    if (Array.isArray(bk.savedRecs)) localStorage.setItem('dg_saved_recs', JSON.stringify(bk.savedRecs))
    return true
  } catch { return false }
}

function writeFullBackup(strains: StrainEntry[]): void {
  try {
    const sessions = JSON.parse(localStorage.getItem('dailygrind_sessions') || '[]')
    const savedRecs = JSON.parse(localStorage.getItem('dg_saved_recs') || '[]')
    localStorage.setItem(FULL_BACKUP_KEY, JSON.stringify({
      strains,
      sessions,
      savedRecs,
      savedAt: new Date().toISOString(),
    }))
  } catch { /* storage full — skip */ }
}

// ── Serialisation helpers ──────────────────────────────────────────────────────

function parseStrains(raw: string): StrainEntry[] | null {
  try {
    const parsed = JSON.parse(raw)
    // Handle bare array or wrapped export format
    const arr = Array.isArray(parsed) ? parsed : parsed?.strains
    if (Array.isArray(arr) && arr.length > 0) return arr as StrainEntry[]
  } catch {
    // fall through
  }
  return null
}

// ── Backup helpers ─────────────────────────────────────────────────────────────

interface BackupEntry {
  strains: StrainEntry[]
  savedAt: string
}

function readBackup(key: string): BackupEntry | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BackupEntry
    if (Array.isArray(parsed.strains) && typeof parsed.savedAt === 'string') return parsed
  } catch {
    // corrupt
  }
  return null
}

function rotateBackups(strains: StrainEntry[]): void {
  // Check if last backup 1 is recent enough to skip rotation
  const bk1 = readBackup(BACKUP_KEYS[0])
  if (bk1 && Date.now() - new Date(bk1.savedAt).getTime() < BACKUP_INTERVAL_MS) return

  // Rotate: bk2→bk3, bk1→bk2, current primary→bk1
  const bk2 = localStorage.getItem(BACKUP_KEYS[1])
  if (bk2) {
    try { localStorage.setItem(BACKUP_KEYS[2], bk2) } catch { /* storage full */ }
  }
  if (bk1) {
    try { localStorage.setItem(BACKUP_KEYS[1], JSON.stringify(bk1)) } catch { /* storage full */ }
  }
  try {
    localStorage.setItem(BACKUP_KEYS[0], JSON.stringify({
      strains,
      savedAt: new Date().toISOString(),
    }))
  } catch {
    // storage full — skip this rotation silently
  }
}

export function readBackupMeta(): BackupMeta[] {
  return BACKUP_KEYS.map((key, index) => {
    const bk = readBackup(key)
    if (!bk) return null
    return { savedAt: bk.savedAt, strainCount: bk.strains.length, index }
  }).filter(Boolean) as BackupMeta[]
}

export function restoreBackupToStorage(index: number): StrainEntry[] | null {
  const bk = readBackup(BACKUP_KEYS[index])
  if (!bk) return null
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bk.strains))
  } catch {
    // ignore
  }
  return bk.strains
}

// ── Load / save ────────────────────────────────────────────────────────────────

function loadStrains(): { strains: StrainEntry[]; restoredFromBackup?: number } {
  // Try primary
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = parseStrains(raw)
      if (parsed) return { strains: parsed }
    }
  } catch { /* corrupt, fall through */ }

  // Try backups in order
  for (let i = 0; i < BACKUP_KEYS.length; i++) {
    const bk = readBackup(BACKUP_KEYS[i])
    if (bk) {
      // Silently restore primary from backup
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bk.strains)) } catch { /* ignore */ }
      return { strains: bk.strains, restoredFromBackup: i }
    }
  }

  // Legacy key migration
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = parseStrains(legacy)
      if (parsed) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)) } catch { /* ignore */ }
        try { localStorage.removeItem(LEGACY_KEY) } catch { /* ignore */ }
        return { strains: parsed }
      }
    }
  } catch { /* ignore */ }

  return { strains: SEED_STRAINS }
}

function savePrimary(strains: StrainEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strains))
  } catch {
    // ignore
  }
}

// ── Context ────────────────────────────────────────────────────────────────────

export interface StashContextValue {
  strains: StrainEntry[]
  addStrain: (entry: Omit<StrainEntry, 'id' | 'dateAdded'>) => void
  updateStrain: (id: string, updates: Partial<Omit<StrainEntry, 'id'>>) => void
  deleteStrain: (id: string) => void
  loading: boolean
  restoredFromBackup?: number
}

const StashContext = createContext<StashContextValue>({
  strains: [],
  addStrain: () => undefined,
  updateStrain: () => undefined,
  deleteStrain: () => undefined,
  loading: true,
})

export function StashProvider({ children }: { children: ReactNode }) {
  const [strains, setStrains] = useState<StrainEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [restoredFromBackup, setRestoredFromBackup] = useState<number | undefined>()
  const lastBackupRef = useRef<number>(0)

  useEffect(() => {
    const { strains: loaded, restoredFromBackup: idx } = loadStrains()
    setStrains(loaded)
    savePrimary(loaded)
    if (idx !== undefined) setRestoredFromBackup(idx)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    savePrimary(strains)
    // Rotate backups on a throttled basis
    const now = Date.now()
    if (now - lastBackupRef.current >= BACKUP_INTERVAL_MS) {
      rotateBackups(strains)
      writeFullBackup(strains)
      lastBackupRef.current = now
    }
  }, [strains, loading])

  // Force a backup on page unload so we always have a recent snapshot
  useEffect(() => {
    if (loading) return
    const handleUnload = () => {
      savePrimary(strains)
      // Strain-only rolling backup
      try {
        localStorage.setItem(BACKUP_KEYS[0], JSON.stringify({
          strains,
          savedAt: new Date().toISOString(),
        }))
      } catch { /* ignore */ }
      // Full backup (strains + sessions + saved recs)
      writeFullBackup(strains)
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload) // iOS Safari
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [strains, loading])

  const addStrain = useCallback((entry: Omit<StrainEntry, 'id' | 'dateAdded'>) => {
    setStrains((prev) => [
      ...prev,
      { ...entry, id: crypto.randomUUID(), dateAdded: new Date().toISOString() },
    ])
  }, [])

  const updateStrain = useCallback((id: string, updates: Partial<Omit<StrainEntry, 'id'>>) => {
    setStrains((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }, [])

  const deleteStrain = useCallback((id: string) => {
    setStrains((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return (
    <StashContext.Provider value={{ strains, addStrain, updateStrain, deleteStrain, loading, restoredFromBackup }}>
      {children}
    </StashContext.Provider>
  )
}

export function useStash(): StashContextValue {
  return useContext(StashContext)
}
