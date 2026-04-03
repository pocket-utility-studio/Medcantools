import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { getImage, setImage, deleteImages, strainImageKey } from '../services/imageStore'

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImages(bk.strains)))
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
      strains: stripImages(strains),
      sessions,
      savedRecs,
      savedAt: new Date().toISOString(),
    }))
  } catch { /* storage full — skip */ }
}

// ── Image helpers ─────────────────────────────────────────────────────────────

function stripImages(strains: StrainEntry[]): StrainEntry[] {
  return strains.map(({ imageDataUrl: _i, budImageDataUrl: _b, ...rest }) => rest)
}

async function hydrateImages(strains: StrainEntry[]): Promise<StrainEntry[]> {
  return Promise.all(strains.map(async (s) => {
    const [packaging, bud] = await Promise.all([
      getImage(strainImageKey(s.id, 'packaging')),
      getImage(strainImageKey(s.id, 'bud')),
    ])
    if (!packaging && !bud) return s
    return { ...s, imageDataUrl: packaging, budImageDataUrl: bud }
  }))
}

// ── Serialisation helpers ──────────────────────────────────────────────────────

function parseStrains(raw: string): StrainEntry[] | null {
  try {
    const parsed = JSON.parse(raw)
    // Handle bare array or wrapped export format
    const arr = Array.isArray(parsed) ? parsed : parsed?.strains
    if (Array.isArray(arr)) return arr as StrainEntry[]
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
      strains: stripImages(strains),
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImages(bk.strains)))
  } catch {
    // ignore
  }
  return bk.strains
}

// ── Load / save ────────────────────────────────────────────────────────────────

interface LoadResult {
  strains: StrainEntry[]
  imagesToMigrate: Array<{ id: string; packaging?: string; bud?: string }>
  restoredFromBackup?: number
}

function loadStrains(): LoadResult {
  const migrate = (strains: StrainEntry[]) => {
    const imagesToMigrate: Array<{ id: string; packaging?: string; bud?: string }> = []
    const stripped = strains.map((s) => {
      if (s.imageDataUrl || s.budImageDataUrl) {
        imagesToMigrate.push({ id: s.id, packaging: s.imageDataUrl, bud: s.budImageDataUrl })
      }
      return { ...s, imageDataUrl: undefined, budImageDataUrl: undefined }
    })
    return { stripped, imagesToMigrate }
  }

  // Try primary
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = parseStrains(raw)
      if (parsed !== null) {
        const { stripped, imagesToMigrate } = migrate(parsed)
        return { strains: stripped, imagesToMigrate }
      }
    }
  } catch { /* corrupt, fall through */ }

  // Try backups in order
  for (let i = 0; i < BACKUP_KEYS.length; i++) {
    const bk = readBackup(BACKUP_KEYS[i])
    if (bk) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImages(bk.strains))) } catch { /* ignore */ }
      const { stripped, imagesToMigrate } = migrate(bk.strains)
      return { strains: stripped, imagesToMigrate, restoredFromBackup: i }
    }
  }

  // Legacy key migration
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = parseStrains(legacy)
      if (parsed !== null) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImages(parsed))) } catch { /* ignore */ }
        try { localStorage.removeItem(LEGACY_KEY) } catch { /* ignore */ }
        const { stripped, imagesToMigrate } = migrate(parsed)
        return { strains: stripped, imagesToMigrate }
      }
    }
  } catch { /* ignore */ }

  return { strains: [], imagesToMigrate: [] }
}

function savePrimary(strains: StrainEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImages(strains)))
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
    const { strains: loaded, imagesToMigrate, restoredFromBackup: idx } = loadStrains()
    setStrains(loaded)
    savePrimary(loaded)
    if (idx !== undefined) setRestoredFromBackup(idx)
    setLoading(false)

    // Migrate any images still embedded in localStorage → IndexedDB
    if (imagesToMigrate.length > 0) {
      Promise.all(imagesToMigrate.map(async ({ id, packaging, bud }) => {
        if (packaging) await setImage(strainImageKey(id, 'packaging'), packaging)
        if (bud) await setImage(strainImageKey(id, 'bud'), bud)
      })).catch(() => {})
    }

    // Hydrate images from IndexedDB into state
    hydrateImages(loaded).then(setStrains).catch(() => {})
  }, [])

  useEffect(() => {
    if (loading) return
    savePrimary(strains)
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
      try {
        localStorage.setItem(BACKUP_KEYS[0], JSON.stringify({
          strains: stripImages(strains),
          savedAt: new Date().toISOString(),
        }))
      } catch { /* ignore */ }
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
    const id = crypto.randomUUID()
    const { imageDataUrl, budImageDataUrl, ...rest } = entry
    if (imageDataUrl) setImage(strainImageKey(id, 'packaging'), imageDataUrl).catch(() => {})
    if (budImageDataUrl) setImage(strainImageKey(id, 'bud'), budImageDataUrl).catch(() => {})
    setStrains((prev) => [
      ...prev,
      { ...rest, imageDataUrl, budImageDataUrl, id, dateAdded: new Date().toISOString() },
    ])
  }, [])

  const updateStrain = useCallback((id: string, updates: Partial<Omit<StrainEntry, 'id'>>) => {
    if ('imageDataUrl' in updates) {
      if (updates.imageDataUrl) {
        setImage(strainImageKey(id, 'packaging'), updates.imageDataUrl).catch(() => {})
      } else {
        deleteImages([strainImageKey(id, 'packaging')]).catch(() => {})
      }
    }
    if ('budImageDataUrl' in updates) {
      if (updates.budImageDataUrl) {
        setImage(strainImageKey(id, 'bud'), updates.budImageDataUrl).catch(() => {})
      } else {
        deleteImages([strainImageKey(id, 'bud')]).catch(() => {})
      }
    }
    setStrains((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }, [])

  const deleteStrain = useCallback((id: string) => {
    deleteImages([strainImageKey(id, 'packaging'), strainImageKey(id, 'bud')]).catch(() => {})
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
