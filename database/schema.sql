-- =========================================
-- DATABASE: PJU_MAF
-- Sistem Monitoring Lampu Penerangan Jalan Solar Cell
-- =========================================

DROP DATABASE IF EXISTS PJU_MAF;
CREATE DATABASE PJU_MAF CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE PJU_MAF;

-- =========================================
-- TABEL USERS (LOGIN)
-- =========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================
-- TABEL SENSOR DATA
-- Menyimpan data mentah + hasil Moving Average Filter
-- =========================================
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tegangan DECIMAL(6,2) NOT NULL,
    arus DECIMAL(6,2) NOT NULL,
    cahaya DECIMAL(8,2) NOT NULL,
    gerak BOOLEAN DEFAULT FALSE,
    relay_status BOOLEAN DEFAULT FALSE,
    -- Hasil Moving Average Filter
    maf_tegangan DECIMAL(6,2),
    maf_arus DECIMAL(6,2),
    maf_cahaya DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
);

-- =========================================
-- TABEL SYSTEM CONFIG
-- Konfigurasi sistem (mode relay, threshold, MAF window)
-- =========================================
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================
-- DATA AWAL SYSTEM CONFIG
-- =========================================
INSERT INTO system_config (config_key, config_value) VALUES
('relay_mode', 'auto'),              -- auto / manual
('relay_status', 'false'),           -- true / false
('maf_window_size', '10'),           -- window size untuk MAF
('light_threshold', '200'),          -- threshold cahaya (lux)
('maf_enabled', 'true'),             -- enable/disable MAF
('voltage_min', '150'),              -- batas minimal tegangan (V)
('voltage_max', '300'),              -- batas maksimal tegangan (V)
('current_min', '0'),                -- batas minimal arus (A)
('current_max', '10'),               -- batas maksimal arus (A)
('light_min', '0'),                  -- batas minimal cahaya (Lux)
('light_max', '100000');             -- batas maksimal cahaya (Lux)
