// api/[collection]/index.js - Collection CRUD operations
// GET is public, mutations require authentication
import connectDB from '../../lib/mongodb.js';
import { getCollectionModel } from '../../lib/models/Collection.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    const { collection } = req.query;

    // Validate collection name
    const validCollections = [
        'news', 'rules', 'coins', 'catalog', 'requests', 'queue',
        'leaderboard', 'jams', 'jamSubmissions', 'games', 'challenges', 'settings'
    ];

    if (!validCollections.includes(collection)) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    try {
        await connectDB();
        const Model = getCollectionModel(collection);

        // GET - List all items in collection (PUBLIC - no auth required)
        if (req.method === 'GET') {
            const items = await Model.find({});
            // Transform _id to id for frontend compatibility
            const result = items.map(item => {
                const obj = item.toObject();
                return obj;
            });
            return res.json(result);
        }

        // For mutations (POST, PUT, DELETE), require authentication
        const token = extractToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const user = await verifyToken(token);
        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // POST - Add new item
        if (req.method === 'POST') {
            const id = `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newItem = await Model.create({
                id: id,
                ...req.body,
                createdAt: req.body.createdAt || Date.now()
            });
            return res.json(newItem.toObject());
        }

        // PUT - Replace entire collection
        if (req.method === 'PUT') {
            // Delete all existing items
            await Model.deleteMany({});

            // Insert new items (if array provided)
            if (Array.isArray(req.body)) {
                const items = req.body.map(item => ({
                    id: item.id || `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...item,
                    createdAt: item.createdAt || Date.now()
                }));
                if (items.length > 0) {
                    await Model.insertMany(items);
                }
            }
            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (err) {
        console.error(`Collection ${collection} error:`, err);
        res.status(500).json({ error: 'Database operation failed' });
    }
}
