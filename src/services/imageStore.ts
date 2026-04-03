const DB_NAME = 'dailygrind-images'
const STORE = 'images'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getImage(key: string): Promise<string | undefined> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result as string | undefined)
      req.onerror = () => resolve(undefined)
    })
  } catch { return undefined }
}

export async function setImage(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(dataUrl, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

export async function deleteImage(key: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { /* ignore */ }
}

export async function deleteImages(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      keys.forEach(k => store.delete(k))
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { /* ignore */ }
}

export function clearImageDB(): void {
  try { indexedDB.deleteDatabase(DB_NAME) } catch { /* ignore */ }
}

export function strainImageKey(id: string, slot: 'packaging' | 'bud'): string {
  return `strain_${id}_${slot}`
}

export function sessionImageKey(id: string): string {
  return `session_${id}`
}
