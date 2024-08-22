document.addEventListener('DOMContentLoaded', () => {
    // Menampilkan waktu saat ini
    setInterval(() => {
        const now = new Date();
        document.getElementById('time').innerText = now.toLocaleTimeString();
    }, 1000);

    // Inisialisasi peta dan geolokasi
    function initMap() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat, lng },
                    zoom: 15
                });
                new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: 'You are here'
                });
            }, () => {
                alert('Error getting location');
            });
        } else {
            alert('Geolocation not supported by this browser.');
        }
    }
    initMap();

    // Event listener untuk tombol "Record In"
    document.getElementById('record-in').addEventListener('click', () => {
        handleRecord('in');
    });

    // Event listener untuk tombol "Record Out"
    document.getElementById('record-out').addEventListener('click', () => {
        handleRecord('out');
    });

    // Fungsi untuk menangani rekaman (in/out)
    function handleRecord(type) {
        if (!db) {
            alert('Database is not initialized.');
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const record = {
                type: type,
                time: new Date().toISOString(),
                location: `${lat}, ${lng}`,
                synced: false
            };

            saveToIndexedDB(record);
            showNotification(`${type === 'in' ? 'Record In' : 'Record Out'} Successful`, 'success');
        }, () => {
            showNotification('Error getting location', 'error');
        });
    }

    // Fungsi untuk memperbarui tampilan daftar record
    function updateRecordDisplay() {
        if (!db) {
            console.error('Database is not initialized.');
            return;
        }

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
        }).catch(error => {
            console.error('Error fetching records from IndexedDB:', error);
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

    // Sinkronisasi record ketika online
    function syncRecords() {
        getFromIndexedDB().then(records => {
            if (navigator.onLine) {
                fetch('/api/save-records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(records)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        records.forEach(record => {
                            record.synced = true;
                        });
                        saveToIndexedDB(records);
                        updateRecordDisplay();
                    }
                })
                .catch(error => {
                    console.error('Error syncing records:', error);
                });
            }
        }).catch(error => {
            console.error('Error fetching records for sync:', error);
        });
    }

    window.addEventListener('online', syncRecords);

    // Tampilkan daftar record saat halaman dimuat
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

