// database.js - Server-backed Database Layer
// Uses REST API with JWT authentication

const API_BASE = '/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('cn_auth_token');
}

// Get headers with optional auth
function getAuthHeaders(includeContentType = false) {
    const headers = {};
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

/* ================= LOCAL DATABASE ================= */
class LocalDB {
    constructor(collectionName) {
        this.collection = collectionName;
        this.cache = []; // Local cache for fast access
        this.cacheLoaded = false;
    }

    // Load cache from pre-fetched data (used by batch load)
    loadCacheFromData(data) {
        this.cache = data;
        this.cacheLoaded = true;
    }

    // Load cache from server
    async loadCache() {
        try {
            const res = await fetch(`${API_BASE}/${this.collection}`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
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
            headers: getAuthHeaders(true),
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
                headers: getAuthHeaders(true),
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
            method: 'DELETE',
            headers: getAuthHeaders()
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
            headers: getAuthHeaders(true),
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

        // Use bulk delete endpoint if items share a common filterable field
        // Fall back to individual deletes for complex filters
        if (deletedCount > 0) {
            // Try to detect simple field/value filter for bulk API
            const sample = toDelete[0];
            const bulkFields = ['points', 'status', 'belt'];
            let usedBulk = false;

            for (const field of bulkFields) {
                const val = sample[field];
                if (val !== undefined && toDelete.every(item => item[field] === val)) {
                    // All deleted items share the same field value — use bulk API
                    fetch(`${API_BASE}/${this.collection}/deleteWhere`, {
                        method: 'POST',
                        headers: getAuthHeaders(true),
                        body: JSON.stringify({ filter: { field, value: val } })
                    }).catch(() => { this._saveLocalFallback(); });
                    usedBulk = true;
                    break;
                }
            }

            if (!usedBulk) {
                // Fallback: individual deletes
                toDelete.forEach(item => {
                    fetch(`${API_BASE}/${this.collection}/${item.id}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    }).catch(() => { });
                });
            }
        }

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
    sandboxSubmissions: new LocalDB('sandboxSubmissions'),
    sandboxChallenges: new LocalDB('sandboxChallenges'),
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

            // Store JWT token for authenticated requests
            if (data.token) {
                localStorage.setItem('cn_auth_token', data.token);
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
        localStorage.removeItem('cn_auth_token');
    },

    // Register a new Sensei (requires admin auth + admin password)
    async registerSensei(email, password, name, adminPassword) {
        const token = localStorage.getItem('cn_auth_token');
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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
        const token = localStorage.getItem('cn_auth_token');
        const res = await fetch(`${API_BASE}/auth/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, currentPassword, newPassword })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Password change failed');
        }
        return data;
    },

    // Get all Senseis (requires authentication)
    async getSenseis() {
        const res = await fetch(`${API_BASE}/auth/senseis`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },

    // Remove a Sensei (requires admin password)
    async removeSensei(senseiId, adminPassword) {
        const res = await fetch(`${API_BASE}/auth/senseis/${senseiId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(true),
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
// Essential collections needed to render the basic UI
const ESSENTIAL_COLLECTIONS = ['news', 'rules', 'coins', 'catalog', 'leaderboard', 'settings'];
// Secondary collections loaded in background after UI is visible
const DEFERRED_COLLECTIONS = ['requests', 'queue', 'jams', 'jamSubmissions', 'games', 'challenges', 'sandboxSubmissions', 'sandboxChallenges'];

// Pre-load collections from server using batch API
// Phase 1: essential collections (blocks UI) — Phase 2: secondary (background)
async function initializeDatabase() {
    console.log('Loading essential data from server...');
    try {
        // Phase 1: Load essential collections to get the UI painted fast
        const res = await fetch(`${API_BASE}/batch?collections=${ESSENTIAL_COLLECTIONS.join(',')}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        for (const col of ESSENTIAL_COLLECTIONS) {
            if (data[col]) {
                DB[col].loadCacheFromData(data[col]);
            }
        }
        console.log('Essential data loaded (phase 1)');

        // Phase 2: Load secondary collections in background (non-blocking)
        loadDeferredCollections();
    } catch (err) {
        console.warn('Batch load failed, falling back to individual loads');
        const collections = Object.keys(DB);
        await Promise.all(collections.map(col => DB[col].loadCache()));
        console.log('Database loaded from server (individual fallback)');
    }
}

// Background load of secondary collections
async function loadDeferredCollections() {
    try {
        const res = await fetch(`${API_BASE}/batch?collections=${DEFERRED_COLLECTIONS.join(',')}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        for (const col of DEFERRED_COLLECTIONS) {
            if (data[col]) {
                DB[col].loadCacheFromData(data[col]);
            }
        }
        console.log('Deferred data loaded (phase 2)');

        // Trigger UI update now that deferred data is ready
        if (typeof window.onDeferredDataLoaded === 'function') {
            window.onDeferredDataLoaded();
        }
    } catch (err) {
        console.warn('Deferred batch load failed, loading individually');
        await Promise.all(DEFERRED_COLLECTIONS.map(col => DB[col].loadCache()));
    }
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
