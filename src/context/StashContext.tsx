import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  dateAdded: string
  inStock: boolean
  amount?: string
  terpenes?: string
  effects?: string
}

const STORAGE_KEY = 'canopy_stash'

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

function loadStrains(): StrainEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StrainEntry[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return SEED_STRAINS
}

function saveStrains(strains: StrainEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strains))
  } catch {
    // ignore
  }
}

export interface StashContextValue {
  strains: StrainEntry[]
  addStrain: (entry: Omit<StrainEntry, 'id' | 'dateAdded'>) => void
  updateStrain: (id: string, updates: Partial<Omit<StrainEntry, 'id'>>) => void
  deleteStrain: (id: string) => void
  loading: boolean
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

  useEffect(() => {
    const loaded = loadStrains()
    setStrains(loaded)
    saveStrains(loaded)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) saveStrains(strains)
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
    <StashContext.Provider value={{ strains, addStrain, updateStrain, deleteStrain, loading }}>
      {children}
    </StashContext.Provider>
  )
}

export function useStash(): StashContextValue {
  return useContext(StashContext)
}
