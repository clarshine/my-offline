const CACHE_NAME = 'v1_cache';
const urlsToCache = [
  '/',
  '/index.html',
  '/menu.html',
  '/css/style.css',
  '/js/app.js',
  '/icons/purple-logo-1510x1510.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached response if found, otherwise fetch from the network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Menambahkan Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendanceRecords());
    }
});

async function syncAttendanceRecords() {
    const unsyncedRecords = await getUnsyncedRecords();
    if (unsyncedRecords.length > 0) {
        try {
            const response = await fetch('/api/save-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(unsyncedRecords)
            });

            if (response.ok) {
                // Tandai record sebagai sudah disinkronisasi
                await markRecordsAsSynced(unsyncedRecords);
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}
