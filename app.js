document.addEventListener('DOMContentLoaded', () => {
    fetchRooms();
});

async function fetchRooms() {
    // ... (Bu fonksiyonun içeriği aynı kalıyor) ...
    // Sadece sana tam halini veriyorum ki kopyala-yapıştır yapabilesin.
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
                const roomId = event.target.dataset.roomId;
                fetchDevicesForRoom(roomId);
            });

            listItem.appendChild(roomLink);
            roomsList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Odalar çekilirken bir hata oluştu:', error);
        document.getElementById('rooms-list').innerHTML = '<li>Odalar yüklenemedi.</li>';
    }
}


async function fetchDevicesForRoom(roomId) {
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = '<li>Yükleniyor...</li>';

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

                // --- YENİ EKLENEN BÖLÜM BAŞLIYOR ---
                const statusText = device.status ? 'Açık' : 'Kapalı';

                // Cihaz adı ve durumu için bir span oluşturalım
                const deviceInfo = document.createElement('span');
                deviceInfo.textContent = `${device.name} - Durum: ${statusText}`;

                // Durumu değiştir butonu oluşturalım
                const toggleButton = document.createElement('button');
                toggleButton.textContent = device.status ? 'Kapat' : 'Aç';
                toggleButton.dataset.deviceId = device.id;
                toggleButton.dataset.deviceName = device.name;
                toggleButton.dataset.currentStatus = device.status;
                toggleButton.dataset.roomId = roomId; // Hangi odayı yenileyeceğimizi bilmek için

                toggleButton.addEventListener('click', (event) => {
                    const { deviceId, deviceName, currentStatus, roomId } = event.target.dataset;
                    // String gelen 'true'/'false' değerini boolean'a çevirelim
                    const newStatus = !(currentStatus === 'true');
                    toggleDeviceStatus(deviceId, deviceName, newStatus, roomId);
                });

                listItem.appendChild(deviceInfo);
                listItem.appendChild(toggleButton);
                // --- YENİ EKLENEN BÖLÜM BİTİYOR ---

                devicesList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error(`Oda ${roomId} için cihazlar çekilirken bir hata oluştu:`, error);
        devicesList.innerHTML = '<li>Cihazlar yüklenirken bir hata oluştu.</li>';
    }
}

// --- YEPYENİ FONKSİYON ---
async function toggleDeviceStatus(deviceId, deviceName, newStatus, roomId) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/devices/${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: deviceName, // API'miz name beklediği için onu da gönderiyoruz
                status: newStatus
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        console.log(`Cihaz ${deviceId} başarıyla güncellendi.`);
        // Güncelleme başarılı olduktan sonra, arayüzü tazelemek için
        // o odaya ait cihazları yeniden çekiyoruz.
        fetchDevicesForRoom(roomId);

    } catch (error) {
        console.error(`Cihaz ${deviceId} güncellenirken bir hata oluştu:`, error);
    }
}