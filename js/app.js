document.addEventListener('DOMContentLoaded', () => {
    setInterval(() => {
        const now = new Date();
        document.getElementById('time').innerText = now.toLocaleTimeString();
    }, 1000);

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

    async function handleRecord(type) {
        try {
            const locationAndTime = await getLocationAndTime();
            const record = {
                type,
                time: locationAndTime.timestamp,
                location: `Lat: ${locationAndTime.latitude}, Lng: ${locationAndTime.longitude}`,
                synced: false
            };

            await saveToIndexedDB(record);

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

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerText = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

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

    async function syncRecords() {
        const records = await getFromIndexedDB();
        if (records.length > 0 && navigator.onLine) {
            for (const record of records) {
                if (!record.synced) {
                    await sendRecordToServer(record);
                }
            }
            await syncOfflineData();
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
