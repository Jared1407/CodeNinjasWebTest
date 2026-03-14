// lib/requireAuth.js - Authentication Middleware
import { verifyToken, extractToken } from './auth.js';

/**
 * Higher-order function that wraps an API handler with authentication
 * @param {Function} handler - The API handler function
 * @param {Object} options - Options for auth requirements
 * @param {boolean} options.adminOnly - Require admin role
 * @returns {Function} Wrapped handler
 */
export function requireAuth(handler, options = {}) {
    return async (req, res) => {
        const authHeader = req.headers.authorization;
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Check admin requirement
        if (options.adminOnly && !payload.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Attach user to request
        req.user = payload;

        // Call the original handler
        return handler(req, res);
    };
}

/**
 * Middleware for admin-only routes
 */
export function requireAdmin(handler) {
    return requireAuth(handler, { adminOnly: true });
}
