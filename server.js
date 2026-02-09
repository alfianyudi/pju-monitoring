// =========================================
// SERVER.JS - Main Backend Server
// Sistem Monitoring PJU Solar Cell dengan MAF
// =========================================

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// Import utilities
const calculateMAF = require('./utils/maf');
const { sendTelegramNotification } = require('./utils/telegram');
const { validateSensorData, detectSensorError } = require('./utils/validator');

// =========================================
// SETUP EXPRESS & SOCKET.IO
// =========================================
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'pju_secret_key_2025',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        maxAge: null // No timeout
    }
}));

// =========================================
// DATABASE CONNECTION POOL
// =========================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'PJU_MAF',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test koneksi database
pool.getConnection()
    .then(conn => {
        console.log('✅ Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

// =========================================
// MIDDLEWARE: CHECK AUTH
// =========================================
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

// =========================================
// GLOBAL VARIABLES
// =========================================
let lastSensorData = null;
let lastRelayStatus = false;
let sensorErrorNotified = false;

// =========================================
// API: AUTHENTICATION
// =========================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, message: 'Username dan password harus diisi' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.json({ success: false, message: 'Username tidak ditemukan' });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.json({ success: false, message: 'Password salah' });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        res.json({ 
            success: true, 
            message: 'Login berhasil',
            user: { username: user.username, role: user.role }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout berhasil' });
});

// Check session
app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false });
    }
});

