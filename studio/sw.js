// ABOUTME: Studio service worker — keeps pieces playable offline. Audio and
// ABOUTME: analysis files are cache-first (big, immutable per piece);
// ABOUTME: everything else is network-first with cache fallback, so dev
// ABOUTME: edits stay fresh while the page survives losing the network.

const CACHE = 'vjay-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Piece media: /api/pieces/<slug>/file/<name> (audio.mp3 etc.) + analysis.
const CACHE_FIRST = /\/api\/pieces\/[^/]+\/file\/|\.mp3$|\.analysis\.json$/;

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (CACHE_FIRST.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(req);
      // never cache partial (206) responses — the media element accepts a
      // full 200 from cache for any later range request
      if (res.ok && res.status === 200) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok && res.status === 200) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
