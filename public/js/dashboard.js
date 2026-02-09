// =========================================
// DASHBOARD.JS - Dashboard Logic + WebSocket
// =========================================

// Check authentication
checkAuth();

// WebSocket connection
const socket = io();

// DOM Elements
const teganganValue = document.getElementById('teganganValue');
const arusValue = document.getElementById('arusValue');
const cahayaValue = document.getElementById('cahayaValue');
const gerakValue = document.getElementById('gerakValue');

const teganganTime = document.getElementById('teganganTime');
const arusTime = document.getElementById('arusTime');
const cahayaTime = document.getElementById('cahayaTime');
const gerakTime = document.getElementById('gerakTime');

const relayStatusIndicator = document.getElementById('relayStatusIndicator');
const relayStatusText = document.getElementById('relayStatusText');
const connectionStatus = document.getElementById('connectionStatus');
const lastUpdate = document.getElementById('lastUpdate');

const btnAuto = document.getElementById('btnAuto');
const btnManual = document.getElementById('btnManual');
const manualControl = document.getElementById('manualControl');
const btnRelayOn = document.getElementById('btnRelayOn');
const btnRelayOff = document.getElementById('btnRelayOff');

const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// Get user info
getUserInfo();

// Load initial data
loadInitialData();

// Load relay status
loadRelayStatus();

// =========================================
// WEBSOCKET EVENTS
// =========================================

socket.on('connect', () => {
    console.log('✅ WebSocket connected');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
    updateConnectionStatus(false);
});

socket.on('sensor_update', (data) => {
    console.log('📡 Sensor update:', data);
    updateDashboard(data);
});

socket.on('relay_changed', (data) => {
    console.log('🔦 Relay changed:', data);
    updateRelayStatus(data.status);
});

socket.on('mode_changed', (data) => {
    console.log('⚙️ Mode changed:', data);
    updateModeUI(data.mode);
});

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

async function loadInitialData() {
    try {
        const response = await fetch('/api/sensor/latest');
        const data = await response.json();
        
        if (data.success && data.data) {
            updateDashboard(data.data);
        }
    } catch (error) {
        console.error('Load initial data error:', error);
    }
}

async function loadRelayStatus() {
    try {
        const response = await fetch('/api/relay/status');
        const data = await response.json();
        
        if (data.success) {
            updateModeUI(data.mode);
            updateRelayStatus(data.status);
        }
    } catch (error) {
        console.error('Load relay status error:', error);
    }
}

function updateDashboard(data) {
    // Update values
    teganganValue.textContent = parseFloat(data.tegangan).toFixed(2);
    arusValue.textContent = parseFloat(data.arus).toFixed(2);
    cahayaValue.textContent = parseFloat(data.cahaya).toFixed(0);
    gerakValue.textContent = data.gerak ? 'Terdeteksi' : 'Tidak Terdeteksi';
    
    // Update time
    const time = formatTime(data.created_at || data.timestamp);
    teganganTime.textContent = `Update: ${time}`;
    arusTime.textContent = `Update: ${time}`;
    cahayaTime.textContent = `Update: ${time}`;
    gerakTime.textContent = `Update: ${time}`;
    
    // Update last update
    lastUpdate.textContent = formatDateTime(data.created_at || data.timestamp);
    
    // Update relay status
    if (data.relay_status !== undefined) {
        updateRelayStatus(data.relay_status);
    }
}

function updateRelayStatus(status) {
    const statusDot = relayStatusIndicator.querySelector('.status-dot');
    
    if (status) {
        statusDot.className = 'status-dot status-on';
        relayStatusText.textContent = 'ON';
    } else {
        statusDot.className = 'status-dot status-off';
        relayStatusText.textContent = 'OFF';
    }
}

function updateConnectionStatus(connected) {
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.childNodes[2]; // Text node
    
    if (connected) {
        statusDot.className = 'status-dot status-on';
        statusText.textContent = 'Connected';
    } else {
        statusDot.className = 'status-dot status-off';
        statusText.textContent = 'Disconnected';
    }
}

function updateModeUI(mode) {
    if (mode === 'auto') {
        btnAuto.classList.add('active');
        btnManual.classList.remove('active');
        manualControl.style.display = 'none';
    } else {
        btnAuto.classList.remove('active');
        btnManual.classList.add('active');
        manualControl.style.display = 'flex';
    }
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// =========================================
// EVENT LISTENERS
// =========================================

// Mode toggle
btnAuto.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/relay/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'auto' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateModeUI('auto');
            showToast('Mode diubah ke AUTO', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Set mode error:', error);
        showToast('Terjadi kesalahan', 'error');
    }
});

btnManual.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/relay/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'manual' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateModeUI('manual');
            showToast('Mode diubah ke MANUAL', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Set mode error:', error);
        showToast('Terjadi kesalahan', 'error');
    }
});

// Manual control
btnRelayOn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/relay/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Relay ON', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Relay control error:', error);
        showToast('Terjadi kesalahan', 'error');
    }
});

btnRelayOff.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/relay/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: false })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Relay OFF', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Relay control error:', error);
        showToast('Terjadi kesalahan', 'error');
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

// Toast notification
function showToast(message, type = 'info') {
    // Create toast element if not exists
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
