// api/auth/senseis/index.js - List all senseis (authenticated, admins see emails)
import connectDB from '../../../lib/mongodb.js';
import Sensei from '../../../lib/models/Sensei.js';
import { requireAuth } from '../../../lib/requireAuth.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();

        // Determine what fields to return based on user role
        const isAdmin = req.user && req.user.isAdmin;

        const projection = isAdmin
            ? { _id: 1, email: 1, name: 1, role: 1, createdAt: 1 }  // Admins see emails
            : { _id: 1, name: 1, role: 1, createdAt: 1 };           // Non-admins don't

        const senseis = await Sensei.find({}, projection);

        // Transform to match existing API format
        const result = senseis.map(s => {
            const item = {
                id: s._id.toString(),
                name: s.name,
                role: s.role,
                createdAt: s.createdAt
            };
            if (isAdmin && s.email) {
                item.email = s.email;
            }
            return item;
        });

        res.json(result);
    } catch (err) {
        console.error('Get senseis error:', err);
        res.status(500).json({ error: 'Failed to fetch senseis' });
    }
}

// Require authentication to view senseis list
export default requireAuth(handler);
