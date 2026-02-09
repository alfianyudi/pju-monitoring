// =========================================
// VALIDATOR.JS - Sensor Data Validation
// =========================================

/**
 * Validasi range sensor berdasarkan konfigurasi
 * @param {Object} data - Data sensor (tegangan, arus, cahaya)
 * @returns {Object} Hasil validasi
 */
function validateSensorData(data) {
    const errors = [];
    
    // Batas normal (dari .env atau default)
    const VOLTAGE_MIN = parseFloat(process.env.VOLTAGE_MIN || 150);
    const VOLTAGE_MAX = parseFloat(process.env.VOLTAGE_MAX || 300);
    const CURRENT_MIN = parseFloat(process.env.CURRENT_MIN || 0);
    const CURRENT_MAX = parseFloat(process.env.CURRENT_MAX || 10);
    const LIGHT_MIN = parseFloat(process.env.LIGHT_MIN || 0);
    const LIGHT_MAX = parseFloat(process.env.LIGHT_MAX || 100000);

    // Validasi Tegangan
    if (data.tegangan < VOLTAGE_MIN || data.tegangan > VOLTAGE_MAX) {
        errors.push({
            sensor: 'tegangan',
            value: data.tegangan,
            message: `Tegangan di luar range normal (${VOLTAGE_MIN}V - ${VOLTAGE_MAX}V)`
        });
    }

    // Validasi Arus
    if (data.arus < CURRENT_MIN || data.arus > CURRENT_MAX) {
        errors.push({
            sensor: 'arus',
            value: data.arus,
            message: `Arus di luar range normal (${CURRENT_MIN}A - ${CURRENT_MAX}A)`
        });
    }

    // Validasi Cahaya
    // ✅ CAHAYA 0 ADALAH NORMAL (kondisi sangat gelap)
    if (data.cahaya < LIGHT_MIN || data.cahaya > LIGHT_MAX) {
        errors.push({
            sensor: 'cahaya',
            value: data.cahaya,
            message: `Cahaya di luar range normal (${LIGHT_MIN} - ${LIGHT_MAX} Lux)`
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Deteksi error sensor (sensor tidak responsif atau rusak)
 * @param {Object} pool - MySQL connection pool
 * @param {Object} currentData - Data sensor saat ini
 * @returns {Object} Hasil deteksi error
 */
async function detectSensorError(pool, currentData) {
    try {
        // Ambil 5 data terakhir
        const [rows] = await pool.query(
            'SELECT tegangan, arus, cahaya FROM sensor_data ORDER BY created_at DESC LIMIT 5'
        );

        const errors = {};
        let hasError = false;

        // Cek jika nilai tetap sama (sensor tidak responsif)
        if (rows.length >= 5) {
            // =========================================
            // CEK TEGANGAN
            // =========================================
            const allTeganganSame = rows.every(row => row.tegangan === currentData.tegangan);
            if (allTeganganSame && currentData.tegangan === 0) {
                errors.tegangan = 'Sensor tidak responsif (nilai tetap 0)';
                hasError = true;
            }

            // =========================================
            // CEK ARUS
            // =========================================
            const allArusSame = rows.every(row => row.arus === currentData.arus);
            if (allArusSame && currentData.arus === 0) {
                errors.arus = 'Sensor tidak responsif (nilai tetap 0)';
                hasError = true;
            }

            // =========================================
            // CEK CAHAYA
            // ✅ CAHAYA 0 ADALAH NORMAL
            // Hanya error jika SELALU 0 DAN ada pola tidak wajar
            // =========================================
            const allCahayaSame = rows.every(row => row.cahaya === currentData.cahaya);
            
            // ❌ HAPUS CEK INI - Cahaya 0 adalah kondisi normal (sangat gelap)
            // if (allCahayaSame && currentData.cahaya === 0) {
            //     errors.cahaya = 'Sensor tidak responsif (nilai tetap 0)';
            //     hasError = true;
            // }
            
            // ✅ GANTI dengan: Hanya error jika nilai negatif atau di luar range max
            if (currentData.cahaya < 0) {
                errors.cahaya = 'Sensor cahaya error (nilai negatif)';
                hasError = true;
            } else if (currentData.cahaya > 100000) {
                errors.cahaya = 'Sensor cahaya error (nilai terlalu tinggi)';
                hasError = true;
            }
        }

        // Cek nilai tidak wajar (tegangan & arus saja, skip cahaya)
        const validation = validateSensorData(currentData);
        if (!validation.valid) {
            validation.errors.forEach(err => {
                // ✅ Hanya tambahkan error untuk tegangan dan arus
                // Skip error cahaya karena 0 adalah normal
                if (err.sensor !== 'cahaya' || (err.sensor === 'cahaya' && currentData.cahaya > 100000)) {
                    errors[err.sensor] = err.message;
                    hasError = true;
                }
            });
        }

        return {
            hasError,
            errors
        };

    } catch (error) {
        console.error('Error detection failed:', error);
        return { hasError: false, errors: {} };
    }
}

module.exports = {
    validateSensorData,
    detectSensorError
};
