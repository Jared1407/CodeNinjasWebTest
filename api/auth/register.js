// api/auth/register.js - Register new Sensei endpoint
import connectDB from '../../lib/mongodb.js';
import Sensei from '../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../lib/requireAuth.js';
import { checkRateLimit, getClientIP } from '../../lib/rateLimit.js';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, 3, 300000); // 3 attempts per 5 minutes
    if (!rateLimit.allowed) {
        return res.status(429).json({
            error: 'Too many registration attempts. Please try again later.',
            resetIn: rateLimit.resetIn
        });
    }

    const { email, password, name, adminPassword } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Password complexity validation
    if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    try {
        await connectDB();

        // Verify admin password first
        const admin = await Sensei.findOne({ role: 'admin' });

        if (!admin) {
            return res.status(403).json({ error: 'No admin found' });
        }

        const adminValid = await bcrypt.compare(adminPassword, admin.passwordHash);
        if (!adminValid) {
            return res.status(403).json({ error: 'Admin verification failed' });
        }

        // Check if email already exists
        const existing = await Sensei.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new sensei
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const newSensei = await Sensei.create({
            email: email.toLowerCase(),
            name: name,
            passwordHash: hash,
            role: 'sensei',
            createdAt: Date.now()
        });

        res.json({
            success: true,
            user: {
                id: newSensei._id.toString(),
                email: newSensei.email,
                name: newSensei.name,
                role: newSensei.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
}

// Require admin authentication to register new senseis
export default requireAuth(handler, { adminOnly: true });
