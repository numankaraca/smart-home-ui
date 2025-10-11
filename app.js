// Sayfanın tüm HTML elementlerinin yüklenmesini bekle
document.addEventListener('DOMContentLoaded', () => {
    fetchRooms(); // Sayfa hazır olduğunda odaları getiren fonksiyonu çağır
});

// Backend API'den tüm odaları çeken ve listeleyen fonksiyon
async function fetchRooms() {
    try {
        const response = await fetch('http://localhost:8080/api/v1/rooms');
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        const rooms = await response.json();

        const roomsList = document.getElementById('rooms-list');
        roomsList.innerHTML = ''; // Yeni veri gelmeden önce listeyi temizle

        // API'den gelen her bir oda için
        rooms.forEach(room => {
            const listItem = document.createElement('li');

            // Tıklanabilir bir link (<a> etiketi) oluştur
            const roomLink = document.createElement('a');
            roomLink.textContent = room.name; // Linkin metni oda adı olsun
            roomLink.href = '#'; // Sayfanın başına gitmesini engelle

            // Tıkladığımızda hangi odanın ID'sini alacağımızı bilmek için
            // ID'yi 'data-room-id' özelliğinde sakla
            roomLink.dataset.roomId = room.id;

            // Linke bir 'click' olayı ekle
            roomLink.addEventListener('click', (event) => {
                event.preventDefault(); // Linkin varsayılan davranışını (sayfayı yenileme) engelle
                const roomId = event.target.dataset.roomId; // Tıklanan linkin ID'sini al
                fetchDevicesForRoom(roomId); // O ID'ye ait cihazları getiren fonksiyonu çağır
            });

            listItem.appendChild(roomLink); // Linki liste elemanının içine koy
            roomsList.appendChild(listItem); // Liste elemanını ana listeye ekle
        });

    } catch (error) {
        console.error('Odalar çekilirken bir hata oluştu:', error);
        document.getElementById('rooms-list').innerHTML = '<li>Odalar yüklenemedi.</li>';
    }
}

// Belirli bir odaya ait cihazları API'den çeken ve listeleyen fonksiyon
async function fetchDevicesForRoom(roomId) {
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = '<li>Yükleniyor...</li>'; // Kullanıcıya geri bildirim ver

    try {
        // API adresini, gelen oda ID'sine göre dinamik olarak oluştur
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/devices`);
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        const devices = await response.json();

        devicesList.innerHTML = ''; // Listeyi temizle

        // Eğer o odada hiç cihaz yoksa, bir mesaj göster
        if (devices.length === 0) {
            devicesList.innerHTML = '<li>Bu odada cihaz bulunmuyor.</li>';
        } else {
            // Cihaz varsa, her birini listeye ekle
            devices.forEach(device => {
                const listItem = document.createElement('li');
                // Cihazın 'status' (true/false) değerine göre 'Açık' veya 'Kapalı' yazdır
                const statusText = device.status ? 'Açık' : 'Kapalı';
                listItem.textContent = `${device.name} - Durum: ${statusText}`;
                devicesList.appendChild(listItem);
            });
        }

    } catch (error) {
        console.error(`Oda ${roomId} için cihazlar çekilirken bir hata oluştu:`, error);
        devicesList.innerHTML = '<li>Cihazlar yüklenirken bir hata oluştu.</li>';
    }
}