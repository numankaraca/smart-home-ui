// =================================================================
// Global Değişkenler
// =================================================================
let jwtToken = null;
let currentRoomId = null; // Hangi odanın cihazlarını gösterdiğimizi takip eder

// =================================================================
// Ana Başlangıç Noktası ve Olay Dinleyicileri
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
        jwtToken = storedToken;
        showView('rooms'); // Token varsa, Odalar görünümünü göster
        fetchRooms();      // ve odaları getir
    } else {
        showView('login'); // Token yoksa, giriş ekranını göster
    }
});

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    document.getElementById('add-room-form').addEventListener('submit', handleAddRoom);
    document.getElementById('add-device-form').addEventListener('submit', handleAddDevice);
    document.getElementById('back-to-rooms-button').addEventListener('click', () => {
        showView('rooms'); // Geri dön butonu Odalar görünümünü açar
        fetchRooms(); // Odaları tekrar listeleyelim (aktif oda stilini sıfırlamak için)
    });
}

// =================================================================
// Görünüm Kontrolü (Hangi bölümün gösterileceğini yönetir)
// =================================================================
function showView(viewName) {
    // Tüm ana görünümleri gizle
    document.getElementById('login-container').hidden = true;
    document.getElementById('app-container').hidden = true; // Ana uygulama konteyneri
    document.getElementById('rooms-view').hidden = true;    // Odalar bölümü
    document.getElementById('devices-view').hidden = true;  // Cihazlar bölümü

    // İstenen görünümü göster
    if (viewName === 'login') {
        document.getElementById('login-container').hidden = false;
    } else if (viewName === 'rooms') {
        document.getElementById('app-container').hidden = false;
        document.getElementById('rooms-view').hidden = false;
        document.getElementById('app-title').textContent = "Akıllı Ev Kontrol Paneli"; // Başlığı sıfırla
        currentRoomId = null; // Aktif oda seçimini sıfırla
    } else if (viewName === 'devices') {
        document.getElementById('app-container').hidden = false;
        document.getElementById('devices-view').hidden = false;
    }
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
    notification.innerHTML = message; // Mesajı HTML olarak ekleyebiliriz (örn: ikonlar için)
    container.appendChild(notification);

    // Bootstrap'in kapatma animasyonu için zaman tanıyoruz ve sonra DOM'dan kaldırıyoruz
    setTimeout(() => {
        if (!notification) return;
        notification.classList.remove('show');
        const removeElement = () => {
            if (notification && notification.parentNode === container) {
                container.removeChild(notification);
            }
        };
        // Transition bitince veya max 500ms sonra kaldır
        notification.addEventListener('transitionend', removeElement, { once: true });
        setTimeout(removeElement, 500);
    }, 4000); // 4 saniye sonra kaybolmaya başlasın
}


// =================================================================
// Kimlik Doğrulama (Authentication)
// =================================================================
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    const loginButton = document.getElementById('login-form').querySelector('button[type="submit"]');
    errorElement.textContent = '';
    loginButton.disabled = true; // Butonu pasif yap
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Giriş Yapılıyor...'; // Yükleniyor animasyonu

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
        showView('rooms'); // Giriş yapınca Odalar görünümünü göster
        fetchRooms();      // Odaları getir
    } catch (error) {
        console.error('Giriş yapılırken hata:', error);
        errorElement.textContent = error.message;
        showView('login'); // Hata olursa giriş ekranında kal
    } finally {
        // İşlem bitince butonu tekrar aktif yap ve yazısını düzelt
        loginButton.disabled = false;
        loginButton.innerHTML = 'Giriş Yap';
    }
}

function handleLogout() {
    jwtToken = null;
    currentRoomId = null;
    localStorage.removeItem('jwtToken');
    showView('login'); // Çıkış yapınca Login ekranını göster
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
    // Giriş endpoint'i hariç 401/403 hatası alırsak çıkış yap
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
    } else {
        showNotification("Oda adı boş olamaz!", "error");
    }
}

function handleAddDevice(event) {
    event.preventDefault();
    const input = document.getElementById('new-device-name');
    const deviceName = input.value.trim();
    if (deviceName && currentRoomId) {
        addDevice(currentRoomId, deviceName);
        input.value = '';
    } else if (!deviceName) {
        showNotification("Cihaz adı boş olamaz!", "error");
    }
}

