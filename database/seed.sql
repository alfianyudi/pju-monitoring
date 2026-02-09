USE PJU_MAF;

-- =========================================
-- INSERT DEFAULT USER
-- Username: admin
-- Password: admin123
-- =========================================
-- Hash bcrypt untuk 'admin123' (rounds=10)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2b$10$rBV2cFxXYzU5N8Y3q0QqCOxKJHGZJ5vZ3h5zF8jF8wF0rKZ5F0F0F', 'admin');

-- Note: Password hash di atas adalah contoh
-- Nanti akan di-generate ulang saat server pertama kali jalan
