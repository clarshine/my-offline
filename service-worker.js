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
self.addEventListener('sync', event => {
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendanceRecords());
    }
});

async function syncAttendanceRecords() {
    const db = await openIndexedDB(); // Function to open IndexedDB

    const transaction = db.transaction('attendance', 'readwrite');
    const store = transaction.objectStore('attendance');
    const unsyncedRecords = await store.getAll(); // Fetch all records

    const syncedRecords = await Promise.all(unsyncedRecords.map(async (record) => {
        try {
            const response = await fetch('/api/save-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });

            if (response.ok) {
                record.synced = true;
                store.put(record); // Update record as synced
                return record;
            }
        } catch (err) {
            console.error('Sync failed:', err);
        }
        return null;
    }));

    return syncedRecords.filter(record => record !== null);
}

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("attendanceDB", 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}
