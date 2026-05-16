const CACHE_NAME = 'nexus-ai-v3.6.0';
const ASSETS = ['/', '/index.html', '/style.css', '/script.js', '/manifest.json', '/logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Ultra-stable Network-First Strategy
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
