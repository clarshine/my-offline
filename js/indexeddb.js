let db;
const request = indexedDB.open('AttendanceDatabase', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('records')) {
        const objectStore = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('synced', 'synced', { unique: false }); // Tambahkan index untuk 'synced'
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

// Fungsi untuk menyimpan record ke IndexedDB
function saveToIndexedDB(record) {
    record.synced = false; // Tambahkan properti synced = false secara default
    const transaction = db.transaction(['records'], 'readwrite');
    const objectStore = transaction.objectStore('records');
    const request = objectStore.add(record);

    request.onsuccess = function() {
        console.log('Record saved to IndexedDB');
    };

    request.onerror = function(event) {
        console.error('Error saving record:', event.target.errorCode);
    };
}

// Fungsi untuk mendapatkan semua record dari IndexedDB
function getFromIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database is not initialized.');
            return;
        }

        const transaction = db.transaction(['records'], 'readonly');
        const objectStore = transaction.objectStore('records');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject('Error fetching records:', event.target.errorCode);
        };
    });
}

// Fungsi untuk mendapatkan record yang belum disinkronisasi
function getUnsyncedRecords() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Database is not initialized.');
            return;
        }

        const transaction = db.transaction(['records'], 'readonly');
        const objectStore = transaction.objectStore('records');
        const index = objectStore.index('synced');
        const request = index.getAll(false); // Ambil semua record yang synced = false

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject('Error fetching unsynced records:', event.target.errorCode);
        };
    });
}

// Fungsi untuk mengupdate status synced di IndexedDB
function markRecordsAsSynced(records) {
    const transaction = db.transaction(['records'], 'readwrite');
    const objectStore = transaction.objectStore('records');

    records.forEach(record => {
        record.synced = true; // Tandai sebagai synced
        objectStore.put(record); // Update record di IndexedDB
    });

    transaction.oncomplete = function() {
        console.log('Records marked as synced');
    };

    transaction.onerror = function(event) {
        console.error('Error updating records:', event.target.errorCode);
    };
}