// =================================================================
// CRUD Fonksiyonları (Bildirimli, Bootstrap Uyumlu, İkonlu)
// =================================================================

// --- Oda Fonksiyonları ---
async function fetchRooms() {
    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = `<div class="col"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div> Yükleniyor...</div>`; // Spinner ekledik
    try {
        const response = await fetchWithAuth('http://localhost:8080/api/v1/rooms');
        if (!response.ok) throw new Error('Odalar yüklenemedi.');
        const rooms = await response.json();
        roomsList.innerHTML = ''; // Spinner'ı temizle
        if (rooms.length === 0) {
            roomsList.innerHTML = '<div class="col"><p class="text-muted">Henüz oda eklenmemiş.</p></div>';
        } else {
            rooms.forEach(room => {
                const roomCol = document.createElement('div');
                roomCol.className = 'col'; // Bootstrap grid sütunu

                const card = document.createElement('div');
                card.className = 'card h-100 room-card shadow-sm'; // Kart stili ve özel class
                card.dataset.roomId = room.id;

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body d-flex justify-content-between align-items-center';

                const roomNameSpan = document.createElement('span');
                roomNameSpan.className = 'h5 card-title mb-0'; // Başlık stili
                roomNameSpan.textContent = room.name;

                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Font Awesome ikonu
                deleteButton.className = 'btn btn-outline-danger btn-sm'; // Outline stili
                deleteButton.title = 'Odayı Sil';
                deleteButton.setAttribute('aria-label', 'Delete Room');
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Kartın tıklanmasını engelle
                    deleteRoom(room.id);
                });

                cardBody.appendChild(roomNameSpan);
                cardBody.appendChild(deleteButton);
                card.appendChild(cardBody);
                roomCol.appendChild(card);

                // Kartın tamamına tıklama olayı
                card.addEventListener('click', () => {
                    fetchDevicesForRoom(room.id); // Cihazlar görünümüne geç
                });

                roomsList.appendChild(roomCol);
            });
        }
    } catch (error) {
        console.error('Odalar çekilirken hata:', error);
        roomsList.innerHTML = '<div class="col"><p class="text-danger">Odalar yüklenirken bir hata oluştu.</p></div>';
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
            throw new Error(errorData.message || 'Oda eklenemedi');
        }
        showNotification(`'${name}' odası eklendi!`, 'success');
        fetchRooms(); // Listeyi yenile
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
        fetchRooms(); // Oda listesini yenile
        // Cihaz panelini sıfırlamaya gerek yok, çünkü Odalar görünümüne dönüyoruz
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// --- Cihaz Fonksiyonları ---
async function fetchDevicesForRoom(roomId) {
    currentRoomId = roomId; // Seçili odayı güncelle
    showView('devices'); // Cihazlar görünümünü göster

    const devicesList = document.getElementById('devices-list');
    const addDeviceForm = document.getElementById('add-device-form');
    const devicesPanelTitle = document.getElementById('devices-panel-title');
    devicesList.innerHTML = `<li class="list-group-item text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div> Yükleniyor...</li>`;

    // Oda ismini başlığa yazmak için odanın bilgisini API'den çekelim
    try {
        const roomResponse = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}`);
        if(roomResponse.ok) {
            const room = await roomResponse.json();
            devicesPanelTitle.textContent = `${room.name} Odasındaki Cihazlar`;
        } else {
            devicesPanelTitle.textContent = `Odadaki Cihazlar`;
        }
    } catch {
        devicesPanelTitle.textContent = `Odadaki Cihazlar`;
    }

    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}/devices`);
        if (!response.ok) throw new Error('Cihazlar yüklenemedi');
        const devices = await response.json();
        devicesList.innerHTML = ''; // Spinner'ı temizle
        if (devices.length === 0) {
            devicesList.innerHTML = '<li class="list-group-item text-muted">Bu odada cihaz bulunmuyor.</li>';
        } else {
            devices.forEach(device => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.dataset.deviceId = device.id;
                renderDeviceView(listItem, device, roomId); // Cihazın normal görünümünü render et
                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error(`Cihazlar çekilirken hata:`, error);
        devicesList.innerHTML = '<li class="list-group-item text-danger">Cihazlar yüklenemedi.</li>';
    }
}

