// lib/auth.js - JWT Authentication Helpers
import { SignJWT, jwtVerify } from 'jose';

// Secret key for JWT signing - MUST be set via environment variable
const getSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return new TextEncoder().encode(secret);
};

// Token expiration (24 hours)
const TOKEN_EXPIRY = '24h';

/**
 * Create a JWT token for an authenticated user
 * @param {Object} user - User object with id, email, role
 * @returns {Promise<string>} JWT token
 */
export async function createToken(user) {
    const token = await new SignJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .sign(getSecretKey());

    return token;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        return payload;
    } catch (err) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
