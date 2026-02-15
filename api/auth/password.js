// api/auth/password.js - Change password endpoint
import connectDB from '../../lib/mongodb.js';
import Sensei from '../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../lib/requireAuth.js';
import { checkRateLimit, getClientIP } from '../../lib/rateLimit.js';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Email, current password, and new password required' });
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, 5, 300000); // 5 attempts per 5 minutes
    if (!rateLimit.allowed) {
        return res.status(429).json({
            error: 'Too many password change attempts. Please try again later.',
            resetIn: rateLimit.resetIn
        });
    }

    // Ensure the authenticated user is changing their own password
    if (req.user.email !== email.toLowerCase()) {
        return res.status(403).json({ error: 'You can only change your own password' });
    }

    // Password complexity validation
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    try {
        await connectDB();

        const sensei = await Sensei.findOne({ email: email.toLowerCase() });

        if (!sensei) {
            return res.status(404).json({ error: 'Sensei not found' });
        }

        const valid = await bcrypt.compare(currentPassword, sensei.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        sensei.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await sensei.save();

        res.json({ success: true });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ error: 'Password change failed' });
    }
}

// Require authentication to change password
export default requireAuth(handler);
