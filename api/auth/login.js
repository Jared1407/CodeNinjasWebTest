// api/auth/login.js - Sensei login endpoint with JWT and rate limiting
import connectDB from '../../lib/mongodb.js';
import Sensei from '../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';
import { createToken } from '../../lib/auth.js';
import { checkRateLimit, getClientIP } from '../../lib/rateLimit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
        return res.status(429).json({
            error: 'Too many login attempts. Please try again later.',
            resetIn: rateLimit.resetIn
        });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        await connectDB();

        const sensei = await Sensei.findOne({ email: email.toLowerCase() });

        if (!sensei) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, sensei.passwordHash);

        if (match) {
            const user = {
                id: sensei._id.toString(),
                email: sensei.email,
                name: sensei.name,
                role: sensei.role || 'sensei',
                isAdmin: sensei.role === 'admin'
            };

            // Generate JWT token
            const token = await createToken(user);

            res.json({
                success: true,
                user: user,
                token: token
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
