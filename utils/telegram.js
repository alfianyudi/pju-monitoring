// =========================================
// TELEGRAM.JS - Telegram Bot Integration
// =========================================

const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Mengirim notifikasi ke Telegram
 * @param {String} message - Pesan yang akan dikirim
 * @returns {Boolean} Status pengiriman
 */
async function sendTelegramNotification(message) {
    try {
        // Cek apakah token dan chat ID sudah diset
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.warn('⚠️ Telegram bot token atau chat ID belum diset');
            return false;
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        if (response.data.ok) {
            console.log('✅ Telegram notification sent');
            return true;
        } else {
            console.error('❌ Telegram notification failed:', response.data);
            return false;
        }

    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        return false;
    }
}

/**
 * Test koneksi Telegram bot
 */
async function testTelegramConnection() {
    try {
        if (!TELEGRAM_BOT_TOKEN) {
            console.log('⚠️ Telegram bot token belum diset di .env');
            return false;
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
        const response = await axios.get(url);

        if (response.data.ok) {
            console.log('✅ Telegram bot connected:', response.data.result.username);
            return true;
        }

        return false;

    } catch (error) {
        console.error('❌ Telegram connection test failed:', error.message);
        return false;
    }
}

module.exports = {
    sendTelegramNotification,
    testTelegramConnection
};
