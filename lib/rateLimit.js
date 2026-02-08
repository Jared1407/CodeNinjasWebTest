// lib/rateLimit.js - Simple Rate Limiting
// Note: This is in-memory and resets on cold starts. For production,
// consider using Vercel KV, Upstash Redis, or similar.

const attempts = new Map();

/**
 * Check and update rate limit for an IP
 * @param {string} ip - Client IP address
 * @param {number} maxAttempts - Max attempts per window (default: 5)
 * @param {number} windowMs - Time window in ms (default: 60000 = 1 min)
 * @returns {Object} { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(ip, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const key = `login:${ip}`;

    // Get current record
    let record = attempts.get(key);

    // Clean up expired record
    if (record && now > record.resetAt) {
        attempts.delete(key);
        record = null;
    }

    // Create new record if none exists
    if (!record) {
        record = {
            count: 0,
            resetAt: now + windowMs
        };
    }

    // Increment count
    record.count++;
    attempts.set(key, record);

    const allowed = record.count <= maxAttempts;
    const remaining = Math.max(0, maxAttempts - record.count);
    const resetIn = Math.max(0, Math.ceil((record.resetAt - now) / 1000));

    return { allowed, remaining, resetIn };
}

/**
 * Get client IP from Vercel request
 * @param {Object} req - Request object
 * @returns {string} IP address
 */
export function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'unknown';
}
