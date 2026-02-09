// =========================================
// MAF.JS - Moving Average Filter Calculator
// =========================================

/**
 * Menghitung Moving Average Filter (MAF) untuk sensor
 * @param {Object} pool - MySQL connection pool
 * @param {Number} windowSize - Ukuran window MAF (default: 10)
 * @returns {Object} Hasil MAF untuk tegangan, arus, dan cahaya
 */
async function calculateMAF(pool, windowSize = 10) {
    try {
        // Ambil N data terakhir
        const [rows] = await pool.query(
            'SELECT tegangan, arus, cahaya FROM sensor_data ORDER BY created_at DESC LIMIT ?',
            [windowSize]
        );

        if (rows.length === 0) {
            return null;
        }

        // Hitung rata-rata untuk setiap sensor
        const totalData = rows.length;
        
        let sumTegangan = 0;
        let sumArus = 0;
        let sumCahaya = 0;

        rows.forEach(row => {
            sumTegangan += parseFloat(row.tegangan);
            sumArus += parseFloat(row.arus);
            sumCahaya += parseFloat(row.cahaya);
        });

        const mafResult = {
            maf_tegangan: (sumTegangan / totalData).toFixed(2),
            maf_arus: (sumArus / totalData).toFixed(2),
            maf_cahaya: (sumCahaya / totalData).toFixed(2)
        };

        return mafResult;

    } catch (error) {
        console.error('MAF calculation error:', error);
        return null;
    }
}

module.exports = calculateMAF;
