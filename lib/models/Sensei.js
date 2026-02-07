// lib/models/Sensei.js - Mongoose schema for Sensei authentication
import mongoose from 'mongoose';

const SenseiSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'sensei'],
        default: 'sensei'
    },
    createdAt: {
        type: Number,
        default: () => Date.now()
    }
});

// Prevent model recompilation in development
export default mongoose.models.Sensei || mongoose.model('Sensei', SenseiSchema);
