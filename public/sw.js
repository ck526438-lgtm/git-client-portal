/* Service worker du portail client.
 * - Pages : réseau d'abord, copie locale si la connexion tombe (le client relit
 *   la dernière version consultée dans le train ou en zone blanche).
 * - Fichiers /_next/static : immuables, servis depuis le cache.
 * - Rien n'est mis en cache pour /api/*.
 * - Le cache est vidé à chaque passage sur /login (déconnexion, poste partagé).
 */
const VERSION = 'portail-v1'
const PAGES = `${VERSION}-pages`
const ASSETS = `${VERSION}-assets`
const OFFLINE = '/hors-ligne.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(ASSETS).then((cache) => cache.addAll([OFFLINE, '/icons/192'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'vider-cache') {
    event.waitUntil(caches.delete(PAGES))
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(ASSETS).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  if (request.mode === 'navigate') {
    if (url.pathname === '/login') {
      event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)))
      return
    }
    event.respondWith(
      fetch(request)
        .then((response) => {
          // On ne garde que les vraies pages du portail (pas les redirections vers /login).
          if (response.ok && !response.redirected) {
            const copy = response.clone()
            caches.open(PAGES).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(OFFLINE))),
    )
  }
})
