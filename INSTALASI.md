# 📖 PANDUAN INSTALASI

## 1️⃣ Persiapan

### Install Node.js
- Download dari: https://nodejs.org
- Pilih versi LTS (Long Term Support)
- Install dengan default settings

### Install MySQL
- Download dari: https://dev.mysql.com/downloads/mysql/
- Install dengan default settings
- Catat username dan password

## 2️⃣ Setup Project
```bash
# Clone atau extract project
cd pju-monitoring

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env sesuai konfigurasi Anda
nano .env
```

## 3️⃣ Setup Database

**Opsi 1: Otomatis (Recommended)**
```bash
npm run setup
```

**Opsi 2: Manual**
```bash
mysql -u root -p < database/schema.sql
```

## 4️⃣ Setup Telegram Bot (Opsional)

1. Buka Telegram → cari **@BotFather**
2. Ketik `/newbot`
3. Ikuti instruksi
4. Copy **Bot Token**
5. Paste ke `.env` → `TELEGRAM_BOT_TOKEN`

6. Buka Telegram → cari **@userinfobot**
7. Copy **Chat ID**
8. Paste ke `.env` → `TELEGRAM_CHAT_ID`

## 5️⃣ Jalankan Server
```bash
npm start
```

Atau untuk development:
```bash
npm run dev
```

## 6️⃣ Akses Website

Buka browser: **http://localhost:3003**

Login:
- Username: `admin`
- Password: `admin123`

**⚠️ Segera ganti password setelah login pertama!**

## 7️⃣ Setup ESP32

Kirim data ke endpoint:
```
POST http://YOUR_SERVER_IP:3003/api/sensor/data
Content-Type: application/json

{
  "tegangan": 220.5,
  "arus": 1.53,
  "cahaya": 150.2,
  "gerak": true,
  "relay_status": false
}
```

## 🛠️ Troubleshooting

### Database connection failed
```bash
sudo service mysql start
```

### Port 3003 already in use
Edit `.env` → ubah `PORT=3003` ke port lain

### Telegram bot tidak jalan
Cek token dan chat ID di `.env`

## 📞 Bantuan

Jika ada masalah, hubungi:
- Email: farhan@example.com
- WhatsApp: +62xxx
```

---

# 🎊 **SELESAI! FULL CODE GENERATED!**

## 📦 **File Structure Lengkap:**
```
pju-monitoring/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── setup.js
├── README.md
├── INSTALASI.md
│
├── config/
│   └── database.js
│
├── utils/
│   ├── maf.js
│   ├── telegram.js
│   └── validator.js
│
├── middleware/
│   └── auth.js
│
├── database/
│   └── schema.sql
│
└── public/
    ├── login.html
    ├── dashboard.html
    ├── grafik.html
    ├── riwayat.html
    ├── settings.html
    ├── css/
    │   └── style.css
    └── js/
        ├── dashboard.js
        ├── grafik.js
        ├── riwayat.js
        └── settings.js
