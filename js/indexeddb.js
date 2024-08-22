// Membuka atau membuat Database dan Object Store
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
    updateRecordDisplay(); // Update display once DB is opened
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

// Menyimpan data ke IndexedDB
function saveToIndexedDB(record) {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

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
            reject('Error fetching data:', event.target.errorCode);
        };
    });
}

function syncOfflineData() {
    getFromIndexedDB().then(records => {
        return fetch('/api/save-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(records)
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Offline data synced successfully');
            // Clear IndexedDB after successful sync
            clearIndexedDB();
        }
    })
    .catch(error => {
        console.error('Error syncing offline data:', error);
    });
}

function clearIndexedDB() {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const transaction = db.transaction(['records'], 'readwrite');
    const objectStore = transaction.objectStore('records');
    const request = objectStore.clear();

    request.onsuccess = function() {
        console.log('IndexedDB cleared');
    };

    request.onerror = function(event) {
        console.error('Error clearing IndexedDB:', event.target.errorCode);
    };
}


