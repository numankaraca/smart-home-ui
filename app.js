// =================================================================
// Global Değişkenler
// =================================================================
let jwtToken = null;
let currentRoomId = null;

// =================================================================
// Ana Başlangıç Noktası ve Olay Dinleyicileri
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
        jwtToken = storedToken;
        showMainApp();
        fetchRooms();
    } else {
        showLoginScreen();
    }
});

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    document.getElementById('add-room-form').addEventListener('submit', handleAddRoom);
    document.getElementById('add-device-form').addEventListener('submit', handleAddDevice);
}

// =================================================================
// Görünüm Kontrolü
// =================================================================
function showLoginScreen() {
    document.getElementById('login-container').hidden = false;
    document.getElementById('main-container').hidden = true;
}

function showMainApp() {
    document.getElementById('login-container').hidden = true;
    document.getElementById('main-container').hidden = false;
}

// =================================================================
// Bildirim Fonksiyonu
// =================================================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3000);
}

// =================================================================
// Kimlik Doğrulama (Authentication)
// =================================================================
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    errorElement.textContent = '';
    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            throw new Error('Kullanıcı adı veya şifre hatalı!');
        }
        const data = await response.json();
        jwtToken = data.token;
        localStorage.setItem('jwtToken', jwtToken);
        showMainApp();
        fetchRooms();
    } catch (error) {
        console.error('Giriş yapılırken hata:', error);
        errorElement.textContent = error.message;
    }
}

function handleLogout() {
    jwtToken = null;
    localStorage.removeItem('jwtToken');
    showLoginScreen();
}

function handleAuthError() {
    showNotification("Oturum süreniz doldu, lütfen tekrar giriş yapın.", "error");
    handleLogout();
}

// =================================================================
// API Yardımcı Fonksiyonu
// =================================================================
async function fetchWithAuth(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
    }
    const response = await fetch(url, { ...options, headers });
    if ((response.status === 401 || response.status === 403) && !url.includes('/auth/login')) {
        handleAuthError();
        throw new Error('Yetkilendirme hatası!');
    }
    return response;
}

// =================================================================
// Form Yönetimi
// =================================================================
function handleAddRoom(event) {
    event.preventDefault();
    const input = document.getElementById('new-room-name');
    const roomName = input.value.trim();
    if (roomName) {
        addRoom(roomName);
        input.value = '';
    }
}

function handleAddDevice(event) {
    event.preventDefault();
    const input = document.getElementById('new-device-name');
    const deviceName = input.value.trim();
    if (deviceName && currentRoomId) {
        addDevice(currentRoomId, deviceName);
        input.value = '';
    }
}

// =================================================================
// CRUD Fonksiyonları (Bildirimli)
// =================================================================

