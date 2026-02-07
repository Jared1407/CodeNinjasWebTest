// main.js

console.log("DASHBOARD STARTING... (Local Database Mode)");

/* ================= VARIABLES ================= */
// Note: db and auth removed - now using LocalDB and LocalAuth from database.js
let currentUser = null;

let newsData = [];
let jamsData = [];
let jamSubmissions = [];
let gamesData = [];
let challengesData = [];
let rulesData = [];
let coinsData = [];
let catalogData = [];
let requestsData = [];
let queueData = [];
let leaderboardData = [];
let filamentData = DEFAULT_FILAMENTS; // from config.js

let currentTier = 'tier1';
let currentRequestItem = null;
// Admin editing state
let editingCatId = null;
let editingId = null;
let editingNinjaId = null;
let editingJamId = null;
let editingChallengeId = null;
let currentJamSubmissionId = null;

let showHistory = false;
let historyLoaded = false;
let clickCount = 0;
let clickTimer;
let selectedVariantIdx = 0;
let carouselIndex = 0;

// Note: Real-time listeners removed - data is loaded directly from localStorage

/* ================= UTILS ================= */
function parseCSVLine(text) {
    let results = []; let entry = []; let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { results.push(entry.join('')); entry = []; }
        else { entry.push(char); }
    }
    results.push(entry.join(''));
    return results.map(r => r.trim().replace(/^"|"$/g, '').trim());
}

function generateUsername(baseName, existingData) {
    let clean = baseName.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    if (!clean) clean = "ninja" + Math.floor(Math.random() * 1000);
    let candidate = clean;
    let counter = 1;
    const isTaken = (u) => existingData.some(n => (n.username || "").toLowerCase() === u);
    while (isTaken(candidate)) { candidate = clean + counter; counter++; }
    return candidate;
}

