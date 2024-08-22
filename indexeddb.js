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
function saveFormDataToIndexedDB(formData) {
    const transaction = db.transaction(['forms'], 'readwrite');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.add(formData);

    request.onsuccess = function() {
        console.log('Form data saved to IndexedDB');
    };

    request.onerror = function(event) {
        console.error('Error saving form data:', event.target.errorCode);
    };
}

function handleFormSubmit(event) {
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

// Mengirim data dari IndexedDB ke server saat online
function sendDataToServer(formData) {
    fetch('/submit-form', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Menghapus data dari IndexedDB setelah penyerahan data berhasil
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function syncOfflineData() {
    const transaction = db.transaction(['forms'], 'readonly');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const allData = event.target.result;
        allData.forEach(formData => {
            sendDataToServer(formData);
        });
    };
}

window.addEventListener('online', syncOfflineData);

// Menghapus data dari IndexedDB setelah dikirim
function deleteFormDataFromIndexedDB(id) {
    const transaction = db.transaction(['forms'], 'readwrite');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.delete(id);

    request.onsuccess = function() {
        console.log('Form data deleted from IndexedDB');
    };

    request.onerror = function(event) {
        console.error('Error deleting form data:', event.target.errorCode);
    };
}

/*Penjelasan Kode:
- Membuka atau Membuat Database:
Menggunakan indexedDB.open('FormDatabase', 1) untuk membuka database. Jika database belum ada, maka akan dibuat.
onupgradeneeded digunakan untuk membuat object store forms dengan keyPath sebagai 'id', yang akan menjadi primary key dan otomatis di-increment.
- Menyimpan Data ke IndexedDB:
Saat form di-submit dan pengguna sedang offline, data disimpan ke IndexedDB menggunakan transaction dan objectStore.add(formData).
- Mengirim Data ke Server saat Kembali Online:
Ketika pengguna kembali online, syncOfflineData mengambil semua data dari IndexedDB dan mengirimkannya ke server dengan fetch. Setelah data berhasil dikirim, data dihapus dari IndexedDB menggunakan deleteFormDataFromIndexedDB.
- Menghapus Data dari IndexedDB:
Setelah data berhasil dikirim ke server, hapus data dari IndexedDB agar tidak dikirim berulang kali.
*/
