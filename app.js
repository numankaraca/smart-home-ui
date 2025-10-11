// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    fetchRooms(); // Odaları getir

    // --- YENİ EKLENEN BÖLÜM ---
    // HTML'deki formu bul ve 'submit' olayını dinle
    const addRoomForm = document.getElementById('add-room-form');
    addRoomForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Formun sayfayı yeniden yüklemesini engelle

        const newRoomNameInput = document.getElementById('new-room-name');
        const roomName = newRoomNameInput.value.trim(); // Input'taki değeri al ve boşlukları temizle

        if (roomName) {
            addRoom(roomName); // Eğer isim boş değilse, oda ekleme fonksiyonunu çağır
            newRoomNameInput.value = ''; // İşlem sonrası input'u temizle
        }
    });
    // --- YENİ BÖLÜM SONU ---
});

// app.js içindeki SADECE addRoom fonksiyonunu bununla değiştir

async function addRoom(name) {
    try {
        const response = await fetch('http://localhost:8080/api/v1/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
        // Backend'in cevap olarak gönderdiği yeni oluşturulmuş odayı al
        const newRoom = await response.json();
        console.log(`'${name}' odası başarıyla eklendi. ID: ${newRoom.id}`);

        // Artık tüm listeyi yeniden çekmek yerine, sadece yeni odayı
        // mevcut listenin sonuna kendimiz ekleyelim!
        const roomsList = document.getElementById('rooms-list');
        const listItem = document.createElement('li');

        // Bu kod fetchRooms() içindeki kodla neredeyse aynı
        const roomLink = document.createElement('a');
        roomLink.textContent = newRoom.name;
        roomLink.href = '#';
        roomLink.dataset.roomId = newRoom.id;
        roomLink.addEventListener('click', (event) => {
            event.preventDefault();
            fetchDevicesForRoom(newRoom.id);
        });

        listItem.appendChild(roomLink);
        roomsList.appendChild(listItem);
        // --- DEĞİŞİKLİK BİTTİ ---

    } catch (error) {
        console.error('Oda eklenirken bir hata oluştu:', error);
    }
}


// --- DİĞER FONKSİYONLAR AYNI KALIYOR ---

async function fetchRooms() {
    // ... (içeriği aynı) ...
}

async function fetchDevicesForRoom(roomId) {
    // ... (içeriği aynı) ...
}

async function toggleDeviceStatus(deviceId, deviceName, newStatus, roomId) {
    // ... (içeriği aynı) ...
}