// server.js - Local file-based database server for Code Ninjas Dashboard
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const SENSEIS_FILE = path.join(__dirname, 'senseis.json');
const SALT_ROUNDS = 10;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Initialize data file if it doesn't exist
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            news: [],
            rules: [],
            coins: [],
            catalog: [],
            requests: [],
            queue: [],
            leaderboard: [],
            jams: [],
            jamSubmissions: [],
            games: [],
            challenges: [],
            settings: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('Created new data.json file');
    }
}

// Initialize senseis file with default admin if needed
async function initSenseisFile() {
    if (!fs.existsSync(SENSEIS_FILE)) {
        // Create default admin account with hashed password
        const hash = await bcrypt.hash('password', SALT_ROUNDS);
        const initialSenseis = {
            senseis: [
                {
                    id: 'sensei_default',
                    email: 'admin',
                    name: 'Head Sensei',
                    passwordHash: hash,
                    role: 'admin',
                    createdAt: Date.now()
                }
            ]
        };
        fs.writeFileSync(SENSEIS_FILE, JSON.stringify(initialSenseis, null, 2));
        console.log('Created senseis.json with default admin (login: admin / password)');
    } else {
        // Check if we need to update placeholder hash
        const data = readSenseis();
        let updated = false;
        for (let sensei of data.senseis) {
            if (sensei.passwordHash === '$2b$10$placeholder') {
                sensei.passwordHash = await bcrypt.hash('admin', SALT_ROUNDS);
                updated = true;
            }
        }
        if (updated) {
            writeSenseis(data);
            console.log('Updated placeholder password hashes');
        }
    }
}

// Read senseis from file
function readSenseis() {
    try {
        const data = fs.readFileSync(SENSEIS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading senseis file:', err);
        return { senseis: [] };
    }
}

// Write senseis to file
function writeSenseis(data) {
    try {
        fs.writeFileSync(SENSEIS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing senseis file:', err);
        return false;
    }
}

// Read data from file
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data file:', err);
        return {};
    }
}

// Write data to file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing data file:', err);
        return false;
    }
}

/* ================= AUTH ROUTES ================= */

