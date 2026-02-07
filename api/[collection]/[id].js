// api/[collection]/[id].js - Single item CRUD operations (get, update, delete)
import connectDB from '../../lib/mongodb.js';
import { getCollectionModel } from '../../lib/models/Collection.js';

export default async function handler(req, res) {
    const { collection, id } = req.query;

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

        // GET - Get single item
        if (req.method === 'GET') {
            const item = await Model.findOne({ id: id });
            if (item) {
                return res.json(item.toObject());
            } else {
                return res.status(404).json({ error: 'Item not found' });
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
