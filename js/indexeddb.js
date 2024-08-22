// Membuka atau membuat Database dan Object Store
let db;
const request = indexedDB.open('FormDatabase', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('forms')) {
        const objectStore = db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
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

// Menyimpan data ke IndexedDB
function saveToIndexedDB(record) {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const transaction = db.transaction(['forms'], 'readwrite');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.add(record);

    request.onsuccess = function() {
        console.log('Record saved to IndexedDB');
    };

    request.onerror = function(event) {
        console.error('Error saving record data:', event.target.errorCode);
    };
}

// Mengambil data dari IndexedDB
function getFromIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database is not initialized.'));
            return;
        }

        const transaction = db.transaction(['forms'], 'readonly');
        const objectStore = transaction.objectStore('forms');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.errorCode);
        };
    });
}

// Menghapus data dari IndexedDB
function deleteFromIndexedDB(id) {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const transaction = db.transaction(['forms'], 'readwrite');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.delete(id);

    request.onsuccess = function() {
        console.log('Record deleted from IndexedDB');
    };

    request.onerror = function(event) {
        console.error('Error deleting record data:', event.target.errorCode);
    };
}

