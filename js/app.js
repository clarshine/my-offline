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
        saveRecord('in');
        showNotification('Record In Successful', 'success');
    });

    document.getElementById('record-out').addEventListener('click', () => {
        saveRecord('out');
        showNotification('Record Out Successful', 'success');
    });

    function saveRecord(type) {
        const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
        records.push({
            type: type,
            time: new Date().toISOString(),
            location: 'example-location',
            synced: false // Flag to check if record is synced
        });
        localStorage.setItem('attendanceRecords', JSON.stringify(records));
        updateRecordDisplay();
    }

    function updateRecordDisplay() {
        const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
        const recordDisplay = document.getElementById('record-display');
        recordDisplay.innerHTML = records.map(record => `
            <div class="record ${record.synced ? 'online' : 'offline'} ${record.type === 'in' ? 'record-in' : 'record-out'}">
                <p>Type: ${record.type === 'in' ? 'Record In' : 'Record Out'}</p>
                <p>Time: ${new Date(record.time).toLocaleString()}</p>
                <p>Location: ${record.location}</p>
                <p>Status: ${record.synced ? 'Synced' : 'Pending'}</p>
            </div>
        `).join('');
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
  
