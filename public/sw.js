const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev'
const CACHE = `dailygrind-${VERSION}`

const APP_SHELL = [
  '/Medcantools/',
  '/Medcantools/index.html',
  '/Medcantools/manifest.json',
  '/Medcantools/icon.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return
  // Skip cross-origin requests (Gemini API etc)
  if (!e.request.url.startsWith(self.location.origin)) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        // Cache successful HTML/JS/CSS/image responses
        if (response.ok && ['text/html', 'text/css', 'application/javascript', 'image/'].some(t => response.headers.get('content-type')?.includes(t) || response.url.match(/\.(js|css|png|jpg|svg|woff2?)$/))) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return response
      }).catch(() => {
        // Offline fallback: serve the app shell
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/Medcantools/')
        }
      })
    })
  )
})
