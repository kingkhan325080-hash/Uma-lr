/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'labour-register-v1.0.0';

// Core assets to cache immediately upon install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.jpg'
];

// Install Event - cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  // Only handle local requests, avoid caching external/firebase/analytics calls
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    // Return network response directly for external APIs (e.g. Firebase Auth/Firestore)
    return;
  }

  // Handle SPA routing: if requesting a page document, fallback to index.html
  let request = event.request;
  if (request.mode === 'navigate') {
    request = new Request('/index.html');
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Silent catch for fetch failures when offline
          return cachedResponse;
        });

        // Return cached response instantly if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Message Listener - handle skipWaiting for updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