function saveLocal(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function showAlert(t, m) { document.getElementById('alert-title').innerText = t; document.getElementById('alert-msg').innerText = m; document.getElementById('alert-modal').style.display = 'flex'; }
/* ================= HELPER: CUSTOM CONFIRM MODAL ================= */
function showConfirm(msg, callback, type = 'danger') {
    const modal = document.getElementById('confirm-modal');
    // Get inner elements to style
    const content = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    const title = header.querySelector('h2');
    const yesBtn = document.getElementById('confirm-yes-btn');

    // Define Colors
    const colorRed = '#e74c3c';
    const colorGreen = '#2ecc71';

    // Apply Theme
    if (type === 'success') {
        content.style.borderColor = colorGreen;
        header.style.borderBottomColor = colorGreen;
        yesBtn.style.backgroundColor = colorGreen;
        title.innerText = "Confirm Payment";
        yesBtn.innerText = "APPROVE";
    } else {
        // Default / Danger
        content.style.borderColor = colorRed;
        header.style.borderBottomColor = colorRed;
        yesBtn.style.backgroundColor = colorRed;
        title.innerText = "Confirm Action";
        yesBtn.innerText = "YES";
    }

    // Set Message
    document.getElementById('confirm-msg').innerText = msg;

    // Reset Button Listener (Clone to remove old listeners)
    const newBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newBtn, yesBtn);

    newBtn.onclick = () => {
        modal.style.display = 'none';
        callback();
    };

    modal.style.display = 'flex';
}
function handleLogoClick() {
    if (window.innerWidth < 768) return; clickCount++;
    clearTimeout(clickTimer); clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
    if (clickCount === 3) { clickCount = 0; toggleAdminLogin(); }
}
function toggleAdminViewMode() {
    const adminView = document.getElementById('admin-view');
    const floatingBtn = document.getElementById('floating-admin-toggle');
    if (adminView.classList.contains('active')) {
        adminView.classList.remove('active');
        floatingBtn.style.display = 'flex';
    } else {
        adminView.classList.add('active');
        floatingBtn.style.display = 'flex';
    }
}
function showAdminSection(id, btn) { document.querySelectorAll('.admin-section').forEach(e => e.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderAdminLists(); }

/* ================= DATA LOADING ================= */
async function subscribeToData() {
    // Load all data from server
    await initializeDatabase();

    // Load into local variables
    loadAllData();

    // Initialize with defaults if empty
    initializeDefaultData();

    // Re-load after defaults added
    loadAllData();
    refreshAll();
}

function loadAllData() {
    // Load from LocalDB collections (sync from cache)
    newsData = DB.news.getAll();
    if (newsData.length === 0) newsData = defaultNews;

    rulesData = DB.rules.getAll();
    if (rulesData.length === 0) rulesData = defaultRules;

    coinsData = DB.coins.getAll();
    if (coinsData.length === 0) coinsData = defaultCoins;
    coinsData.sort((a, b) => (a.order || 0) - (b.order || 0));

    catalogData = DB.catalog.getAll();
    if (catalogData.length === 0) catalogData = defaultCatalog;

    requestsData = DB.requests.getAll();
    queueData = DB.queue.getAll();

    leaderboardData = DB.leaderboard.getAll();
    if (leaderboardData.length === 0) leaderboardData = mockLeaderboard;

    jamsData = DB.jams.getAll();
    jamSubmissions = DB.jamSubmissions.getAll();
    gamesData = DB.games.getAll();
    challengesData = DB.challenges.getAll();

    // Load filament settings
    const filamentSettings = DB.settings.get('filaments');
    if (filamentSettings && filamentSettings.colors) {
        filamentData = filamentSettings.colors;
    }
}

function loadCatalog() {
    catalogData = DB.catalog.getAll();
    renderCatalog();
    if (currentUser?.isAdmin) {
        requestsData = DB.requests.getAll();
        renderAdminCatalog();
        renderAdminRequests();
    }
}

function loadQueue() {
    queueData = DB.queue.getAll();
    renderQueue();
    if (currentUser?.isAdmin) renderAdminQueue();
}

function loadLeaderboard() {
    leaderboardData = DB.leaderboard.getAll();
    renderLeaderboard();
    if (currentUser?.isAdmin) renderAdminLbPreview();
}

function loadJams() { jamsData = DB.jams.getAll(); renderJams(); }
function loadGames() { gamesData = DB.games.getAll(); renderGames(); }

function refreshAll() {
    renderNews(); renderJams(); renderGames(); renderRules(); renderCoins();
    renderCatalog(); renderQueue(); renderLeaderboard(); renderAdminLists();
}

/* ================= STARTUP ================= */
window.onload = async function () {
    console.log("Window loaded. Connecting to server...");
    const storedVer = localStorage.getItem('cn_app_version');
    const msgEl = document.getElementById('login-version-msg');
    if (storedVer !== APP_VERSION) {
        if (msgEl) { msgEl.innerText = `🚀 Update Detected! Welcome to v${APP_VERSION}`; msgEl.style.display = 'block'; }
        localStorage.setItem('cn_app_version', APP_VERSION);
    } else { if (msgEl) msgEl.style.display = 'none'; }

    // Server Database Mode
    console.log("Running with Server-Backed File Storage");

    const savedUser = localStorage.getItem('cn_user');
    if (savedUser) {
        try { currentUser = JSON.parse(savedUser); enterDashboard(); }
        catch (e) { console.error("Error parsing user", e); localStorage.removeItem('cn_user'); }
    } else {
        document.getElementById('login-view').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
    await subscribeToData();
};

/* ================= REQUEST MODAL LOGIC ================= */

function initRequest(id) {
    if (!currentUser) { showAlert("Login Required", "Please log in to make requests."); return; }

    // Find item
    const item = catalogData.find(i => i.id === id);
    if (!item) return;

    currentRequestItem = item;
    selectedVariantIdx = 0; // Reset variant selection

    // Get Modal Elements
    const modal = document.getElementById('req-modal');
    const imgContainer = document.getElementById('req-img-container');
    const gallery = document.getElementById('req-gallery');
    const nameField = document.getElementById('req-item-name');
    const ninjaField = document.getElementById('req-ninja-name');
    const dynFields = document.getElementById('req-dynamic-fields');
    const submitBtn = modal.querySelector('.btn-blue');

    // Pre-fill Basic Info
    nameField.innerText = item.name;
    ninjaField.value = currentUser.name;
    gallery.innerHTML = '';
    dynFields.innerHTML = '';

    // Setup Main Image
    let mainImg = item.image || '';
    if (item.category === 'premium' && item.variations && item.variations.length > 0) {
        mainImg = item.variations[0].image || item.image;
    }

    if (mainImg) {
        imgContainer.innerHTML = `<img src="${mainImg}" style="width:100%; height:100%; object-fit:contain;">`;
    } else {
        imgContainer.innerHTML = `<i class="fa-solid fa-cube" style="font-size:4rem; color:#333;"></i>`;
    }

    // --- HELPER: BUILD COLOR OPTIONS ---
    let colorOptionsHtml = '<option value="Default/No Preference">-- Select a Color (Optional) --</option>';
    if (typeof filamentData !== 'undefined' && Array.isArray(filamentData)) {
        filamentData.forEach(c => {
            colorOptionsHtml += `<option value="${c}">${c}</option>`;
        });
    }

    // --- HELPER: FEE TEXT ---
    // Only generate the warning if there is actually a fee > 0
    const feeVal = parseInt(item.colorFee) || 0;
    let feeWarningHtml = '';

    if (feeVal > 0) {
        feeWarningHtml = `
            <div style="background:rgba(231, 76, 60, 0.2); border:1px solid #e74c3c; padding:10px; margin-top:10px; border-radius:5px; color:#ffcccc; font-size:0.85rem; text-align:center;">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>Note:</strong> Custom colors require an extra <strong>${feeVal} Gold Coin</strong> fee!
            </div>`;
    }

    // --- LOGIC PER CATEGORY ---

    // 1. STANDARD / LIMITED (Interest Tracker)
    if (item.category === 'standard' || item.category === 'limited') {
        submitBtn.innerText = "I'm Interested!";
        submitBtn.onclick = submitInterest;
        submitBtn.style.background = "var(--color-queue)";

        dynFields.innerHTML = `
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; text-align:center;">
                <p style="color:white; margin-top:0;">Vote for this item!</p>
                <p style="color:#aaa; font-size:0.85rem;">If enough Ninjas request this, Sensei will add it to the print queue.</p>
            </div>
        `;
    }
    // 2. CUSTOM (URL & Name Input & Color Dropdown)
    else if (item.category === 'custom') {
        submitBtn.innerText = "Submit Print Request";
        submitBtn.onclick = submitRequest;
        submitBtn.style.background = "var(--color-catalog)";

        dynFields.innerHTML = `
            <label class="req-label">Model Name (e.g. Spongebob Flexi):</label>
            <input type="text" id="req-custom-name" class="req-input" placeholder="Enter the name of the object...">
            
            <label class="req-label">Model URL (Thingiverse/Printables):</label>
            <input type="text" id="req-custom-url" class="req-input" placeholder="Paste the link here...">
            
            <label class="req-label">Color Preference:</label>
            <select id="req-custom-color" class="req-input">${colorOptionsHtml}</select>

            ${feeWarningHtml}
        `;
    }
    // 3. PREMIUM (Variants & Color Dropdown)
    else if (item.category === 'premium') {
        submitBtn.innerText = "Request Print";
        submitBtn.onclick = submitRequest;
        submitBtn.style.background = "var(--color-catalog)";

        // Variant Thumbnails
        if (item.variations && item.variations.length > 0) {
            item.variations.forEach((v, idx) => {
                const active = idx === 0 ? 'active' : '';
                gallery.innerHTML += `<div class="req-thumb ${active}" onclick="selectVariant(${idx}, '${v.image}')"><img src="${v.image}"></div>`;
            });
            dynFields.innerHTML += `<p id="selected-variant-name" style="color:var(--color-catalog); text-align:center; font-weight:bold; margin-bottom:15px;">Selected: ${item.variations[0].name}</p>`;
        } else {
            dynFields.innerHTML += `<p style="color:#aaa; margin-bottom:15px;">Standard ${item.name}</p>`;
        }

        // Color Selector for Premium
        dynFields.innerHTML += `
            <label class="req-label">Color Preference (Optional):</label>
            <select id="req-custom-color" class="req-input">${colorOptionsHtml}</select>

            ${feeWarningHtml}
        `;
    }

    modal.style.display = 'flex';
}

function submitInterest() {
    if (!currentRequestItem) return;
    const newInterest = (currentRequestItem.interest || 0) + 1;
    // Update in LocalDB
    DB.catalog.update(currentRequestItem.id, { interest: newInterest });
    currentRequestItem.interest = newInterest;
    // Refresh displays
    catalogData = DB.catalog.getAll();
    if (typeof renderCatalog === 'function') renderCatalog();
    if (typeof renderAdminInterest === 'function') renderAdminInterest();
    closeReqModal();
    showAlert("Interest Recorded", "Thanks for your vote! Sensei will print more soon if there is enough interest.");
}

function submitRequest() {
    if (!currentUser || !currentRequestItem) return;

    const ninjaName = document.getElementById('req-ninja-name').value || currentUser.name;

    let requestData = {
        userId: currentUser.username || currentUser.name,
        name: ninjaName,
        createdAt: Date.now(),
        status: "Waiting for Payment"
    };

    // Helper to get color if it exists in DOM
    const colorSelect = document.getElementById('req-custom-color');
    const selectedColor = (colorSelect && colorSelect.value !== "Default/No Preference") ? colorSelect.value : null;

    // CUSTOM
    if (currentRequestItem.category === 'custom') {
        const url = document.getElementById('req-custom-url').value;
        const modelName = document.getElementById('req-custom-name').value;

        if (!url || !modelName) {
            alert("Please provide both the Name and URL.");
            return;
        }

        requestData.item = modelName;
        requestData.details = `URL: ${url}`;
        if (selectedColor) requestData.details += ` | Color: ${selectedColor}`;
        requestData.cost = currentRequestItem.cost; // Use catalog item's cost for point deduction
    }
    // PREMIUM / STANDARD
    else {
        let variantName = currentRequestItem.name;
        let variantImg = currentRequestItem.image;

        if (currentRequestItem.category === 'premium' && currentRequestItem.variations && currentRequestItem.variations.length > 0) {
            const v = currentRequestItem.variations[selectedVariantIdx];
            variantName = `${currentRequestItem.name} (${v.name})`;
            variantImg = v.image;
        }

        requestData.item = variantName;
        requestData.details = currentRequestItem.category === 'premium' ? "Premium Print" : "Standard Request";
        if (selectedColor) requestData.details += ` | Color: ${selectedColor}`;

        requestData.image = variantImg;
        requestData.cost = currentRequestItem.cost;
    }

    // Calculate cost and deduct points from ninja
    const cost = parseInt(requestData.cost) || 0;
    if (cost > 0) {
        // Find ninja in leaderboard
        const ninja = leaderboardData.find(n =>
            n.name.toLowerCase() === currentUser.name.toLowerCase() ||
            (n.username && n.username.toLowerCase() === (currentUser.username || '').toLowerCase())
        );

        if (ninja) {
            if ((ninja.points || 0) < cost) {
                showAlert("Insufficient Points", `You need ${cost} Gold Coins for this item. You have ${ninja.points || 0}.`);
                return;
            }
            const newPoints = (ninja.points || 0) - cost;
            DB.leaderboard.update(ninja.id, { points: newPoints });
            leaderboardData = DB.leaderboard.getAll();
            console.log(`Deducted ${cost} points from ${ninja.name}. New balance: ${newPoints}`);
        }
    }

    // Store ninjaId for potential refund
    const ninja = leaderboardData.find(n =>
        n.name.toLowerCase() === currentUser.name.toLowerCase() ||
        (n.username && n.username.toLowerCase() === (currentUser.username || '').toLowerCase())
    );
    if (ninja) {
        requestData.ninjaId = ninja.id;
    }

    // Add to LocalDB
    DB.requests.add(requestData);
    requestsData = DB.requests.getAll();
    if (typeof renderAdminRequests === 'function') renderAdminRequests();

    closeReqModal();
    showAlert("Request Sent", "Your request has been submitted to Sensei!");
}

function selectVariant(idx, imgUrl) {
    selectedVariantIdx = idx;

    // Update main image
    const imgContainer = document.getElementById('req-img-container');
    if (imgUrl) {
        imgContainer.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:contain;">`;
    }

    // Update thumbnails UI
    document.querySelectorAll('.req-thumb').forEach((el, i) => {
        if (i === idx) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Update text label
    if (currentRequestItem && currentRequestItem.variations && currentRequestItem.variations[idx]) {
        const v = currentRequestItem.variations[idx];
        const label = document.getElementById('selected-variant-name');
        if (label) label.innerText = `Selected: ${v.name}`;
    }
}

function closeReqModal() {
    document.getElementById('req-modal').style.display = 'none';
}