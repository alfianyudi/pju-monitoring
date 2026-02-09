// =========================================
// GRAFIK.JS - Chart.js Graphs + WebSocket
// =========================================

// Check authentication
checkAuth();

// WebSocket connection
const socket = io();

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const lastUpdate = document.getElementById('lastUpdate');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// Get user info
getUserInfo();

// Chart instances
let chartTegangan = null;
let chartArus = null;
let chartCahaya = null;

// Data arrays (max 100 data points)
const maxDataPoints = 100;
let dataLabels = [];
let dataTegangan = [];
let dataMafTegangan = [];
let dataArus = [];
let dataMafArus = [];
let dataCahaya = [];
let dataMafCahaya = [];

// Initialize charts
initCharts();

// Load initial data
loadHistoryData();

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
    updateCharts(data);
    lastUpdate.textContent = formatDateTime(data.timestamp || new Date().toISOString());
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

async function loadHistoryData() {
    try {
        const response = await fetch('/api/sensor/history?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
            // Reset arrays
            dataLabels = [];
            dataTegangan = [];
            dataMafTegangan = [];
            dataArus = [];
            dataMafArus = [];
            dataCahaya = [];
            dataMafCahaya = [];
            
            // Populate arrays
            result.data.forEach((item, index) => {
                dataLabels.push(index + 1);
                dataTegangan.push(parseFloat(item.tegangan));
                dataMafTegangan.push(parseFloat(item.maf_tegangan || item.tegangan));
                dataArus.push(parseFloat(item.arus));
                dataMafArus.push(parseFloat(item.maf_arus || item.arus));
                dataCahaya.push(parseFloat(item.cahaya));
                dataMafCahaya.push(parseFloat(item.maf_cahaya || item.cahaya));
            });
            
            // Update charts
            updateAllCharts();
        }
    } catch (error) {
        console.error('Load history error:', error);
    }
}

function initCharts() {
    // Chart Tegangan
    const ctxTegangan = document.getElementById('chartTegangan').getContext('2d');
    chartTegangan = new Chart(ctxTegangan, {
        type: 'line',
        data: {
            labels: dataLabels,
            datasets: [
                {
                    label: 'Data Mentah',
                    data: dataTegangan,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Data MAF',
                    data: dataMafTegangan,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Tegangan (V)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data Point'
                    }
                }
            }
        }
    });
    
    // Chart Arus
    const ctxArus = document.getElementById('chartArus').getContext('2d');
    chartArus = new Chart(ctxArus, {
        type: 'line',
        data: {
            labels: dataLabels,
            datasets: [
                {
                    label: 'Data Mentah',
                    data: dataArus,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Data MAF',
                    data: dataMafArus,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Arus (A)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data Point'
                    }
                }
            }
        }
    });
    
    // Chart Cahaya
    const ctxCahaya = document.getElementById('chartCahaya').getContext('2d');
    chartCahaya = new Chart(ctxCahaya, {
        type: 'line',
        data: {
            labels: dataLabels,
            datasets: [
                {
                    label: 'Data Mentah',
                    data: dataCahaya,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Data MAF',
                    data: dataMafCahaya,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cahaya (Lux)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data Point'
                    }
                }
            }
        }
    });
}

function updateCharts(data) {
    // Add new data
    dataLabels.push(dataLabels.length + 1);
    dataTegangan.push(parseFloat(data.tegangan));
    dataMafTegangan.push(parseFloat(data.maf_tegangan || data.tegangan));
    dataArus.push(parseFloat(data.arus));
    dataMafArus.push(parseFloat(data.maf_arus || data.arus));
    dataCahaya.push(parseFloat(data.cahaya));
    dataMafCahaya.push(parseFloat(data.maf_cahaya || data.cahaya));
    
    // Keep only last 100 data points
    if (dataLabels.length > maxDataPoints) {
        dataLabels.shift();
        dataTegangan.shift();
        dataMafTegangan.shift();
        dataArus.shift();
        dataMafArus.shift();
        dataCahaya.shift();
        dataMafCahaya.shift();
        
        // Re-index labels
        dataLabels = dataLabels.map((_, index) => index + 1);
    }
    
    updateAllCharts();
}

function updateAllCharts() {
    // Update Tegangan
    chartTegangan.data.labels = dataLabels;
    chartTegangan.data.datasets[0].data = dataTegangan;
    chartTegangan.data.datasets[1].data = dataMafTegangan;
    chartTegangan.update('none');
    
    // Update Arus
    chartArus.data.labels = dataLabels;
    chartArus.data.datasets[0].data = dataArus;
    chartArus.data.datasets[1].data = dataMafArus;
    chartArus.update('none');
    
    // Update Cahaya
    chartCahaya.data.labels = dataLabels;
    chartCahaya.data.datasets[0].data = dataCahaya;
    chartCahaya.data.datasets[1].data = dataMafCahaya;
    chartCahaya.update('none');
}

function updateConnectionStatus(connected) {
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.childNodes[2];
    
    if (connected) {
        statusDot.className = 'status-dot status-on';
        statusText.textContent = 'Connected';
    } else {
        statusDot.className = 'status-dot status-off';
        statusText.textContent = 'Disconnected';
    }
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
