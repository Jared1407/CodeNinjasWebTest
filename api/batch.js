// api/batch.js - Batch endpoint to load multiple collections in a single request
// Reduces startup from 12 HTTP requests to 1
import connectDB from '../lib/mongodb.js';
import { getCollectionModel } from '../lib/models/Collection.js';

const validCollections = [
    'news', 'rules', 'coins', 'catalog', 'requests', 'queue',
    'leaderboard', 'jams', 'jamSubmissions', 'games', 'challenges', 'settings'
];

// Exclude internal MongoDB fields from response to reduce payload
const PROJECTION = { _id: 0, __v: 0 };

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse requested collections from query string
    const requested = req.query.collections
        ? req.query.collections.split(',').filter(c => validCollections.includes(c))
        : validCollections;

    if (requested.length === 0) {
        return res.status(400).json({ error: 'No valid collections specified' });
    }

    try {
        await connectDB();

        // Load all requested collections in parallel with a single DB connection
        const results = {};
        await Promise.all(requested.map(async (col) => {
            const Model = getCollectionModel(col);
            results[col] = await Model.find({}, PROJECTION).lean();
        }));

        // Cache for 30 seconds to avoid refetching on navigation
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
        res.json(results);
    } catch (err) {
        console.error('Batch load error:', err);
        res.status(500).json({ error: 'Failed to load collections' });
    }
}
