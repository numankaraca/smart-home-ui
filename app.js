let currentRoomId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchRooms();
    // Oda ve Cihaz ekleme formlarının olay dinleyicileri burada (değişiklik yok)
    // ...
});

// --- YEPYENİ FONKSİYONLAR: SİLME İŞLEMLERİ ---

// Belirli bir odayı silmek için API'ye DELETE isteği gönderir
async function deleteRoom(roomId) {
    // Kullanıcıya onay sorusu soralım, yanlışlıkla silmeyi engellemek için bu iyi bir pratiktir.
    if (!confirm(`ID ${roomId} olan odayı silmek istediğinize emin misiniz? Bu işlem odaya ait tüm cihazları da silecektir!`)) {
        return; // Kullanıcı "İptal" derse işlemi durdur
    }

    try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        console.log(`Oda ${roomId} başarıyla silindi.`);
        fetchRooms(); // Oda listesini yenile
        document.getElementById('devices-list').innerHTML = ''; // Cihaz listesini temizle
        document.getElementById('devices-panel-title').textContent = 'Cihazlar'; // Cihaz paneli başlığını sıfırla

    } catch (error) {
        console.error(`Oda ${roomId} silinirken bir hata oluştu:`, error);
    }
}

// Belirli bir cihazı silmek için API'ye DELETE isteği gönderir
async function deleteDevice(deviceId, roomId) {
    if (!confirm(`ID ${deviceId} olan cihazı silmek istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        console.log(`Cihaz ${deviceId} başarıyla silindi.`);
        fetchDevicesForRoom(roomId); // Cihaz listesini yenile

    } catch (error) {
        console.error(`Cihaz ${deviceId} silinirken bir hata oluştu:`, error);
    }
}


// --- GÜNCELLENEN FONKSİYONLAR: fetchRooms ve fetchDevicesForRoom ---

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

            // --- YENİ: SİLME BUTONU EKLEME (ODALAR) ---
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Sil';
            deleteButton.addEventListener('click', () => {
                deleteRoom(room.id);
            });

            listItem.appendChild(roomLink);
            listItem.appendChild(deleteButton); // Butonu liste elemanına ekle
            roomsList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Odalar çekilirken bir hata oluştu:', error);
        document.getElementById('rooms-list').innerHTML = '<li>Odalar yüklenemedi.</li>';
    }
}


async function fetchDevicesForRoom(roomId) {
    currentRoomId = roomId;
    // ... (formu ve başlığı gösterme kodları aynı) ...

    try {
        // ... (fetch isteği aynı) ...
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/devices`);
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        const devices = await response.json();

        const devicesList = document.getElementById('devices-list');
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

                // --- YENİ: SİLME BUTONU EKLEME (CİHAZLAR) ---
                const deleteDeviceButton = document.createElement('button');
                deleteDeviceButton.textContent = 'Sil';
                deleteDeviceButton.addEventListener('click', () => {
                    deleteDevice(device.id, roomId); // Odayı yenilemek için roomId de gönderiyoruz
                });

                listItem.appendChild(deviceInfo);
                // Butonları bir div içinde gruplayalım (daha düzenli görünür)
                const buttonGroup = document.createElement('div');
                buttonGroup.appendChild(toggleButton);
                buttonGroup.appendChild(deleteDeviceButton);

                listItem.appendChild(buttonGroup);
                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        // ... (hata yönetimi aynı) ...
    }
}

// Kopyala-yapıştır kolaylığı için projenin TAMAMINI veriyorum
// Önceki fonksiyonların hepsi de burada mevcut.
// SADECE BU KOD BLOĞUNU app.js'e YAPIŞTIRMAN YETERLİ.
// -----------------------------------------------------------------------------

// Global değişken
let currentRoomId_full = null;

// Sayfa yüklendiğinde çalışacak ana fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    fetchRooms_full();

    const addRoomForm = document.getElementById('add-room-form');
    addRoomForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newRoomNameInput = document.getElementById('new-room-name');
        const roomName = newRoomNameInput.value.trim();
        if (roomName) {
            addRoom_full(roomName);
            newRoomNameInput.value = '';
        }
    });

    const addDeviceForm = document.getElementById('add-device-form');
    addDeviceForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newDeviceNameInput = document.getElementById('new-device-name');
        const deviceName = newDeviceNameInput.value.trim();
        if (deviceName && currentRoomId_full) {
            addDevice_full(currentRoomId_full, deviceName);
            newDeviceNameInput.value = '';
        }
    });
});

