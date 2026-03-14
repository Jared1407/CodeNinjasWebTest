// api/[collection]/[id].js - Single item CRUD operations
// GET is public, mutations require authentication
import connectDB from '../../lib/mongodb.js';
import { getCollectionModel } from '../../lib/models/Collection.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    const { collection, id } = req.query;

    // Validate collection name
    const validCollections = [
        'news', 'rules', 'coins', 'catalog', 'requests', 'queue',
        'leaderboard', 'jams', 'jamSubmissions', 'games', 'challenges', 'sandboxSubmissions', 'sandboxChallenges', 'settings'
    ];

    if (!validCollections.includes(collection)) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    try {
        await connectDB();
        const Model = getCollectionModel(collection);

        // GET - Get single item (PUBLIC - no auth required)
        if (req.method === 'GET') {
            const item = await Model.findOne({ id: id }).lean();
            if (item) {
                return res.json(item);
            } else {
                return res.status(404).json({ error: 'Item not found' });
            }
        }

        // For mutations (PUT, DELETE), require authentication
        // Exception: leaderboard PUT is allowed without auth for ninja point deductions
        // TODO: Move point deductions server-side to close this properly (see BUG-1 in audit)
        const isPublicPut = req.method === 'PUT' && collection === 'leaderboard';

        let user = null;
        if (req.method !== 'GET' && !isPublicPut) {
            const token = extractToken(req.headers.authorization);
            if (!token) {
                return res.status(401).json({ error: `Authentication required for ${req.method} on ${collection}` });
            }
            user = await verifyToken(token);
            if (!user) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        }

        // PUT - Update item
        if (req.method === 'PUT') {
            const item = await Model.findOneAndUpdate(
                { id: id },
                { $set: req.body },
                { new: true }
            );
            if (item) {
                return res.json(item.toObject());
            } else {
                return res.status(404).json({ error: 'Item not found' });
            }
        }

        // DELETE - Remove item
        if (req.method === 'DELETE') {
            const result = await Model.findOneAndDelete({ id: id });
            if (result) {
                return res.json({ success: true });
            } else {
                return res.status(404).json({ error: 'Item not found' });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (err) {
        console.error(`Item ${id} in ${collection} error:`, err);
        res.status(500).json({ error: 'Database operation failed' });
    }
}
