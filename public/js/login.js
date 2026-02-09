// =========================================
// LOGIN.JS - Login Page Logic
// =========================================

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Toggle password visibility
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Change icon
    const eyeIcon = togglePassword.querySelector('.eye-icon');
    eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
});

// Login form submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Validation
    if (!username || !password) {
        showError('Username dan password harus diisi');
        return;
    }
    
    // Hide error
    hideError();
    
    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Success - redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Show error
            showError(data.message || 'Login gagal. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
        // Hide loading
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        loginForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
    }
});

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'flex';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Auto-hide error after 5 seconds
let errorTimeout;
errorMessage.addEventListener('DOMSubtreeModified', () => {
    if (errorMessage.style.display === 'flex') {
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(hideError, 5000);
    }
});
