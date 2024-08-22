document.addEventListener('DOMContentLoaded', () => {
    // Menampilkan waktu saat ini setiap detik
    setInterval(() => {
        const now = new Date();
        document.getElementById('time').innerText = now.toLocaleTimeString();
    }, 1000);

    // Fungsi untuk menginisialisasi peta dengan lokasi pengguna
    function initMap() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Membuat peta
                const map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat, lng },
                    zoom: 15
                });

                // Menambahkan marker di lokasi pengguna
                new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: 'You are here'
                });
            }, (error) => {
                alert('Error getting location');
            });
        } else {
            alert('Geolocation not supported by this browser.');
        }
    }
    initMap();

    // Event listener untuk tombol Record In
    document.getElementById('record-in').addEventListener('click', () => {
        handleRecord('in');
    });

    // Event listener untuk tombol Record Out
    document.getElementById('record-out').addEventListener('click', () => {
        handleRecord('out');
    });

    // Fungsi untuk menangani presensi
    async function handleRecord(type) {
        try {
            // Mendapatkan lokasi dan waktu
            const locationAndTime = await getLocationAndTime();
            const record = {
                type,
                time: locationAndTime.timestamp,
                location: `Lat: ${locationAndTime.latitude}, Lng: ${locationAndTime.longitude}`,
                synced: false
            };

            // Menyimpan ke IndexedDB
            await saveToIndexedDB(record);

            // Mengirim data ke server jika online
            if (navigator.onLine) {
                await sendRecordToServer(record);
            } else {
                showNotification('Record saved locally. Will sync when online.', 'info');
            }
            updateRecordDisplay();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error recording attendance.', 'error');
        }
    }

    // Mendapatkan lokasi dan waktu saat ini
    function getLocationAndTime() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({
                        latitude,
                        longitude,
                        timestamp: new Date().toISOString()
                    });
                }, (error) => reject(error));
            } else {
                reject(new Error('Geolocation not supported.'));
            }
        });
    }

    // Mengupdate tampilan riwayat presensi
    function updateRecordDisplay() {
        getFromIndexedDB().then(records => {
            const recordDisplay = document.getElementById('record-display');
            recordDisplay.innerHTML = records.map(record => `
                <div class="record ${record.synced ? 'online' : 'offline'} ${record.type === 'in' ? 'record-in' : 'record-out'}">
                    <p>Type: ${record.type === 'in' ? 'Record In' : 'Record Out'}</p>
                    <p>Time: ${new Date(record.time).toLocaleString()}</p>
                    <p>Location: ${record.location}</p>
                    <p>Status: ${record.synced ? 'Synced' : 'Pending'}</p>
                </div>
            `).join('');
        });
    }

    // Menampilkan notifikasi
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerText = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Mengirim data presensi ke server
    async function sendRecordToServer(record) {
        return fetch('/api/save-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  showNotification('Record successfully sent to server.', 'success');
                  record.synced = true;
                  updateRecordDisplay();
              } else {
                  throw new Error('Failed to sync record.');
              }
          });
    }

    // Menyinkronkan data yang disimpan secara offline
    async function syncRecords() {
        const records = await getFromIndexedDB();
        if (records.length > 0 && navigator.onLine) {
            for (const record of records) {
                if (!record.synced) {
                    await sendRecordToServer(record);
                }
            }
            await syncOfflineData(); // Clear synced records
        }
    }

    window.addEventListener('online', syncRecords);
    updateRecordDisplay();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

  
