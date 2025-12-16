
// sw.js - FORCE CLEANUP VERSION

const CACHE_NAME = 'nawaya-cache-v-cleanup';

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete all caches immediately
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log('Deleting cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
        return self.clients.claim();
    })
  );
});

// Pass through all fetch requests (no caching)
self.addEventListener('fetch', (event) => {
  return;
});
