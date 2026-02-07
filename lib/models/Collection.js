// lib/models/Collection.js - Dynamic collection model factory
import mongoose from 'mongoose';

// Generic schema for all data collections
// Uses Mixed type to allow flexible document structure
const CollectionSchema = new mongoose.Schema({
    // All documents have an id field for compatibility with existing frontend
    id: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Number,
        default: () => Date.now()
    }
}, {
    strict: false, // Allow any additional fields
    timestamps: false // We manage createdAt manually
});

// Cache models to prevent recompilation
const modelCache = {};

/**
 * Get or create a Mongoose model for the specified collection name.
 * This allows dynamic collection access similar to the file-based system.
 * 
 * Valid collections: news, rules, coins, catalog, requests, queue, 
 * leaderboard, jams, jamSubmissions, games, challenges, settings
 */
export function getCollectionModel(collectionName) {
    // Validate collection name to prevent injection
    const validCollections = [
        'news', 'rules', 'coins', 'catalog', 'requests', 'queue',
        'leaderboard', 'jams', 'jamSubmissions', 'games', 'challenges', 'settings'
    ];

    if (!validCollections.includes(collectionName)) {
        throw new Error(`Invalid collection name: ${collectionName}`);
    }

    if (modelCache[collectionName]) {
        return modelCache[collectionName];
    }

    // Check if model already exists in mongoose
    if (mongoose.models[collectionName]) {
        modelCache[collectionName] = mongoose.models[collectionName];
        return modelCache[collectionName];
    }

    // Create new model
    const Model = mongoose.model(collectionName, CollectionSchema, collectionName);
    modelCache[collectionName] = Model;
    return Model;
}

export default getCollectionModel;
