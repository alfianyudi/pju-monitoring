// =========================================
// SETTINGS.JS - Settings Page Logic
// =========================================

// Check authentication
checkAuth();

// DOM Elements
const configForm = document.getElementById('configForm');
const passwordForm = document.getElementById('passwordForm');
const btnResetConfig = document.getElementById('btnResetConfig');

const lightThresholdInput = document.getElementById('lightThreshold');
const mafWindowSizeInput = document.getElementById('mafWindowSize');

const oldPasswordInput = document.getElementById('oldPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// Get user info
getUserInfo();

// Load current settings
loadSettings();

// =========================================
// FUNCTIONS
// =========================================

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

async function getUserInfo() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.success && data.user) {
            userName.textContent = data.user.username;
        }
    } catch (error) {
        console.error('Get user info error:', error);
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
            lightThresholdInput.value = data.settings.light_threshold || 200;
            mafWindowSizeInput.value = data.settings.maf_window_size || 10;
        }
    } catch (error) {
        console.error('Load settings error:', error);
    }
}

function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// =========================================
// EVENT LISTENERS
// =========================================

// Save configuration
configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const lightThreshold = lightThresholdInput.value;
    const mafWindowSize = mafWindowSizeInput.value;
    
    // Validation
    if (lightThreshold < 0 || lightThreshold > 1000) {
        showToast('Threshold cahaya harus antara 0-1000 Lux', 'error');
        return;
    }
    
    if (mafWindowSize < 3 || mafWindowSize > 50) {
        showToast('MAF Window Size harus antara 3-50', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/settings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                light_threshold: lightThreshold,
                maf_window_size: mafWindowSize
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Pengaturan berhasil disimpan', 'success');
        } else {
            showToast(data.message || 'Gagal menyimpan pengaturan', 'error');
        }
    } catch (error) {
        console.error('Save settings error:', error);
        showToast('Terjadi kesalahan saat menyimpan', 'error');
    }
});

// Reset to default
btnResetConfig.addEventListener('click', async () => {
    if (!confirm('Apakah Anda yakin ingin reset pengaturan ke default?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/settings/reset', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            lightThresholdInput.value = 200;
            mafWindowSizeInput.value = 10;
            showToast('Pengaturan berhasil direset ke default', 'success');
        } else {
            showToast(data.message || 'Gagal reset pengaturan', 'error');
        }
    } catch (error) {
        console.error('Reset settings error:', error);
        showToast('Terjadi kesalahan saat reset', 'error');
    }
});

// Change password
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
        showToast('Semua field harus diisi', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password baru minimal 6 karakter', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Konfirmasi password tidak sama', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oldPassword,
                newPassword,
                confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Password berhasil diubah', 'success');
            passwordForm.reset();
        } else {
            showToast(data.message || 'Gagal mengubah password', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Terjadi kesalahan saat mengubah password', 'error');
    }
});

// Logout
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (confirm('Apakah Anda yakin ingin logout?')) {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
});
```

---

## 📁 **File: `.gitignore`**
```
# Node modules
node_modules/

# Environment variables
.env

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
