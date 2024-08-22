let db;
const request = indexedDB.open('AttendanceDatabase', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('records')) {
        const objectStore = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

function saveToIndexedDB(record) {
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



