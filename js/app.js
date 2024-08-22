document.addEventListener('DOMContentLoaded', () => {
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

                // Update the info box with current location
                document.getElementById('info-location').innerText = `Location: Latitude ${lat}, Longitude ${lng}`;
            }, () => {
                alert('Error getting location');
            });
        } else {
            alert('Geolocation not supported by this browser.');
        }
    }

    // Initialize the map when the script is loaded
    window.initMap = initMap; // Make sure initMap is accessible globally

    // Setup event listeners and other functions
    setInterval(() => {
        const now = new Date();
        document.getElementById('time').innerText = now.toLocaleTimeString();
    }, 1000);

    document.getElementById('record-in').addEventListener('click', () => {
        saveRecord('in');
        showInfoBox('in');
    });

    document.getElementById('record-out').addEventListener('click', () => {
        saveRecord('out');
        showInfoBox('out');
    });

    function saveRecord(type) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
                const newRecord = {
                    type: type,
                    time: new Date().toISOString(),
                    location: { lat, lng },
                    synced: false // Flag to check if record is synced
                };
                records.push(newRecord);
                localStorage.setItem('attendanceRecords', JSON.stringify(records));
                updateRecordDisplay();
                showInfoBox(type);
            });
        } else {
            alert('Geolocation not supported by this browser.');
        }
    }

    function updateRecordDisplay() {
        const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
        const recordDisplay = document.getElementById('record-display');
        recordDisplay.innerHTML = records.map(record => `
            <div class="record ${record.synced ? 'online' : 'offline'} ${record.type === 'in' ? 'record-in' : 'record-out'}">
                <p>Type: ${record.type === 'in' ? 'Record In' : 'Record Out'}</p>
                <p>Time: ${new Date(record.time).toLocaleString()}</p>
                <p>Location: ${record.location.lat}, ${record.location.lng}</p>
                <p>Status: ${record.synced ? 'Synced' : 'Pending'}</p>
            </div>
        `).join('');
    }

    function showInfoBox(type) {
        const now = new Date();
        document.getElementById('info-type').innerText = `Type: ${type === 'in' ? 'Record In' : 'Record Out'}`;
        document.getElementById('info-time').innerText = `Time: ${now.toLocaleString()}`;
        document.getElementById('info-location').innerText = `Location: 0, 0`; // Use actual location
        document.getElementById('info-status').innerText = `Status: Pending`;
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