// Change password
app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user.id;

        // Validasi input
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.json({ success: false, message: 'Semua field harus diisi' });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'Password baru minimal 6 karakter' });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: 'Konfirmasi password tidak sama' });
        }

        // Cek password lama
        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.json({ success: false, message: 'User tidak ditemukan' });
        }

        const passwordMatch = await bcrypt.compare(oldPassword, users[0].password);

        if (!passwordMatch) {
            return res.json({ success: false, message: 'Password lama salah' });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password berhasil diubah' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =========================================
// API: SENSOR DATA (FROM ESP32)
// =========================================

app.post('/api/sensor/data', async (req, res) => {
    try {
        const { tegangan, arus, cahaya, gerak, relay_status } = req.body;

        // Validasi data
        if (tegangan === undefined || arus === undefined || cahaya === undefined) {
            return res.json({ success: false, message: 'Data sensor tidak lengkap' });
        }

        // Validasi range sensor
        const validation = validateSensorData({ tegangan, arus, cahaya });
        
        if (!validation.valid) {
            console.warn('⚠️ Sensor validation warning:', validation.errors);
        }

        // Deteksi error sensor
        const errorDetection = await detectSensorError(pool, { tegangan, arus, cahaya });
        
        if (errorDetection.hasError && !sensorErrorNotified) {
            // Kirim notifikasi Telegram
            const errorMessage = `⚠️ GANGGUAN SENSOR TERDETEKSI!\n\n` +
                `Sensor Tegangan: ${errorDetection.errors.tegangan || 'OK'}\n` +
                `Sensor Arus: ${errorDetection.errors.arus || 'OK'}\n` +
                `Sensor Cahaya: ${errorDetection.errors.cahaya || 'OK'}\n` +
                `Status Buzzer: Aktif\n` +
                `Waktu: ${new Date().toLocaleString('id-ID')}`;
            
            await sendTelegramNotification(errorMessage);
            sensorErrorNotified = true;
        } else if (!errorDetection.hasError) {
            sensorErrorNotified = false;
        }

        // Simpan data mentah ke database
        await pool.query(
            'INSERT INTO sensor_data (tegangan, arus, cahaya, gerak, relay_status) VALUES (?, ?, ?, ?, ?)',
            [tegangan, arus, cahaya, gerak || false, relay_status || false]
        );

        // Hitung MAF
        const [configRows] = await pool.query('SELECT config_value FROM system_config WHERE config_key = ?', ['maf_window_size']);
        const windowSize = parseInt(configRows[0]?.config_value || 10);

        const mafResults = await calculateMAF(pool, windowSize);

        // Update MAF di record terakhir
        if (mafResults) {
            await pool.query(
                'UPDATE sensor_data SET maf_tegangan = ?, maf_arus = ?, maf_cahaya = ? WHERE id = (SELECT MAX(id) FROM (SELECT id FROM sensor_data) AS tmp)',
                [mafResults.maf_tegangan, mafResults.maf_arus, mafResults.maf_cahaya]
            );
        }

        // Get config untuk mode AUTO
        const [modeRows] = await pool.query('SELECT config_value FROM system_config WHERE config_key = ?', ['relay_mode']);
        const [thresholdRows] = await pool.query('SELECT config_value FROM system_config WHERE config_key = ?', ['light_threshold']);
        
        const relayMode = modeRows[0]?.config_value || 'auto';
        const lightThreshold = parseFloat(thresholdRows[0]?.config_value || 200);

        let newRelayCommand = relay_status;

        // Logika AUTO mode
        if (relayMode === 'auto') {
            if (cahaya >= lightThreshold) {
                // SIANG - Lampu mati
                newRelayCommand = false;
            } else {
                // MALAM - Cek PIR
                if (gerak) {
                    newRelayCommand = true;
                } else {
                    newRelayCommand = false;
                }
            }

            // Update relay status di config
            await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [newRelayCommand.toString(), 'relay_status']);
        } else {
            // MANUAL mode - ambil dari config
            const [relayStatusRows] = await pool.query('SELECT config_value FROM system_config WHERE config_key = ?', ['relay_status']);
            newRelayCommand = relayStatusRows[0]?.config_value === 'true';
        }

        // Cek perubahan status relay
        if (lastRelayStatus !== newRelayCommand) {
            const statusText = newRelayCommand ? 'MENYALA' : 'MATI';
            const emoji = newRelayCommand ? '🔦' : '🌙';
            
            const notifMessage = `${emoji} Lampu ${statusText}\n\n` +
                `Cahaya: ${cahaya} Lux\n` +
                `Gerak: ${gerak ? 'Terdeteksi' : 'Tidak Terdeteksi'}\n` +
                `Mode: ${relayMode.toUpperCase()}\n` +
                `Waktu: ${new Date().toLocaleString('id-ID')}`;
            
            await sendTelegramNotification(notifMessage);
            lastRelayStatus = newRelayCommand;
        }

        // Broadcast ke WebSocket
        const latestData = {
            tegangan,
            arus,
            cahaya,
            gerak,
            relay_status: newRelayCommand,
            maf_tegangan: mafResults?.maf_tegangan,
            maf_arus: mafResults?.maf_arus,
            maf_cahaya: mafResults?.maf_cahaya,
            timestamp: new Date().toISOString()
        };

        lastSensorData = latestData;
        io.emit('sensor_update', latestData);

        res.json({ 
            success: true, 
            relay_command: newRelayCommand ? 'ON' : 'OFF',
            mode: relayMode
        });

    } catch (error) {
        console.error('Sensor data error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =========================================
// API: SENSOR DATA (FOR DASHBOARD)
// =========================================

// Get latest sensor data
app.get('/api/sensor/latest', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1'
        );

        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.json({ success: true, data: null });
        }

    } catch (error) {
        console.error('Get latest data error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get history (500 data terakhir untuk grafik)
app.get('/api/sensor/history', isAuthenticated, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        
        const [rows] = await pool.query(
            'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT ?',
            [limit]
        );

        res.json({ success: true, data: rows.reverse() });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get riwayat with pagination
app.get('/api/sensor/riwayat', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = 'SELECT * FROM sensor_data';
        let countQuery = 'SELECT COUNT(*) as total FROM sensor_data';
        let params = [];
        let countParams = [];

        // Filter tanggal
        if (startDate && endDate) {
            query += ' WHERE created_at BETWEEN ? AND ?';
            countQuery += ' WHERE created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
            countParams.push(startDate, endDate);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countRows] = await pool.query(countQuery, countParams);

        const totalData = countRows[0].total;
        const totalPages = Math.ceil(totalData / limit);

        res.json({ 
            success: true, 
            data: rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalData,
                limit
            }
        });

    } catch (error) {
        console.error('Get riwayat error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =========================================
// API: RELAY CONTROL
// =========================================

// Control relay (manual ON/OFF)
app.post('/api/relay/control', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body; // true = ON, false = OFF

        if (status === undefined) {
            return res.json({ success: false, message: 'Status tidak valid' });
        }

        // Cek mode
        const [modeRows] = await pool.query('SELECT config_value FROM system_config WHERE config_key = ?', ['relay_mode']);
        const relayMode = modeRows[0]?.config_value || 'auto';

        if (relayMode === 'auto') {
            return res.json({ success: false, message: 'Relay dalam mode AUTO. Ubah ke MANUAL terlebih dahulu.' });
        }

        // Update relay status
        await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [status.toString(), 'relay_status']);

        // Broadcast via WebSocket
        io.emit('relay_changed', { status });

        res.json({ success: true, message: `Relay ${status ? 'ON' : 'OFF'}` });

    } catch (error) {
        console.error('Relay control error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Set relay mode (auto/manual)
app.post('/api/relay/mode', isAuthenticated, async (req, res) => {
    try {
        const { mode } = req.body; // 'auto' or 'manual'

        if (mode !== 'auto' && mode !== 'manual') {
            return res.json({ success: false, message: 'Mode tidak valid' });
        }

        await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [mode, 'relay_mode']);

        // Broadcast via WebSocket
        io.emit('mode_changed', { mode });

        res.json({ success: true, message: `Mode diubah ke ${mode.toUpperCase()}` });

    } catch (error) {
        console.error('Set relay mode error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get relay status & mode
app.get('/api/relay/status', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT config_key, config_value FROM system_config WHERE config_key IN (?, ?)', ['relay_mode', 'relay_status']);

        const config = {};
        rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });

        res.json({ 
            success: true, 
            mode: config.relay_mode || 'auto',
            status: config.relay_status === 'true'
        });

    } catch (error) {
        console.error('Get relay status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =========================================
// API: SETTINGS
// =========================================

// Get settings
app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT config_key, config_value FROM system_config');

        const settings = {};
        rows.forEach(row => {
            settings[row.config_key] = row.config_value;
        });

        res.json({ success: true, settings });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update settings
app.post('/api/settings/update', isAuthenticated, async (req, res) => {
    try {
        const { light_threshold, maf_window_size } = req.body;

        if (light_threshold !== undefined) {
            await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [light_threshold.toString(), 'light_threshold']);
        }

        if (maf_window_size !== undefined) {
            await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [maf_window_size.toString(), 'maf_window_size']);
        }

        res.json({ success: true, message: 'Pengaturan berhasil disimpan' });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reset settings to default
app.post('/api/settings/reset', isAuthenticated, async (req, res) => {
    try {
        await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', ['200', 'light_threshold']);
        await pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', ['10', 'maf_window_size']);

        res.json({ success: true, message: 'Pengaturan berhasil direset ke default' });

    } catch (error) {
        console.error('Reset settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =========================================
// WEBSOCKET CONNECTION
// =========================================
io.on('connection', (socket) => {
    console.log('📡 Client connected:', socket.id);

    // Kirim data terakhir saat connect
    if (lastSensorData) {
        socket.emit('sensor_update', lastSensorData);
    }

    socket.on('disconnect', () => {
        console.log('📡 Client disconnected:', socket.id);
    });
});

// =========================================
// START SERVER
// =========================================
server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║  🚀 SERVER MONITORING PJU SOLAR CELL     ║
    ║  📡 Port: ${PORT}                           ║
    ║  🌐 http://localhost:${PORT}               ║
    ╚═══════════════════════════════════════════╝
    `);
});

// Create default admin user if not exists
(async () => {
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
        
        if (users.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
            console.log('✅ Default admin user created (admin/admin123)');
        }
    } catch (error) {
        console.error('Error creating default user:', error);
    }
})();
