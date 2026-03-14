// auth.js
function toggleAdminLogin() {
    const n = document.getElementById('ninja-login-form');
    const a = document.getElementById('admin-login-form');
    if (n.style.display === 'none') {
        n.style.display = 'block';
        a.style.display = 'none';
    } else {
        n.style.display = 'none';
        a.style.display = 'block';
        document.getElementById('admin-pass').focus();
    }
}

async function attemptNinjaLogin() {
    const input = document.getElementById('login-username').value.trim().toLowerCase();
    if (!input) return;

    // First load leaderboard data to find the ninja
    await DB.leaderboard.loadCache();
    leaderboardData = DB.leaderboard.getAll();

    // Uses LocalAuth to find ninja
    const u = LocalAuth.loginAsNinja(input);
    if (u) {
        currentUser = u;
        localStorage.setItem('cn_user', JSON.stringify(u));
        // Load all data now that user is logged in
        await subscribeToData();
        enterDashboard();
    } else {
        document.getElementById('login-error-msg').style.display = 'block';
        document.getElementById('login-error-msg').innerText = 'User not found. Try username (e.g. firstName.lastName)';
    }
}

async function attemptAdminLogin() {
    const e = document.getElementById('admin-email').value;
    const p = document.getElementById('admin-pass').value;

    try {
        // Use LocalAuth for password verification
        await LocalAuth.signInWithEmailAndPassword(e, p);
        await loginAsAdmin();
    } catch (err) {
        document.getElementById('login-error-msg').style.display = 'block';
        document.getElementById('login-error-msg').innerText = 'Access Denied. Incorrect email or password.';
    }
}

function logout() {
    localStorage.removeItem('cn_user');
    currentUser = null;
    LocalAuth.signOut();
    location.reload();
}

async function loginAsAdmin() {
    // Use the actual user data from the server (includes role-based isAdmin)
    currentUser = LocalAuth.currentUser || { name: "Sensei", isAdmin: false };
    localStorage.setItem('cn_user', JSON.stringify(currentUser));
    // Load all data now that user is authenticated
    await subscribeToData();
    enterDashboard();
    document.getElementById('admin-view').classList.add('active');
    // Render admin-specific views
    loadCatalog(); loadQueue(); loadLeaderboard(); loadJams(); loadGames();
}

function enterDashboard() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    if (currentUser && currentUser.name) document.getElementById('current-user-name').innerText = currentUser.name.split(' ')[0];

    // Check if user is staff (admin or sensei role)
    const isStaff = currentUser && (currentUser.isAdmin || currentUser.role === 'admin' || currentUser.role === 'sensei');

    if (isStaff) {
        // Show wrench toggle button for ALL staff (admin and sensei)
        const floatingToggle = document.getElementById('floating-admin-toggle');
        if (floatingToggle) floatingToggle.style.display = 'flex';

        // Show add sensei button only for admin users
        const senseiBtn = document.getElementById('admin-sensei-btn');
        if (senseiBtn) {
            senseiBtn.style.display = (currentUser.isAdmin || currentUser.role === 'admin') ? 'block' : 'none';
        }

        // Show sensei management card in roster only for admin users
        const senseiCard = document.getElementById('sensei-management-card');
        if (senseiCard) {
            senseiCard.style.display = (currentUser.isAdmin || currentUser.role === 'admin') ? 'block' : 'none';
        }

        // Hide ninja notes banner for staff
        const notesBanner = document.getElementById('ninja-notes-banner');
        if (notesBanner) notesBanner.style.display = 'none';

        // Load admin data
        loadCatalog();
        loadQueue();
        loadLeaderboard();
        loadJams();
        loadGames();
    } else {
        // Hide staff-only elements for ninjas
        const floatingToggle = document.getElementById('floating-admin-toggle');
        if (floatingToggle) floatingToggle.style.display = 'none';

        const senseiBtn = document.getElementById('admin-sensei-btn');
        if (senseiBtn) senseiBtn.style.display = 'none';

        // Show ninja's points from leaderboard
        updateNinjaPointsDisplay();

        // Show ninja notes banner if they have notes from senseis
        renderNinjaNotesBanner();
    }
    refreshAll();
}

// Open the Add Sensei modal (admin only)
function openSenseiModal() {
    document.getElementById('new-sensei-email').value = '';
    document.getElementById('new-sensei-name').value = '';
    document.getElementById('new-sensei-password').value = '';
    document.getElementById('admin-password-confirm').value = '';
    document.getElementById('sensei-modal').style.display = 'flex';
}

// Register a new Sensei (requires admin password)
async function registerNewSensei() {
    const email = document.getElementById('new-sensei-email').value.trim();
    const name = document.getElementById('new-sensei-name').value.trim();
    const password = document.getElementById('new-sensei-password').value;
    const adminPassword = document.getElementById('admin-password-confirm').value;

    if (!email || !name || !password || !adminPassword) {
        showAlert('Missing Info', 'Please fill in all fields.');
        return;
    }

    try {
        const result = await LocalAuth.registerSensei(email, password, name, adminPassword);
        if (result.success) {
            document.getElementById('sensei-modal').style.display = 'none';
            showAlert('Success!', `Sensei "${name}" has been registered. They can now log in with email "${email}".`);
        } else {
            showAlert('Error', result.error || 'Failed to register sensei.');
        }
    } catch (err) {
        showAlert('Error', err.message || 'Failed to register sensei. Check admin password.');
    }
}

// Render notes banner for the currently logged-in ninja
function renderNinjaNotesBanner() {
    const banner = document.getElementById('ninja-notes-banner');
    if (!banner || !currentUser) return;

    // Find the current ninja in the leaderboard
    const ninja = leaderboardData.find(n =>
        (n.username && currentUser.username && n.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (n.name && currentUser.name && n.name.toLowerCase() === currentUser.name.toLowerCase())
    );

    const notes = ninja && ninja.notes ? ninja.notes : [];
    if (notes.length === 0) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'block';
    banner.innerHTML = notes.map(note => {
        const date = new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `
        <div class="ninja-note-card">
            <i class="fa-solid fa-note-sticky" style="color:#f39c12; margin-right:10px; flex-shrink:0;"></i>
            <div style="flex:1;">
                <div style="font-size:0.9rem;">${escapeHtml(note.text)}</div>
                <div style="font-size:0.7rem; color:#aaa; margin-top:2px;">\u2014 ${escapeHtml(note.author)} \u00b7 ${date}</div>
            </div>
        </div>`;
    }).join('');
}

