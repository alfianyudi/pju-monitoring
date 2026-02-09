// =========================================
// AUTH.JS - Authentication Middleware
// =========================================

/**
 * Middleware untuk cek autentikasi
 */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Unauthorized - Please login first' 
        });
    }
}

/**
 * Middleware untuk cek role admin
 */
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: 'Forbidden - Admin access required' 
        });
    }
}

module.exports = {
    isAuthenticated,
    isAdmin
};
