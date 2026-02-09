# 🚀 Sistem Monitoring PJU Solar Cell dengan MAF

Sistem monitoring kinerja sensor pada lampu penerangan jalan solar cell menggunakan metode Moving Average Filter (MAF) berbasis Internet of Things (IoT).

## 📋 Fitur

- ✅ Monitoring realtime tegangan, arus, cahaya, dan gerak
- ✅ Moving Average Filter (MAF) untuk stabilitas data sensor
- ✅ Mode AUTO & MANUAL untuk kontrol relay/lampu
- ✅ Notifikasi Telegram otomatis
- ✅ Deteksi gangguan sensor dengan buzzer alert
- ✅ Grafik realtime 100 data terakhir
- ✅ Riwayat data (Raw & MAF) dengan pagination
- ✅ Export data ke CSV
- ✅ Settings threshold & MAF window size
- ✅ Ganti password user

## 🛠️ Teknologi

- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Realtime:** Socket.IO (WebSocket)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Charting:** Chart.js
- **Notification:** Telegram Bot API
- **Security:** bcrypt, express-session

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/pju-monitoring.git
cd pju-monitoring
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Import schema database
mysql -u root -p < database/schema.sql

# (Opsional) Import data seed
mysql -u root -p < database/seed.sql
```

### 4. Setup Environment Variables
```bash
# Copy file .env.example ke .env
cp .env.example .env

# Edit .env dan sesuaikan konfigurasi
nano .env
```

### 5. Setup Telegram Bot (Opsional tapi Direkomendasikan)

**Cara membuat Telegram Bot:**

1. Buka Telegram dan cari **@BotFather**
2. Ketik `/newbot`
3. Ikuti instruksi untuk membuat bot baru
4. Copy **Bot Token** yang diberikan
5. Paste token ke file `.env` di variabel `TELEGRAM_BOT_TOKEN`

**Cara mendapatkan Chat ID:**

1. Buka Telegram dan cari **@userinfobot**
2. Klik **Start**
3. Copy **ID** yang diberikan
4. Paste ID ke file `.env` di variabel `TELEGRAM_CHAT_ID`

### 6. Jalankan Server
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3003`

## 🔐 Login Default

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ PENTING:** Segera ganti password default setelah login pertama kali!

## 📡 API Endpoint ESP32

ESP32 mengirim data sensor ke server dengan format:
```
POST http://localhost:3003/api/sensor/data
Content-Type: application/json

{
  "tegangan": 220.5,
  "arus": 1.53,
  "cahaya": 150.2,
  "gerak": true,
  "relay_status": false
}
```

**Response:**
```json
{
  "success": true,
  "relay_command": "ON",
  "mode": "auto"
}
```

ESP32 harus mengikuti command `relay_command` untuk mengontrol relay.

## 🎯 Logika Sistem

### Mode AUTO (Default)
```
JIKA cahaya >= 200 lux (SIANG):
  → Relay OFF (lampu mati)

JIKA cahaya < 200 lux (MALAM):
  → CEK sensor PIR
     JIKA gerak = true  → Relay ON (lampu nyala)
     JIKA gerak = false → Relay OFF (lampu mati)
```

### Mode MANUAL
```
User klik tombol ON  → Relay ON
User klik tombol OFF → Relay OFF
(Sensor diabaikan)
```

## 📊 Database Schema

### Tabel: `users`
- Menyimpan data user admin

### Tabel: `sensor_data`
- Menyimpan data mentah sensor
- Menyimpan hasil MAF (tegangan, arus, cahaya)

### Tabel: `system_config`
- Menyimpan konfigurasi sistem (mode, threshold, dll)

## 🔧 Konfigurasi MAF

Moving Average Filter dihitung di **server** (bukan di ESP32).

**Formula:**
```
y[i] = (1/M) × Σ x[i-k]
```

Dimana:
- `y[i]` = Hasil filter MAF
- `x[i]` = Data mentah sensor
- `M` = Window size (default: 10)

**Cara mengubah window size:**
1. Login ke dashboard
2. Buka menu **Settings**
3. Ubah nilai **MAF Window Size**
4. Klik **Simpan**

## 📱 Notifikasi Telegram

Sistem otomatis mengirim notifikasi saat:

1. **Relay berubah status** (ON ↔ OFF)
2. **Sensor mengalami gangguan**

Contoh notifikasi:
```
🔦 Lampu MENYALA

Cahaya: 150 Lux
Gerak: Terdeteksi
Mode: AUTO
Waktu: 05-11-2025 18:08:45
```

## 🛡️ Troubleshooting

### Database Connection Failed
```bash
# Pastikan MySQL berjalan
sudo service mysql start

# Cek kredensial di .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=PJU_MAF
```

### Telegram Notification Gagal
```bash
# Cek token dan chat ID di .env
TELEGRAM_BOT_TOKEN=your_actual_token
TELEGRAM_CHAT_ID=your_actual_chat_id

# Test koneksi di browser
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getMe
```

### WebSocket Tidak Connect
```bash
# Pastikan firewall tidak memblokir port 3003
sudo ufw allow 3003

# Atau nonaktifkan firewall sementara
sudo ufw disable
```

## 📝 TODO / Future Development

- [ ] Multi-user support
- [ ] Role-based access control
- [ ] Email notification
- [ ] SMS notification via Twilio
- [ ] Mobile app (React Native)
- [ ] Dashboard analytics & reporting
- [ ] Predictive maintenance dengan ML

## 👨‍💻 Author

**Muhammad Farhan**
- NIM: E1E119067
- Jurusan: Teknik Informatika
- Universitas: Universitas Halu Oleo
- Tahun: 2025

## 📄 License

ISC License - Free to use for educational purposes.

## 🙏 Acknowledgments

- Dosen Pembimbing
- Laboratorium Computer System and Networking
- Fakultas Teknik Universitas Halu Oleo
