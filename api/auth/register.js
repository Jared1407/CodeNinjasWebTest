// api/auth/register.js - Register new Sensei endpoint
import connectDB from '../../lib/mongodb.js';
import Sensei from '../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, name, adminPassword } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name required' });
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