// Bir cihaz satırının normal görünümünü oluşturur ve olay dinleyicilerini ekler
function renderDeviceView(listItem, device, roomId) {
    const statusText = device.status ? 'Açık' : 'Kapalı';
    const toggleButtonIcon = device.status ? 'fa-toggle-off' : 'fa-toggle-on';
    const toggleButtonClass = device.status ? 'btn-outline-warning' : 'btn-outline-success';
    const toggleButtonTitle = device.status ? 'Kapat' : 'Aç';

    listItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>
                <i class="fas fa-lightbulb me-2 text-muted"></i> ${device.name} - <span class="fw-bold">${statusText}</span>
            </span>
            <div class="btn-group" role="group" aria-label="Device Actions">
                <button class="btn btn-outline-secondary btn-sm edit-btn" title="Düzenle"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn ${toggleButtonClass} btn-sm toggle-btn" title="${toggleButtonTitle}"><i class="fas ${toggleButtonIcon}"></i></button>
                <button class="btn btn-outline-danger btn-sm delete-btn" title="Sil"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `;
    // Butonlara olay dinleyicilerini ekle
    listItem.querySelector('.edit-btn').addEventListener('click', () => renderEditView(listItem, device, roomId));
    listItem.querySelector('.toggle-btn').addEventListener('click', () => toggleDeviceStatus(device.id, device.name, !device.status, roomId));
    listItem.querySelector('.delete-btn').addEventListener('click', () => deleteDevice(device.id, roomId));
}

// Bir cihaz satırının düzenleme görünümünü oluşturur ve olay dinleyicilerini ekler
function renderEditView(listItem, device, roomId) {
    listItem.innerHTML = `
        <div class="input-group input-group-sm">
            <input type="text" class="form-control" value="${device.name}" aria-label="Cihaz Adı">
            <button class="btn btn-success save-btn" type="button"><i class="fas fa-check"></i></button>
            <button class="btn btn-secondary cancel-btn" type="button"><i class="fas fa-times"></i></button>
        </div>
    `;
    // Butonlara olay dinleyicilerini ekle
    listItem.querySelector('.cancel-btn').addEventListener('click', () => renderDeviceView(listItem, device, roomId)); // İptal edince normal görünüme dön
    listItem.querySelector('.save-btn').addEventListener('click', () => {
        const newName = listItem.querySelector('input').value.trim();
        if (newName) {
            updateDeviceName(device, newName, roomId);
        } else {
            showNotification("Cihaz adı boş olamaz!", "error");
        }
    });
    // Input alanına odaklan ve tüm metni seç
    const inputField = listItem.querySelector('input');
    inputField.focus();
    inputField.select();
}

async function addDevice(roomId, deviceName) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/rooms/${roomId}/devices`, { method: 'POST', body: JSON.stringify({ name: deviceName, status: false }) });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Cihaz eklenemedi.' }));
            throw new Error(errorData.message);
        }
        showNotification(`'${deviceName}' cihazı eklendi.`, 'success');
        fetchDevicesForRoom(roomId); // Cihaz listesini yenile
    } catch (error) { showNotification(error.message, 'error'); }
}

async function deleteDevice(deviceId, roomId) {
    if (!confirm(`Bu cihazı silmek istediğinizden emin misiniz?`)) return;
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${deviceId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Cihaz silinemedi.');
        showNotification(`Cihaz silindi.`, 'success');
        fetchDevicesForRoom(roomId); // Cihaz listesini yenile
    } catch (error) { showNotification(error.message, 'error'); }
}

async function toggleDeviceStatus(deviceId, deviceName, newStatus, roomId) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: deviceName, status: newStatus })
        });
        if (!response.ok) throw new Error('Cihaz durumu güncellenemedi.');
        showNotification(`Cihaz durumu güncellendi.`, 'success');
        fetchDevicesForRoom(roomId); // Cihaz listesini yenile
    } catch (error) { showNotification(error.message, 'error'); }
}

async function updateDeviceName(device, newName, roomId) {
    try {
        const response = await fetchWithAuth(`http://localhost:8080/api/v1/devices/${device.id}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName, status: device.status }) // Status'u koruyoruz
        });
        if (!response.ok) throw new Error('Cihaz adı güncellenemedi.');
        showNotification(`Cihaz adı güncellendi.`, 'success');
        fetchDevicesForRoom(roomId); // Cihaz listesini yenile
    } catch (error) { showNotification(error.message, 'error'); }
}