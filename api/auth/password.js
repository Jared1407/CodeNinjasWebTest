// api/auth/password.js - Change password endpoint
import connectDB from '../../lib/mongodb.js';
import Sensei from '../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Email, current password, and new password required' });
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
