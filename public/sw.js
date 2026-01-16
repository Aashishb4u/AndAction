const CACHE_VERSION = 'andaction-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Only cache static assets, not pages or API calls
const STATIC_ASSETS = [
    '/manifest.json',
    '/logo.png',
];

// Install - cache only static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => !name.startsWith(CACHE_VERSION))
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - Network first strategy with selective caching
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip caching for:
    // 1. API routes
    // 2. Authentication routes
    // 3. Server-side rendered pages
    // 4. POST/PUT/DELETE requests
    const shouldSkipCache =
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/auth/') ||
        url.pathname.startsWith('/_next/') ||
        request.method !== 'GET';

    if (shouldSkipCache) {
        // Always fetch from network for API and auth
        event.respondWith(fetch(request));
        return;
    }

    // For static assets: Cache first, then network
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)) {
        event.respondWith(
            caches.match(request)
                .then((cached) => cached || fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(STATIC_CACHE).then((cache) => {
                                cache.put(request, clone);
                            });
                        }
                        return response;
                    })
                )
        );
        return;
    }

    // For everything else: Network first, no caching
    event.respondWith(
        fetch(request).catch(() => {
            // Only return cached version for offline fallback
            return caches.match('/manifest.json'); // Basic offline indicator
        })
    );
});
