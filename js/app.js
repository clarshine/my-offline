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

    document.getElementById('record-in').addEventListener('click', () => {
        handleRecord('in');
    });

    document.getElementById('record-out').addEventListener('click', () => {
        handleRecord('out');
    });

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

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerText = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function syncRecords() {
        const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];

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
                    const updatedRecords = records.map(record => ({ ...record, synced: true }));
                    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
                    updateRecordDisplay();
                }
            })
            .catch(error => {
                console.error('Error syncing records:', error);
            });
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
