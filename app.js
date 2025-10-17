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
    const alertType = type === 'success' ? 'success' : 'danger';
    // Bootstrap Alert Class'larını kullanıyoruz
    notification.className = `alert alert-${alertType} alert-dismissible fade show m-2`;
    notification.role = 'alert';
    notification.innerHTML = message;
    container.appendChild(notification);
    setTimeout(() => {
        notification.classList.remove('show');
        // Animasyon bittikten sonra elementi kaldır
        notification.addEventListener('transitionend', () => notification.remove());
    }, 4000);
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
    showNotification("Oturum süreniz doldu veya yetkiniz yok.", "error");
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
// CRUD Fonksiyonları (Bildirimli ve Bootstrap Uyumlu)
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
            const listItem = document.createElement('a');
            listItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            listItem.href = '#';
            listItem.dataset.roomId = room.id;

            const roomNameSpan = document.createElement('span');
            roomNameSpan.textContent = room.name;

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&times;'; // Çarpı işareti
            deleteButton.className = 'btn-close';
            deleteButton.setAttribute('aria-label', 'Close');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Linkin tıklanma olayını engelle
                deleteRoom(room.id);
            });

            listItem.appendChild(roomNameSpan);
            listItem.appendChild(deleteButton);

            listItem.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('#rooms-list .list-group-item').forEach(el => el.classList.remove('active'));
                listItem.classList.add('active');
                fetchDevicesForRoom(room.id);
            });
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
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Oda eklenemedi.' }));
            throw new Error(errorData.message);
        }
        showNotification(`'${name}' odası eklendi!`, 'success');
        fetchRooms();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteRoom(roomId) {
    if (!confirm(`Bu odayı ve içindeki tüm cihazları silmek istediğinizden emin misiniz?`)) return;
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Oda silinemedi.');
        showNotification(`Oda silindi.`, 'success');
        fetchRooms();
        document.getElementById('devices-list').innerHTML = '';
        document.getElementById('devices-panel-title').textContent = 'Cihazlar';
        document.getElementById('add-device-form').hidden = true;
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// --- Cihaz Fonksiyonları ---
async function fetchDevicesForRoom(roomId) {
    currentRoomId = roomId;
    const devicesList = document.getElementById('devices-list');
    const addDeviceForm = document.getElementById('add-device-form');
    const devicesPanelTitle = document.getElementById('devices-panel-title');
    devicesList.innerHTML = `<li class="list-group-item"><div class="spinner-border spinner-border-sm" role="status"></div> Yükleniyor...</li>`;
    addDeviceForm.hidden = false;
    const roomLink = document.querySelector(`a.list-group-item[data-room-id='${roomId}'] span`);
    if (roomLink) {
        devicesPanelTitle.textContent = `${roomLink.textContent} Odasındaki Cihazlar`;
    }

    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}/devices`);
        if (!response.ok) throw new Error();
        const devices = await response.json();
        devicesList.innerHTML = '';
        if (devices.length === 0) {
            devicesList.innerHTML = '<li class="list-group-item">Bu odada cihaz bulunmuyor.</li>';
        } else {
            devices.forEach(device => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item'; // Sadece bir satır
                listItem.dataset.deviceId = device.id;
                renderDeviceView(listItem, device, roomId); // Ayrı bir fonksiyona taşıdık
                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error(`Cihazlar çekilirken hata:`, error);
        devicesList.innerHTML = '<li class="list-group-item text-danger">Cihazlar yüklenemedi.</li>';
    }
}

function renderDeviceView(listItem, device, roomId) {
    listItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${device.name} - Durum: ${device.status ? 'Açık' : 'Kapalı'}</span>
            <div>
                <button class="btn btn-outline-secondary btn-sm me-2 edit-btn">Düzenle</button>
                <button class="btn ${device.status ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm me-2 toggle-btn">${device.status ? 'Kapat' : 'Aç'}</button>
                <button class="btn btn-outline-danger btn-sm delete-btn">Sil</button>
            </div>
        </div>
    `;
    listItem.querySelector('.edit-btn').addEventListener('click', () => renderEditView(listItem, device, roomId));
    listItem.querySelector('.toggle-btn').addEventListener('click', () => toggleDeviceStatus(device.id, device.name, !device.status, roomId));
    listItem.querySelector('.delete-btn').addEventListener('click', () => deleteDevice(device.id, roomId));
}

function renderEditView(listItem, device, roomId) {
    listItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center w-100">
            <input type="text" class="form-control me-2" value="${device.name}">
            <div>
                <button class="btn btn-primary btn-sm me-2 save-btn">Kaydet</button>
                <button class="btn btn-secondary btn-sm cancel-btn">İptal</button>
            </div>
        </div>
    `;
    listItem.querySelector('.cancel-btn').addEventListener('click', () => renderDeviceView(listItem, device, roomId));
    listItem.querySelector('.save-btn').addEventListener('click', () => {
        const newName = listItem.querySelector('input').value.trim();
        if (newName) updateDeviceName(device, newName, roomId);
    });
}

async function addDevice(roomId, deviceName) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}/devices`, { method: 'POST', body: JSON.stringify({ name: deviceName, status: false }) });
        if (!response.ok) throw new Error('Cihaz eklenemedi');
        showNotification(`'${deviceName}' cihazı eklendi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) { showNotification(error.message, 'error'); }
}

async function deleteDevice(deviceId, roomId) {
    if (!confirm(`Bu cihazı silmek istediğinizden emin misiniz?`)) return;
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${deviceId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Cihaz silinemedi');
        showNotification(`Cihaz silindi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) { showNotification(error.message, 'error'); }
}

async function toggleDeviceStatus(deviceId, deviceName, newStatus, roomId) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: deviceName, status: newStatus })
        });
        if (!response.ok) throw new Error('Cihaz durumu güncellenemedi');
        showNotification(`Cihaz durumu güncellendi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) { showNotification(error.message, 'error'); }
}

async function updateDeviceName(device, newName, roomId) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${device.id}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName, status: device.status })
        });
        if (!response.ok) throw new Error('Cihaz adı güncellenemedi');
        showNotification(`Cihaz adı güncellendi.`, 'success');
        fetchDevicesForRoom(roomId);
    } catch (error) { showNotification(error.message, 'error'); }
}