async function addRoom_full(name) {
    try {
        const response = await fetch('http://localhost:8080/api/v1/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`'${name}' odası başarıyla eklendi.`);
        fetchRooms_full();
    } catch (error) {
        console.error('Oda eklenirken bir hata oluştu:', error);
    }
}

async function addDevice_full(roomId, deviceName) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/devices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: deviceName, status: false })
        });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`'${deviceName}' cihazı, oda ${roomId}'e başarıyla eklendi.`);
        fetchDevicesForRoom_full(roomId);
    } catch (error) {
        console.error('Cihaz eklenirken bir hata oluştu:', error);
    }
}

async function fetchRooms_full() {
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
                fetchDevicesForRoom_full(room.id);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Sil';
            deleteButton.addEventListener('click', () => deleteRoom_full(room.id));

            listItem.appendChild(roomLink);
            listItem.appendChild(deleteButton);
            roomsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Odalar çekilirken bir hata oluştu:', error);
        document.getElementById('rooms-list').innerHTML = '<li>Odalar yüklenemedi.</li>';
    }
}

async function fetchDevicesForRoom_full(roomId) {
    currentRoomId_full = roomId;
    const devicesList = document.getElementById('devices-list');
    const addDeviceForm = document.getElementById('add-device-form');
    const devicesPanelTitle = document.getElementById('devices-panel-title');
    devicesList.innerHTML = '<li>Yükleniyor...</li>';
    addDeviceForm.hidden = false;
    const roomLink = document.querySelector(`a[data-room-id='${roomId}']`);
    if (roomLink) {
        devicesPanelTitle.textContent = `${roomLink.textContent} Odasındaki Cihazlar`;
    }
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

                const buttonGroup = document.createElement('div');

                const toggleButton = document.createElement('button');
                toggleButton.textContent = device.status ? 'Kapat' : 'Aç';
                toggleButton.addEventListener('click', () => {
                    toggleDeviceStatus_full(device.id, device.name, !device.status, roomId);
                });

                const deleteDeviceButton = document.createElement('button');
                deleteDeviceButton.textContent = 'Sil';
                deleteDeviceButton.addEventListener('click', () => deleteDevice_full(device.id, roomId));

                buttonGroup.appendChild(toggleButton);
                buttonGroup.appendChild(deleteDeviceButton);

                listItem.appendChild(deviceInfo);
                listItem.appendChild(buttonGroup);
                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error(`Oda ${roomId} için cihazlar çekilirken bir hata oluştu:`, error);
        devicesList.innerHTML = '<li>Cihazlar yüklenirken bir hata oluştu.</li>';
    }
}

async function toggleDeviceStatus_full(deviceId, deviceName, newStatus, roomId) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: deviceName, status: newStatus })
        });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`Cihaz ${deviceId} başarıyla güncellendi.`);
        fetchDevicesForRoom_full(roomId);
    } catch (error) {
        console.error(`Cihaz ${deviceId} güncellenirken bir hata oluştu:`, error);
    }
}

async function deleteRoom_full(roomId) {
    if (!confirm(`ID ${roomId} olan odayı ve içindeki tüm cihazları silmek istediğinize emin misiniz?`)) {
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`Oda ${roomId} başarıyla silindi.`);
        fetchRooms_full();
        document.getElementById('devices-list').innerHTML = '';
        document.getElementById('devices-panel-title').textContent = 'Cihazlar';
        document.getElementById('add-device-form').hidden = true;
    } catch (error) {
        console.error(`Oda ${roomId} silinirken bir hata oluştu:`, error);
    }
}

async function deleteDevice_full(deviceId, roomId) {
    if (!confirm(`ID ${deviceId} olan cihazı silmek istediğinize emin misiniz?`)) {
        return;
    }
    try {
        const response = await fetch(`http://localhost:8080/api/v1/devices/${deviceId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`Cihaz ${deviceId} başarıyla silindi.`);
        fetchDevicesForRoom_full(roomId);
    } catch (error) {
        console.error(`Cihaz ${deviceId} silinirken bir hata oluştu:`, error);
    }
}