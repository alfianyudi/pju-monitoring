// =========================================
// RIWAYAT.JS - Table + Pagination + CSV Export
// =========================================

// Check authentication
checkAuth();

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabRaw = document.getElementById('tabRaw');
const tabMAF = document.getElementById('tabMAF');
const tableBodyRaw = document.getElementById('tableBodyRaw');
const tableBodyMAF = document.getElementById('tableBodyMAF');
const paginationRaw = document.getElementById('paginationRaw');
const paginationMAF = document.getElementById('paginationMAF');

const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const btnFilter = document.getElementById('btnFilter');
const btnReset = document.getElementById('btnReset');

const btnExportRaw = document.getElementById('btnExportRaw');
const btnExportMAF = document.getElementById('btnExportMAF');

const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// State
let currentTab = 'raw';
let currentPageRaw = 1;
let currentPageMAF = 1;
let filterStartDate = null;
let filterEndDate = null;
let allDataRaw = [];
let allDataMAF = [];

// Get user info
getUserInfo();

// Load initial data
loadData();

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

async function loadData(page = 1) {
    try {
        let url = `/api/sensor/riwayat?page=${page}&limit=50`;
        
        // Add date filter
        if (filterStartDate && filterEndDate) {
            url += `&startDate=${filterStartDate}&endDate=${filterEndDate}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            if (currentTab === 'raw') {
                allDataRaw = result.data;
                renderTableRaw(result.data);
                renderPaginationRaw(result.pagination);
                currentPageRaw = page;
            } else {
                allDataMAF = result.data;
                renderTableMAF(result.data);
                renderPaginationMAF(result.pagination);
                currentPageMAF = page;
            }
        }
    } catch (error) {
        console.error('Load data error:', error);
        showError('Gagal memuat data');
    }
}

function renderTableRaw(data) {
    if (data.length === 0) {
        tableBodyRaw.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    let html = '';
    data.forEach((item, index) => {
        const no = (currentPageRaw - 1) * 50 + index + 1;
        const datetime = formatDateTime(item.created_at);
        const gerak = item.gerak ? '<span class="badge badge-success">Ya</span>' : '<span class="badge badge-danger">Tidak</span>';
        const relay = item.relay_status ? '<span class="badge badge-success">ON</span>' : '<span class="badge badge-danger">OFF</span>';
        const keterangan = getKeterangan(item);
        
        html += `
            <tr>
                <td>${no}</td>
                <td>${datetime}</td>
                <td>${parseFloat(item.tegangan).toFixed(2)}</td>
                <td>${parseFloat(item.arus).toFixed(2)}</td>
                <td>${parseFloat(item.cahaya).toFixed(0)}</td>
                <td>${gerak}</td>
                <td>${relay}</td>
                <td>${keterangan}</td>
            </tr>
        `;
    });
    
    tableBodyRaw.innerHTML = html;
}

function renderTableMAF(data) {
    if (data.length === 0) {
        tableBodyMAF.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    let html = '';
    data.forEach((item, index) => {
        const no = (currentPageMAF - 1) * 50 + index + 1;
        const datetime = formatDateTime(item.created_at);
        const gerak = item.gerak ? '<span class="badge badge-success">Ya</span>' : '<span class="badge badge-danger">Tidak</span>';
        const relay = item.relay_status ? '<span class="badge badge-success">ON</span>' : '<span class="badge badge-danger">OFF</span>';
        const keterangan = getKeterangan(item);
        
        const mafTegangan = item.maf_tegangan ? parseFloat(item.maf_tegangan).toFixed(2) : '-';
        const mafArus = item.maf_arus ? parseFloat(item.maf_arus).toFixed(2) : '-';
        const mafCahaya = item.maf_cahaya ? parseFloat(item.maf_cahaya).toFixed(0) : '-';
        
        html += `
            <tr>
                <td>${no}</td>
                <td>${datetime}</td>
                <td>${mafTegangan}</td>
                <td>${mafArus}</td>
                <td>${mafCahaya}</td>
                <td>${gerak}</td>
                <td>${relay}</td>
                <td>${keterangan}</td>
            </tr>
        `;
    });
    
    tableBodyMAF.innerHTML = html;
}

function renderPaginationRaw(pagination) {
    if (!pagination) return;
    
    let html = '';
    
    // Previous button
    html += `<button ${pagination.currentPage === 1 ? 'disabled' : ''} onclick="loadData(${pagination.currentPage - 1})">← Prev</button>`;
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (
            i === 1 || 
            i === pagination.totalPages || 
            (i >= pagination.currentPage - 2 && i <= pagination.currentPage + 2)
        ) {
            html += `<button class="${i === pagination.currentPage ? 'active' : ''}" onclick="loadData(${i})">${i}</button>`;
        } else if (i === pagination.currentPage - 3 || i === pagination.currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }
    
    // Next button
    html += `<button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} onclick="loadData(${pagination.currentPage + 1})">Next →</button>`;
    
    paginationRaw.innerHTML = html;
}

function renderPaginationMAF(pagination) {
    if (!pagination) return;
    
    let html = '';
    
    // Previous button
    html += `<button ${pagination.currentPage === 1 ? 'disabled' : ''} onclick="loadData(${pagination.currentPage - 1})">← Prev</button>`;
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (
            i === 1 || 
            i === pagination.totalPages || 
            (i >= pagination.currentPage - 2 && i <= pagination.currentPage + 2)
        ) {
            html += `<button class="${i === pagination.currentPage ? 'active' : ''}" onclick="loadData(${i})">${i}</button>`;
        } else if (i === pagination.currentPage - 3 || i === pagination.currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }
    
    // Next button
    html += `<button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} onclick="loadData(${pagination.currentPage + 1})">Next →</button>`;
    
    paginationMAF.innerHTML = html;
}

function getKeterangan(item) {
    const cahaya = parseFloat(item.cahaya);
    const gerak = item.gerak;
    const relay = item.relay_status;
    
    if (cahaya >= 200) {
        return 'Siang - Lampu Mati';
    } else {
        if (gerak && relay) {
            return 'Malam - Gerak Terdeteksi - Lampu Menyala';
        } else if (!gerak && !relay) {
            return 'Malam - Tidak Ada Gerak - Lampu Mati';
        } else if (relay) {
            return 'Lampu Menyala (Manual)';
        } else {
            return 'Lampu Mati';
        }
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

function exportToCSV(data, filename, type = 'raw') {
    if (data.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    let csvContent = '';
    
    if (type === 'raw') {
        csvContent = 'No,Tanggal/Waktu,Tegangan (V),Arus (A),Cahaya (Lux),Gerak,Status Relay,Keterangan\n';
        data.forEach((item, index) => {
            const no = index + 1;
            const datetime = formatDateTime(item.created_at);
            const tegangan = parseFloat(item.tegangan).toFixed(2);
            const arus = parseFloat(item.arus).toFixed(2);
            const cahaya = parseFloat(item.cahaya).toFixed(0);
            const gerak = item.gerak ? 'Ya' : 'Tidak';
            const relay = item.relay_status ? 'ON' : 'OFF';
            const keterangan = getKeterangan(item);
            
            csvContent += `${no},"${datetime}",${tegangan},${arus},${cahaya},${gerak},${relay},"${keterangan}"\n`;
        });
    } else {
        csvContent = 'No,Tanggal/Waktu,MAF Tegangan (V),MAF Arus (A),MAF Cahaya (Lux),Gerak,Status Relay,Keterangan\n';
        data.forEach((item, index) => {
            const no = index + 1;
            const datetime = formatDateTime(item.created_at);
            const mafTegangan = item.maf_tegangan ? parseFloat(item.maf_tegangan).toFixed(2) : '-';
            const mafArus = item.maf_arus ? parseFloat(item.maf_arus).toFixed(2) : '-';
            const mafCahaya = item.maf_cahaya ? parseFloat(item.maf_cahaya).toFixed(0) : '-';
            const gerak = item.gerak ? 'Ya' : 'Tidak';
            const relay = item.relay_status ? 'ON' : 'OFF';
            const keterangan = getKeterangan(item);
            
            csvContent += `${no},"${datetime}",${mafTegangan},${mafArus},${mafCahaya},${gerak},${relay},"${keterangan}"\n`;
        });
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showError(message) {
    alert(message);
}

// =========================================
// EVENT LISTENERS
// =========================================

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/hide tab content
        if (tab === 'raw') {
            tabRaw.classList.add('active');
            tabMAF.classList.remove('active');
            currentTab = 'raw';
            loadData(1);
        } else {
            tabRaw.classList.remove('active');
            tabMAF.classList.add('active');
            currentTab = 'maf';
            loadData(1);
        }
    });
});

// Filter
btnFilter.addEventListener('click', () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
        alert('Silakan pilih tanggal mulai dan tanggal akhir');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
        return;
    }
    
    filterStartDate = startDate + ' 00:00:00';
    filterEndDate = endDate + ' 23:59:59';
    
    loadData(1);
});

// Reset filter
btnReset.addEventListener('click', () => {
    startDateInput.value = '';
    endDateInput.value = '';
    filterStartDate = null;
    filterEndDate = null;
    loadData(1);
});

// Export CSV Raw
btnExportRaw.addEventListener('click', async () => {
    try {
        // Fetch all data (no pagination)
        let url = '/api/sensor/riwayat?limit=10000';
        
        if (filterStartDate && filterEndDate) {
            url += `&startDate=${filterStartDate}&endDate=${filterEndDate}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `data_mentah_${timestamp}.csv`;
            exportToCSV(result.data, filename, 'raw');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Gagal mengekspor data');
    }
});

// Export CSV MAF
btnExportMAF.addEventListener('click', async () => {
    try {
        // Fetch all data (no pagination)
        let url = '/api/sensor/riwayat?limit=10000';
        
        if (filterStartDate && filterEndDate) {
            url += `&startDate=${filterStartDate}&endDate=${filterEndDate}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `data_maf_${timestamp}.csv`;
            exportToCSV(result.data, filename, 'maf');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Gagal mengekspor data');
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

// Make loadData globally accessible for pagination buttons
window.loadData = loadData;
