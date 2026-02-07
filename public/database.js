// database.js - Server-backed Database Layer
// Uses REST API with file persistence via server.js

const API_BASE = '/api';

/* ================= LOCAL DATABASE ================= */
class LocalDB {
    constructor(collectionName) {
        this.collection = collectionName;
        this.cache = []; // Local cache for fast access
        this.cacheLoaded = false;
    }

    // Load cache from server
    async loadCache() {
        try {
            const res = await fetch(`${API_BASE}/${this.collection}`);
            this.cache = await res.json();
            this.cacheLoaded = true;
        } catch (err) {
            console.warn(`Failed to load ${this.collection} from server, using localStorage fallback`);
            const stored = localStorage.getItem(`cn_${this.collection}`);
            this.cache = stored ? JSON.parse(stored) : [];
        }
        return this.cache;
    }

    // Get all documents (sync from cache, async updates cache)
    getAll() {
        // Return cache immediately, refresh in background
        if (!this.cacheLoaded) {
            this.loadCache();
        }
        return this.cache;
    }

    // Async version that waits for fresh data
    async getAllAsync() {
        await this.loadCache();
        return this.cache;
    }

    // Get a single document by ID
    get(id) {
        return this.cache.find(item => item.id === id) || null;
    }

    // Add a new document
    add(data) {
        const newItem = {
            id: `${this.collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...data,
            createdAt: data.createdAt || Date.now()
        };

        // Update local cache immediately
        this.cache.push(newItem);

        // Sync to server in background
        fetch(`${API_BASE}/${this.collection}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()).then(serverItem => {
            // Update cache with server-assigned ID
            const idx = this.cache.findIndex(i => i.id === newItem.id);
            if (idx > -1) this.cache[idx] = serverItem;
        }).catch(err => {
            console.warn('Server sync failed, using localStorage fallback');
            this._saveLocalFallback();
        });

        return newItem;
    }

    // Update an existing document by ID
    update(id, data) {
        const idx = this.cache.findIndex(item => item.id === id);
        if (idx > -1) {
            this.cache[idx] = { ...this.cache[idx], ...data };

            // Sync to server in background
            fetch(`${API_BASE}/${this.collection}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(err => {
                console.warn('Server sync failed, using localStorage fallback');
                this._saveLocalFallback();
            });

            return this.cache[idx];
        }
        return null;
    }

    // Delete a document by ID
    delete(id) {
        this.cache = this.cache.filter(item => item.id !== id);

        // Sync to server in background
        fetch(`${API_BASE}/${this.collection}/${id}`, {
            method: 'DELETE'
        }).catch(err => {
            console.warn('Server sync failed, using localStorage fallback');
            this._saveLocalFallback();
        });

        return true;
    }

    // Set the entire collection (replaces all data)
    setAll(data) {
        this.cache = data;

        fetch(`${API_BASE}/${this.collection}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(err => {
            console.warn('Server sync failed, using localStorage fallback');
            this._saveLocalFallback();
        });
    }

    // Query with filter function
    query(filterFn) {
        return this.cache.filter(filterFn);
    }

    // Query with sorting
    querySorted(filterFn, sortFn) {
        let results = filterFn ? this.cache.filter(filterFn) : [...this.cache];
        if (sortFn) results.sort(sortFn);
        return results;
    }

    // Batch delete (for clearing zero-point ninjas, etc.)
    deleteWhere(filterFn) {
        const toDelete = this.cache.filter(filterFn);
        const deletedCount = toDelete.length;
        this.cache = this.cache.filter(item => !filterFn(item));

        // Sync each deletion to server
        toDelete.forEach(item => {
            fetch(`${API_BASE}/${this.collection}/${item.id}`, {
                method: 'DELETE'
            }).catch(() => { });
        });

        return deletedCount;
    }

    // Fallback: save to localStorage if server fails
    _saveLocalFallback() {
        localStorage.setItem(`cn_${this.collection}`, JSON.stringify(this.cache));
    }
}

/* ================= DATABASE COLLECTIONS ================= */
const DB = {
    news: new LocalDB('news'),
    rules: new LocalDB('rules'),
    coins: new LocalDB('coins'),
    catalog: new LocalDB('catalog'),
    requests: new LocalDB('requests'),
    queue: new LocalDB('queue'),
    leaderboard: new LocalDB('leaderboard'),
    jams: new LocalDB('jams'),
    jamSubmissions: new LocalDB('jamSubmissions'),
    games: new LocalDB('games'),
    challenges: new LocalDB('challenges'),
    settings: new LocalDB('settings')
};

/* ================= LOCAL AUTHENTICATION ================= */
const LocalAuth = {
    currentUser: null,

    // Sensei login with email/password (uses server-side bcrypt)
    async signInWithEmailAndPassword(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid credentials');
            }

            this.currentUser = data.user;
            return { user: this.currentUser };
        } catch (err) {
            console.error('Login error:', err);
            throw new Error('Invalid credentials');
        }
    },

    // Ninja login by username (from leaderboard)
    loginAsNinja(username) {
        const leaderboard = DB.leaderboard.getAll();
        const ninja = leaderboard.find(n =>
            (n.username && n.username.toLowerCase() === username.toLowerCase()) ||
            (!n.username && n.name && n.name.toLowerCase() === username.toLowerCase())
        );

        if (ninja) {
            this.currentUser = ninja;
            return ninja;
        }
        return null;
    },

    // Sign out
    signOut() {
        this.currentUser = null;
        localStorage.removeItem('cn_user');
    },

    // Register a new Sensei (requires admin password)
    async registerSensei(email, password, name, adminPassword) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, adminPassword })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        return data;
    },

    // Change Sensei password
    async changePassword(email, currentPassword, newPassword) {
        const res = await fetch(`${API_BASE}/auth/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, currentPassword, newPassword })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Password change failed');
        }
        return data;
    },

    // Get all Senseis (without passwords)
    async getSenseis() {
        const res = await fetch(`${API_BASE}/auth/senseis`);
        return res.json();
    },

    // Remove a Sensei (requires admin password)
    async removeSensei(senseiId, adminPassword) {
        const res = await fetch(`${API_BASE}/auth/senseis/${senseiId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Remove failed');
        }
        return data;
    }
};

/* ================= INITIALIZATION ================= */
// Pre-load all collections from server
async function initializeDatabase() {
    console.log('Loading data from server...');
    const collections = Object.keys(DB);
    await Promise.all(collections.map(col => DB[col].loadCache()));
    console.log('Database loaded from server');
}

// Initialize with default data if collections are empty
function initializeDefaultData() {
    if (DB.leaderboard.getAll().length === 0 && typeof mockLeaderboard !== 'undefined') {
        mockLeaderboard.forEach(item => DB.leaderboard.add(item));
    }
    if (DB.news.getAll().length === 0 && typeof defaultNews !== 'undefined') {
        defaultNews.forEach(item => DB.news.add(item));
    }
    if (DB.rules.getAll().length === 0 && typeof defaultRules !== 'undefined') {
        defaultRules.forEach(item => DB.rules.add(item));
    }
    if (DB.coins.getAll().length === 0 && typeof defaultCoins !== 'undefined') {
        defaultCoins.forEach(item => DB.coins.add(item));
    }
    if (DB.catalog.getAll().length === 0 && typeof defaultCatalog !== 'undefined') {
        defaultCatalog.forEach(item => DB.catalog.add(item));
    }
}

console.log("LocalDB Initialized - Using MongoDB Atlas backend");
