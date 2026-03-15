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
        'leaderboard', 'jams', 'jamSubmissions', 'games', 'challenges', 'sandboxSubmissions', 'sandboxChallenges', 'settings'
    ];

    if (!validCollections.includes(collection)) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    try {
        await connectDB();
        const Model = getCollectionModel(collection);

        // GET - List all items in collection (PUBLIC - no auth required)
        if (req.method === 'GET') {
            const items = await Model.find({}).lean();
            return res.json(items);
        }

        // For mutations (POST, PUT, DELETE), require authentication
        // Exception: Ninjas can submit to these collections without a token
        const publicPostCollections = ['requests', 'jamSubmissions', 'sandboxSubmissions'];
        const isPublicPost = req.method === 'POST' && publicPostCollections.includes(collection);

        let user = null;
        if (req.method !== 'GET' && !isPublicPost) {
            const token = extractToken(req.headers.authorization);
            if (!token) {
                return res.status(401).json({ error: `Authentication required for ${req.method} on ${collection}` });
            }
            user = await verifyToken(token);
            if (!user) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
        }

        // POST - Add new item
        if (req.method === 'POST') {
            // Reject excessively large payloads (50KB limit)
            const bodySize = JSON.stringify(req.body).length;
            if (bodySize > 50000) {
                return res.status(413).json({ error: 'Request body too large' });
            }

            // --- Server-side Point Deduction Logic ---
            if (collection === 'requests' && req.body.cost) {
                const cost = parseInt(req.body.cost) || 0;
                if (cost > 0 && req.body.ninjaId) {
                    const LeaderboardModel = getCollectionModel('leaderboard');
                    // We must deduct the points before continuing
                    const ninja = await LeaderboardModel.findOne({ id: req.body.ninjaId }).lean();
                    
                    if (!ninja || (ninja.points || 0) < cost) {
                        return res.status(400).json({ error: 'Insufficient points or ninja not found.' });
                    }
                    
                    await LeaderboardModel.findOneAndUpdate(
                        { id: req.body.ninjaId },
                        { $inc: { points: -cost } }
                    );
                }
            }
            // -----------------------------------------

            const id = `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newItem = await Model.create({
                id: id,
                ...req.body,
                createdAt: req.body.createdAt || Date.now()
            });
            return res.json(newItem.toObject());
        }

        // PUT - Replace entire collection (ADMIN ONLY)
        if (req.method === 'PUT') {
            if (!user || (!user.isAdmin && user.role !== 'admin')) {
                return res.status(403).json({ error: 'Admin access required for collection replacement' });
            }
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