// --- Oda Fonksiyonları ---
async function fetchRooms() {
    try {
        const response = await fetchWithAuth('http://localhost:8080/api/v1/rooms');
        if (!response.ok) throw new Error();
        const rooms = await response.json();
        const roomsList = document.getElementById('rooms-list');
        roomsList.innerHTML = '';
        rooms.forEach(room => {
            const listItem = document.createElement('li');
            const roomLink = document.createElement('a');
            roomLink.textContent = room.name;
            roomLink.href = '#';
            roomLink.dataset.roomId = room.id;
            roomLink.addEventListener('click', () => fetchDevicesForRoom(room.id));
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Sil';
            deleteButton.addEventListener('click', () => deleteRoom(room.id));
            listItem.appendChild(roomLink);
            listItem.appendChild(deleteButton);
            roomsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Odalar çekilirken hata:', error);
    }
}

async function addRoom(name) {
    try {
        const response = await fetchWithAuth('http://localhost:8080/api/v1/rooms', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error();
        showNotification(`'${name}' odası başarıyla eklendi!`, 'success');
        fetchRooms();
    } catch (error) {
        console.error('Oda eklenirken hata:', error);
        showNotification('Oda eklenirken bir hata oluştu.', 'error');
    }
}

async function deleteRoom(roomId) {
    if (!confirm(`Bu odayı ve içindeki tüm cihazları silmek istediğinizden emin misiniz?`)) return;
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
        showNotification(`Oda başarıyla silindi.`, 'success');
        fetchRooms();
        document.getElementById('devices-list').innerHTML = '';
        document.getElementById('devices-panel-title').textContent = 'Cihazlar';
        document.getElementById('add-device-form').hidden = true;
    } catch (error) {
        console.error('Oda silinirken hata:', error);
        showNotification('Oda silinirken bir hata oluştu.', 'error');
    }
}

// --- Cihaz Fonksiyonları ---
async function fetchDevicesForRoom(roomId) {
    currentRoomId = roomId;
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
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}/devices`);
        if (!response.ok) throw new Error();
        const devices = await response.json();
        devicesList.innerHTML = '';
        if (devices.length === 0) {
            devicesList.innerHTML = '<li>Bu odada cihaz bulunmuyor.</li>';
        } else {
            devices.forEach(device => {
                const listItem = document.createElement('li');
                const deviceInfo = document.createElement('span');
                deviceInfo.textContent = `${device.name} - Durum: ${device.status ? 'Açık' : 'Kapalı'}`;

                const buttonGroup = document.createElement('div');

                const editButton = document.createElement('button');
                editButton.textContent = 'Düzenle';
                editButton.addEventListener('click', () => showEditView(listItem, device, roomId));

                const toggleButton = document.createElement('button');
                toggleButton.textContent = device.status ? 'Kapat' : 'Aç';
                toggleButton.addEventListener('click', () => toggleDeviceStatus(device.id, device.name, !device.status, roomId));

                const deleteDeviceButton = document.createElement('button');
                deleteDeviceButton.textContent = 'Sil';
                deleteDeviceButton.addEventListener('click', () => deleteDevice(device.id, roomId));

                buttonGroup.appendChild(editButton);
                buttonGroup.appendChild(toggleButton);
                buttonGroup.appendChild(deleteDeviceButton);

                listItem.appendChild(deviceInfo);
                listItem.appendChild(buttonGroup);
                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error(`Oda ${roomId} için cihazlar çekilirken hata:`, error);
    }
}

async function addDevice(roomId, deviceName) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}/devices`, {
            method: 'POST',
            body: JSON.stringify({ name: deviceName, status: false })
        });
        if (!response.ok) throw new Error();
        showNotification(`'${deviceName}' cihazı başarıyla eklendi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) {
        console.error('Cihaz eklenirken hata:', error);
        showNotification('Cihaz eklenirken bir hata oluştu.', 'error');
    }
}

async function deleteDevice(deviceId, roomId) {
    if (!confirm(`Bu cihazı silmek istediğinizden emin misiniz?`)) return;
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${deviceId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
        showNotification(`Cihaz başarıyla silindi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) {
        console.error('Cihaz silinirken hata:', error);
        showNotification('Cihaz silinirken bir hata oluştu.', 'error');
    }
}

async function toggleDeviceStatus(deviceId, deviceName, newStatus, roomId) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: deviceName, status: newStatus })
        });
        if (!response.ok) throw new Error();
        showNotification(`Cihaz durumu güncellendi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) {
        console.error('Cihaz durumu güncellenirken hata:', error);
        showNotification('Cihaz durumu güncellenirken bir hata oluştu.', 'error');
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
        fetchDevicesForRoom(roomId);
    });
    listItem.appendChild(nameInput);
    listItem.appendChild(saveButton);
    listItem.appendChild(cancelButton);
}

async function updateDeviceName(device, newName, roomId) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${device.id}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName, status: device.status })
        });
        if (!response.ok) throw new Error();
        showNotification(`Cihaz adı güncellendi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) {
        console.error('Cihaz adı güncellenirken hata:', error);
        showNotification('Cihaz adı güncellenirken bir hata oluştu.', 'error');
    }
}