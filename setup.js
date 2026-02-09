// =========================================
// SETUP.JS - Initial Setup Helper
// =========================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setup() {
    console.log('🚀 Starting setup...\n');
    
    try {
        // Connect to MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        
        console.log('✅ Connected to MySQL');
        
        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'PJU_MAF'}`);
        console.log(`✅ Database created: ${process.env.DB_NAME || 'PJU_MAF'}`);
        
        await connection.query(`USE ${process.env.DB_NAME || 'PJU_MAF'}`);
        
        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin','user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created: users');
        
        // Create sensor_data table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tegangan DECIMAL(6,2) NOT NULL,
                arus DECIMAL(6,2) NOT NULL,
                cahaya DECIMAL(8,2) NOT NULL,
                gerak BOOLEAN DEFAULT FALSE,
                relay_status BOOLEAN DEFAULT FALSE,
                maf_tegangan DECIMAL(6,2),
                maf_arus DECIMAL(6,2),
                maf_cahaya DECIMAL(8,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Table created: sensor_data');
        
        // Create system_config table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(50) NOT NULL UNIQUE,
                config_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created: system_config');
        
        // Insert default config
        const configs = [
            ['relay_mode', 'auto'],
            ['relay_status', 'false'],
            ['maf_window_size', '10'],
            ['light_threshold', '200'],
            ['maf_enabled', 'true'],
            ['voltage_min', '150'],
            ['voltage_max', '300'],
            ['current_min', '0'],
            ['current_max', '10'],
            ['light_min', '0'],
            ['light_max', '100000']
        ];
        
        for (const [key, value] of configs) {
            await connection.query(
                'INSERT IGNORE INTO system_config (config_key, config_value) VALUES (?, ?)',
                [key, value]
            );
        }
        console.log('✅ Default config inserted');
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
            'INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
            ['admin', hashedPassword, 'admin']
        );
        console.log('✅ Admin user created (username: admin, password: admin123)');
        
        await connection.end();
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Configure your .env file (copy from .env.example)');
        console.log('2. Setup Telegram Bot (optional but recommended)');
        console.log('3. Run: npm start');
        console.log('4. Open: http://localhost:3003');
        console.log('5. Login with: admin / admin123');
        console.log('\n⚠️  IMPORTANT: Change the default admin password after first login!\n');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
