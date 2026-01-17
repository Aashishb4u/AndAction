const CACHE_VERSION = 'andaction-v3';

// Install - skip waiting to activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate - cleanup any old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - No caching, always network only
// If offline, requests will fail naturally (like YouTube)
self.addEventListener('fetch', (event) => {
    // Always fetch from network, no cache fallback
    event.respondWith(fetch(event.request));
});
