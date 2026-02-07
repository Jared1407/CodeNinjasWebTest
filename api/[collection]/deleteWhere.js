// api/[collection]/deleteWhere.js - Bulk delete with filter
import connectDB from '../../lib/mongodb.js';
import { getCollectionModel } from '../../lib/models/Collection.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { collection } = req.query;
    const { filter } = req.body; // e.g., { field: 'points', value: 0 }

    // Validate collection name
    const validCollections = [
        'news', 'rules', 'coins', 'catalog', 'requests', 'queue',
        'leaderboard', 'jams', 'jamSubmissions', 'games', 'challenges', 'settings'
    ];

    if (!validCollections.includes(collection)) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    if (!filter || !filter.field) {
        return res.status(400).json({ error: 'Filter with field required' });
    }

    try {
        await connectDB();
        const Model = getCollectionModel(collection);

        // Build filter query
        const query = { [filter.field]: filter.value };

        const result = await Model.deleteMany(query);

        res.json({ deleted: result.deletedCount });

    } catch (err) {
        console.error(`Bulk delete in ${collection} error:`, err);
        res.status(500).json({ error: 'Database operation failed' });
    }
}
