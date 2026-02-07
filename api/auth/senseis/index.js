// api/auth/senseis/index.js - List all senseis
import connectDB from '../../../lib/mongodb.js';
import Sensei from '../../../lib/models/Sensei.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const senseis = await Sensei.find({}, {
            _id: 1,
            email: 1,
            name: 1,
            role: 1,
            createdAt: 1
        });

        // Transform to match existing API format
        const result = senseis.map(s => ({
            id: s._id.toString(),
            email: s.email,
            name: s.name,
            role: s.role,
            createdAt: s.createdAt
        }));

        res.json(result);
    } catch (err) {
        console.error('Get senseis error:', err);
        res.status(500).json({ error: 'Failed to fetch senseis' });
    }
}
