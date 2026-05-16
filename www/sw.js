// Nexus AI Ultra - Production Service Worker v3.0
// Handles offline caching, PWA install, and asset management

const CACHE_NAME = 'nexus-ai-v3.5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/sw.js'
];

// ─── INSTALL: Pre-cache all static assets ───────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Nexus SW] Pre-caching assets...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ─── ACTIVATE: Clean up old caches ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Nexus SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH: Cache-first for assets, Network-first for API ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls (Pollinations) → Network only (no cache)
  if (url.hostname.includes('pollinations.ai')) {
    return event.respondWith(fetch(event.request));
  }

  // External fonts/CDN → Network first, fallback to cache
  if (url.hostname.includes('fonts.googleapis') ||
      url.hostname.includes('cdnjs.cloudflare') ||
      url.hostname.includes('cdn.jsdelivr')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell → Cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
