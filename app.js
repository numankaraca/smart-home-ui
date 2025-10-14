// Global değişkenimiz, sadece BİR KEZ burada tanımlanıyor.
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
        fetchRooms_full(); // Listeyi yenile
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

                const editButton = document.createElement('button');
                editButton.textContent = 'Düzenle';
                editButton.addEventListener('click', () => {
                    showEditView(listItem, device, roomId);
                });

                const toggleButton = document.createElement('button');
                toggleButton.textContent = device.status ? 'Kapat' : 'Aç';
                toggleButton.addEventListener('click', () => {
                    toggleDeviceStatus_full(device.id, device.name, !device.status, roomId);
                });

                const deleteDeviceButton = document.createElement('button');
                deleteDeviceButton.textContent = 'Sil';
                deleteDeviceButton.addEventListener('click', () => deleteDevice_full(device.id, roomId));

                buttonGroup.appendChild(editButton);
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

function showEditView(listItem, device, roomId) {
    listItem.innerHTML = '';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = device.name;
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Kaydet';
    saveButton.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        if (newName) {
            updateDeviceName(device, newName, roomId);
        }
    });
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'İptal';
    cancelButton.addEventListener('click', () => {
        fetchDevicesForRoom_full(roomId);
    });
    listItem.appendChild(nameInput);
    listItem.appendChild(saveButton);
    listItem.appendChild(cancelButton);
}

async function updateDeviceName(device, newName, roomId) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/devices/${device.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, status: device.status })
        });
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        console.log(`Cihaz ${device.id} ismi başarıyla güncellendi.`);
        fetchDevicesForRoom_full(roomId);
    } catch (error) {
        console.error(`Cihaz ${device.id} güncellenirken bir hata oluştu:`, error);
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