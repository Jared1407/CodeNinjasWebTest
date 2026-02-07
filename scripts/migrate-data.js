// scripts/migrate-data.js - One-time migration from JSON files to MongoDB
// Run with: npm run migrate
// Requires MONGODB_URI environment variable

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const MONGODB_URI = process.env.MONGODB_URI;
const SALT_ROUNDS = 10;

if (!MONGODB_URI) {
    console.error('ERROR: Please set MONGODB_URI environment variable');
    console.error('Example: $env:MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/codeninja"');
    process.exit(1);
}

// Generic schema for data collections
const CollectionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    createdAt: { type: Number, default: () => Date.now() }
}, { strict: false });

// Sensei schema
const SenseiSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'sensei'], default: 'sensei' },
    createdAt: { type: Number, default: () => Date.now() }
});

async function migrateData() {
    console.log('🚀 Starting migration to MongoDB...\n');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Migrate data.json
        const dataFilePath = path.join(PROJECT_ROOT, 'data.json');
        if (fs.existsSync(dataFilePath)) {
            console.log('📦 Migrating data.json...');
            const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

            for (const collectionName of Object.keys(data)) {
                const items = data[collectionName];
                if (!items || items.length === 0) {
                    console.log(`   ⏭️  ${collectionName}: empty, skipping`);
                    continue;
                }

                // Create model for this collection
                const Model = mongoose.model(collectionName, CollectionSchema, collectionName);

                // Clear existing data
                await Model.deleteMany({});

                // Insert new data
                const itemsWithIds = items.map(item => ({
                    id: item.id || `${collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...item,
                    createdAt: item.createdAt || Date.now()
                }));

                await Model.insertMany(itemsWithIds);
                console.log(`   ✅ ${collectionName}: ${items.length} items migrated`);
            }
            console.log('');
        } else {
            console.log('⚠️  No data.json found, skipping data migration\n');
        }

        // Migrate senseis.json
        const senseisFilePath = path.join(PROJECT_ROOT, 'senseis.json');
        const Sensei = mongoose.model('Sensei', SenseiSchema);

        if (fs.existsSync(senseisFilePath)) {
            console.log('👤 Migrating senseis.json...');
            const senseisData = JSON.parse(fs.readFileSync(senseisFilePath, 'utf8'));
            const senseis = senseisData.senseis || [];

            // Clear existing senseis
            await Sensei.deleteMany({});

            for (const sensei of senseis) {
                await Sensei.create({
                    email: sensei.email.toLowerCase(),
                    name: sensei.name,
                    passwordHash: sensei.passwordHash,
                    role: sensei.role || 'sensei',
                    createdAt: sensei.createdAt || Date.now()
                });
                console.log(`   ✅ Migrated sensei: ${sensei.name} (${sensei.email})`);
            }
            console.log('');
        } else {
            console.log('⚠️  No senseis.json found, creating default admin...');

            // Create default admin
            const hash = await bcrypt.hash('password', SALT_ROUNDS);
            await Sensei.deleteMany({});
            await Sensei.create({
                email: 'admin',
                name: 'Head Sensei',
                passwordHash: hash,
                role: 'admin',
                createdAt: Date.now()
            });
            console.log('   ✅ Created default admin (login: admin / password)\n');
        }

        console.log('🎉 Migration complete!\n');
        console.log('Next steps:');
        console.log('1. Verify data in MongoDB Atlas dashboard');
        console.log('2. Run "npm run dev" to test locally with Vercel');
        console.log('3. Deploy to Vercel with "vercel deploy"');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

migrateData();
