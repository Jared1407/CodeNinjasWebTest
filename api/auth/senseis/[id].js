// api/auth/senseis/[id].js - Delete a sensei
import connectDB from '../../../lib/mongodb.js';
import Sensei from '../../../lib/models/Sensei.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { adminPassword } = req.body;

    if (!id || !adminPassword) {
        return res.status(400).json({ error: 'Sensei ID and admin password required' });
    }

    try {
        await connectDB();

        // Verify admin password
        const admin = await Sensei.findOne({ role: 'admin' });

        if (!admin) {
            return res.status(403).json({ error: 'No admin found' });
        }

        // Don't allow deleting the last admin
        const admins = await Sensei.countDocuments({ role: 'admin' });
        const toDelete = await Sensei.findById(id);

        if (toDelete?.role === 'admin' && admins <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin' });
        }

        const adminValid = await bcrypt.compare(adminPassword, admin.passwordHash);
        if (!adminValid) {
            return res.status(403).json({ error: 'Admin verification failed' });
        }

        await Sensei.findByIdAndDelete(id);

        res.json({ success: true });
    } catch (err) {
        console.error('Delete sensei error:', err);
        res.status(500).json({ error: 'Failed to delete sensei' });
    }
}
