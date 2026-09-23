/*
 * RIMIFY service worker.
 *
 * It caches exactly three kinds of thing: the built, content-hashed assets under /build/assets,
 * the self-hosted fonts, and the images. It never caches HTML and never an Inertia JSON response:
 * a page about legal approvals must always be the page the server sent. When a navigation fails
 * because there is no network, the offline page answers instead.
 *
 * Bump CACHE_VERSION to drop everything an older worker kept.
 */

const CACHE_VERSION = 'rmf-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const IMAGE_CACHE = `${CACHE_VERSION}-images`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png']
const IMAGE_LIMIT = 120

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    )
})

function isStaticAsset(url) {
    return url.pathname.startsWith('/build/assets/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')
}

function isImage(url) {
    return url.pathname.startsWith('/images/')
}

/* Hashed assets and fonts never change under their URL: cache first, network once. */
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE)
    const hit = await cache.match(request)

    if (hit) {
        return hit
    }

    const response = await fetch(request)

    if (response.ok) {
        await cache.put(request, response.clone())
    }

    return response
}

/* Images: what is cached answers at once, the network refreshes it for next time. */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(IMAGE_CACHE)
    const hit = await cache.match(request)
    const refresh = fetch(request)
        .then(async (response) => {
            if (response.ok) {
                await cache.put(request, response.clone())
                await trim(cache, IMAGE_LIMIT)
            }

            return response
        })
        .catch(() => undefined)

    return hit ?? (await refresh) ?? Response.error()
}

async function trim(cache, limit) {
    const keys = await cache.keys()

    if (keys.length <= limit) {
        return
    }

    await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)))
}

self.addEventListener('fetch', (event) => {
    const { request } = event

    if (request.method !== 'GET') {
        return
    }

    const url = new URL(request.url)

    if (url.origin !== self.location.origin) {
        return
    }

    // A page load: straight to the network; the offline page only when the network is gone.
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))

        return
    }

    // Inertia and API responses are never touched.
    if (request.headers.get('X-Inertia') || url.pathname.startsWith('/api/')) {
        return
    }

    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request))

        return
    }

    if (isImage(url)) {
        event.respondWith(staleWhileRevalidate(request))
    }
})