// POST /api/auth/login - Sensei login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const data = readSenseis();
    const sensei = data.senseis.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (!sensei) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const match = await bcrypt.compare(password, sensei.passwordHash);
        if (match) {
            // Return sensei info (without password hash)
            res.json({
                success: true,
                user: {
                    id: sensei.id,
                    email: sensei.email,
                    name: sensei.name,
                    role: sensei.role,
                    isAdmin: true
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// POST /api/auth/register - Register new Sensei (requires existing admin)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, adminPassword } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Verify admin password first
    const data = readSenseis();
    const admin = data.senseis.find(s => s.role === 'admin');

    if (!admin) {
        return res.status(403).json({ error: 'No admin found' });
    }

    const adminValid = await bcrypt.compare(adminPassword, admin.passwordHash);
    if (!adminValid) {
        return res.status(403).json({ error: 'Admin verification failed' });
    }

    // Check if email already exists
    if (data.senseis.find(s => s.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new sensei
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newSensei = {
        id: `sensei_${Date.now()}`,
        email: email,
        name: name,
        passwordHash: hash,
        role: 'sensei',
        createdAt: Date.now()
    };

    data.senseis.push(newSensei);
    writeSenseis(data);

    res.json({
        success: true,
        user: {
            id: newSensei.id,
            email: newSensei.email,
            name: newSensei.name,
            role: newSensei.role
        }
    });
});

// GET /api/auth/senseis - List all senseis (without passwords)
app.get('/api/auth/senseis', (req, res) => {
    const data = readSenseis();
    const senseis = data.senseis.map(s => ({
        id: s.id,
        email: s.email,
        name: s.name,
        role: s.role,
        createdAt: s.createdAt
    }));
    res.json(senseis);
});

// DELETE /api/auth/senseis/:id - Remove a Sensei
app.delete('/api/auth/senseis/:id', async (req, res) => {
    const { id } = req.params;
    const { adminPassword } = req.body;

    const data = readSenseis();
    const admin = data.senseis.find(s => s.role === 'admin');

    if (!admin) {
        return res.status(403).json({ error: 'No admin found' });
    }

    // Don't allow deleting the last admin
    const admins = data.senseis.filter(s => s.role === 'admin');
    const toDelete = data.senseis.find(s => s.id === id);

    if (toDelete?.role === 'admin' && admins.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    const adminValid = await bcrypt.compare(adminPassword, admin.passwordHash);
    if (!adminValid) {
        return res.status(403).json({ error: 'Admin verification failed' });
    }

    data.senseis = data.senseis.filter(s => s.id !== id);
    writeSenseis(data);

    res.json({ success: true });
});

// PUT /api/auth/password - Change password
app.put('/api/auth/password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    const data = readSenseis();
    const sensei = data.senseis.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (!sensei) {
        return res.status(404).json({ error: 'Sensei not found' });
    }

    const valid = await bcrypt.compare(currentPassword, sensei.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Current password incorrect' });
    }

    sensei.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    writeSenseis(data);

    res.json({ success: true });
});

/* ================= DATA API ROUTES ================= */

// GET all items in a collection
app.get('/api/:collection', (req, res) => {
    const { collection } = req.params;
    const data = readData();
    res.json(data[collection] || []);
});

// GET single item by ID
app.get('/api/:collection/:id', (req, res) => {
    const { collection, id } = req.params;
    const data = readData();
    const items = data[collection] || [];
    const item = items.find(i => i.id === id);
    if (item) {
        res.json(item);
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// POST - Add new item
app.post('/api/:collection', (req, res) => {
    const { collection } = req.params;
    const data = readData();

    if (!data[collection]) {
        data[collection] = [];
    }

    const newItem = {
        id: `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...req.body,
        createdAt: req.body.createdAt || Date.now()
    };

    data[collection].push(newItem);
    writeData(data);
    res.json(newItem);
});

// PUT - Update item
app.put('/api/:collection/:id', (req, res) => {
    const { collection, id } = req.params;
    const data = readData();

    if (!data[collection]) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    const idx = data[collection].findIndex(i => i.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }

    data[collection][idx] = { ...data[collection][idx], ...req.body };
    writeData(data);
    res.json(data[collection][idx]);
});

// DELETE - Remove item
app.delete('/api/:collection/:id', (req, res) => {
    const { collection, id } = req.params;
    const data = readData();

    if (!data[collection]) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    const idx = data[collection].findIndex(i => i.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }

    data[collection].splice(idx, 1);
    writeData(data);
    res.json({ success: true });
});

// DELETE - Bulk delete with filter
app.post('/api/:collection/deleteWhere', (req, res) => {
    const { collection } = req.params;
    const { filter } = req.body; // e.g., { field: 'points', value: 0 }
    const data = readData();

    if (!data[collection]) {
        return res.status(404).json({ error: 'Collection not found' });
    }

    const before = data[collection].length;
    data[collection] = data[collection].filter(item => item[filter.field] !== filter.value);
    const deleted = before - data[collection].length;

    writeData(data);
    res.json({ deleted });
});

// PUT - Replace entire collection
app.put('/api/:collection', (req, res) => {
    const { collection } = req.params;
    const data = readData();
    data[collection] = req.body;
    writeData(data);
    res.json({ success: true });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Document.html'));
});

// Initialize and start server
async function startServer() {
    initDataFile();
    await initSenseisFile();

    app.listen(PORT, () => {
        console.log(`\n🥷 Code Ninjas Dashboard Server`);
        console.log(`📍 Location: NORTHRIDGE`);
        console.log(`🌐 Open in browser: http://localhost:${PORT}`);
        console.log(`💾 Data file: ${DATA_FILE}`);
        console.log(`🔐 Senseis file: ${SENSEIS_FILE}\n`);
    });
}

startServer();
