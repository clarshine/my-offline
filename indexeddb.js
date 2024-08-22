// indexeddb.js

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

// Menyimpan data presensi ke IndexedDB
async function saveToIndexedDB(record) {
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

// Mengambil data presensi dari IndexedDB
async function getFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['records'], 'readonly');
        const objectStore = transaction.objectStore('records');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.errorCode);
        };
    });
}

// Menghapus data presensi dari IndexedDB
async function deleteFromIndexedDB(id) {
    const transaction = db.transaction(['records'], 'readwrite');
    const objectStore = transaction.objectStore('records');
    const request = objectStore.delete(id);

    request.onsuccess = function() {
        console.log('Record deleted from IndexedDB');
    };

    request.onerror = function(event) {
        console.error('Error deleting record:', event.target.errorCode);
    };
}

// Menyinkronkan data offline ke server
async function syncOfflineData() {
    const records = await getFromIndexedDB();
    for (const record of records) {
        if (!record.synced) {
            await sendDataToServer(record);
            await deleteFromIndexedDB(record.id);
        }
    }
}

// Mengirim data dari IndexedDB ke server
async function sendDataToServer(record) {
    try {
        const response = await fetch('/api/save-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error('Failed to sync record.');
        }
    } catch (error) {
        console.error('Error syncing record:', error);
    }
}

// Fungsi untuk menangani pengiriman data secara manual
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };
    
    if (navigator.onLine) {
        sendDataToServer(formData);
    } else {
        saveFormDataToIndexedDB(formData);
        alert('You are offline. Your form data has been saved and will be sent when you are online.');
    }
}

document.getElementById('myForm').addEventListener('submit', handleFormSubmit);

window.addEventListener('online', syncOfflineData);
