// api/auth/login.js - Sensei login endpoint
import connectDB from '../../lib/mongodb.js';
import Sensei from '../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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
            res.json({
                success: true,
                user: {
                    id: sensei._id.toString(),
                    email: sensei.email,
                    name: sensei.name,
                    role: sensei.role || 'sensei',
                    isAdmin: sensei.role === 'admin'
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
