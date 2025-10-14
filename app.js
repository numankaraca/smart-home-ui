// Seçili olan odanın ID'sini saklamak için bir değişken
let currentRoomId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchRooms();

    // ODA EKLEME FORMU (Bu kısım aynı)
    const addRoomForm = document.getElementById('add-room-form');
    addRoomForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newRoomNameInput = document.getElementById('new-room-name');
        const roomName = newRoomNameInput.value.trim();
        if (roomName) {
            addRoom(roomName);

            newRoomNameInput.value = '';
        }
    });

    // --- YENİ EKLENEN BÖLÜM: CİHAZ EKLEME FORMU ---
    const addDeviceForm = document.getElementById('add-device-form');
    addDeviceForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newDeviceNameInput = document.getElementById('new-device-name');
        const deviceName = newDeviceNameInput.value.trim();

        // Eğer bir oda seçiliyse ve cihaz adı boş değilse
        if (deviceName && currentRoomId) {
            addDevice(currentRoomId, deviceName);
            newDeviceNameInput.value = '';
        }
    });
});

// --- YEPYENİ FONKSİYON: CİHAZ EKLEME ---
async function addDevice(roomId, deviceName) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/devices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: deviceName,
                status: false // Yeni eklenen cihaz varsayılan olarak kapalı olsun
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        console.log(`'${deviceName}' cihazı, oda ${roomId}'e başarıyla eklendi.`);
        // Cihaz eklendikten sonra, arayüzü tazelemek için o odanın cihaz listesini yeniden çekelim.
        fetchDevicesForRoom(roomId);

    } catch (error) {
        console.error('Cihaz eklenirken bir hata oluştu:', error);
    }
}


// --- GÜNCELLENEN FONKSİYON: fetchDevicesForRoom ---
async function fetchDevicesForRoom(roomId) {
    // Seçili odanın ID'sini global değişkende sakla
    currentRoomId = roomId;

    const devicesList = document.getElementById('devices-list');
    const addDeviceForm = document.getElementById('add-device-form');
    const devicesPanelTitle = document.getElementById('devices-panel-title');

    devicesList.innerHTML = '<li>Yükleniyor...</li>';
    addDeviceForm.hidden = false; // Cihaz ekleme formunu GÖRÜNÜR yap!

    // Hangi odaya baktığımızı başlıkta gösterelim
    const roomLink = document.querySelector(`a[data-room-id='${roomId}']`);
    if(roomLink) {
        devicesPanelTitle.textContent = `${roomLink.textContent} Odasındaki Cihazlar`;
    }

    // ... (try-catch bloğunun geri kalanı aynı) ...
    try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/devices`);
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        const devices = await response.json();
        devicesList.innerHTML = '';
        if (devices.length === 0) {
            devicesList.innerHTML = '<li>Bu odada cihaz bulunmuyor.</li>';
        } else {
            devices.forEach(device => {
                const listItem = document.createElement('li');
                const deviceInfo = document.createElement('span');
                const statusText = device.status ? 'Açık' : 'Kapalı';
                deviceInfo.textContent = `${device.name} - Durum: ${statusText}`;
                const toggleButton = document.createElement('button');
                toggleButton.textContent = device.status ? 'Kapat' : 'Aç';
                toggleButton.addEventListener('click', () => {
                    toggleDeviceStatus(device.id, device.name, !device.status, roomId);
                });
                listItem.appendChild(deviceInfo);
                listItem.appendChild(toggleButton);
                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error(`Oda ${roomId} için cihazlar çekilirken bir hata oluştu:`, error);
        devicesList.innerHTML = '<li>Cihazlar yüklenirken bir hata oluştu.</li>';
    }
}

// --- DİĞER FONKSİYONLAR AYNI KALIYOR ---
// fetchRooms(), addRoom(), toggleDeviceStatus()
// Kopyala-yapıştır kolaylığı için tam hallerini aşağıya bırakıyorum.

async function fetchRooms() {
    try {
        const response = await fetch('http://localhost:8080/api/v1/rooms');
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        const rooms = await response.json();
        const roomsList = document.getElementById('rooms-list');
        roomsList.innerHTML = '';
        rooms.forEach(room => {
            const listItem = document.createElement('li');
            const roomLink = document.createElement('a');
            roomLink.textContent = room.name;
            roomLink.href = '#';
            roomLink.dataset.roomId = room.id;
            roomLink.addEventListener('click', (event) => {
                event.preventDefault();
                fetchDevicesForRoom(room.id);
            });
            listItem.appendChild(roomLink);
            roomsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Odalar çekilirken bir hata oluştu:', error);
        document.getElementById('rooms-list').innerHTML = '<li>Odalar yüklenemedi.</li>';
    }
}

async function addRoom(name) {
    try {
        const response = await fetch('http://localhost:8080/api/v1/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        const newRoom = await response.json();
        console.log(`'${name}' odası başarıyla eklendi. ID: ${newRoom.id}`);
        fetchRooms(); // Oda eklendikten sonra listeyi yenile
    } catch (error) {
        console.error('Oda eklenirken bir hata oluştu:', error);
    }
}

async function toggleDeviceStatus(deviceId, deviceName, newStatus, roomId) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: deviceName, status: newStatus })
        });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`Cihaz ${deviceId} başarıyla güncellendi.`);
        fetchDevicesForRoom(roomId);
    } catch (error) {
        console.error(`Cihaz ${deviceId} güncellenirken bir hata oluştu:`, error);
    }
}