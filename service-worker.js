const CACHE_NAME = 'v1_cache';
const urlsToCache = [
  '/',
  '/index.html',
  '/menu.html',
  '/css/style.css',
  '/js/app.js',
  '/icons/logo-383x463.png'
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
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendanceRecords());
    }
});

async function syncAttendanceRecords() {
    // Mengambil catatan kehadiran yang belum disinkronkan dari IndexedDB atau LocalStorage
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const unsyncedRecords = records.filter(record => !record.synced);

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
                // Jika berhasil, tandai catatan sebagai tersinkronisasi
                unsyncedRecords.forEach(record => {
                    record.synced = true;
                });
                localStorage.setItem('attendanceRecords', JSON.stringify(records));
                console.log('Records synced successfully');
            } else {
                console.error('Failed to sync records');
            }
        } catch (error) {
            console.error('Error syncing records:', error);
        }
    }
}

