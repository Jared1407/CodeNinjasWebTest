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

function attemptNinjaLogin() {
    const input = document.getElementById('login-username').value.trim().toLowerCase();
    if (!input) return;
    // Uses LocalAuth to find ninja
    const u = LocalAuth.loginAsNinja(input);
    if (u) {
        currentUser = u;
        localStorage.setItem('cn_user', JSON.stringify(u));
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
        loginAsAdmin();
    } catch (err) {
        document.getElementById('login-error-msg').style.display = 'block';
        document.getElementById('login-error-msg').innerText = 'Access Denied. (Default password: admin)';
    }
}

function logout() {
    localStorage.removeItem('cn_user');
    currentUser = null;
    LocalAuth.signOut();
    location.reload();
}

function loginAsAdmin() {
    currentUser = { name: "Sensei", isAdmin: true };
    localStorage.setItem('cn_user', JSON.stringify(currentUser));
    enterDashboard();
    document.getElementById('admin-view').classList.add('active');
    // Load all data for admin (local database)
    loadCatalog(); loadQueue(); loadLeaderboard(); loadJams(); loadGames();
}

// auth.js - Update this function
function enterDashboard() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    if (currentUser && currentUser.name) document.getElementById('current-user-name').innerText = currentUser.name.split(' ')[0];

    if (currentUser && currentUser.isAdmin) {
        document.getElementById('floating-admin-toggle').style.display = 'flex';
        // ADD THESE LINES:
        loadCatalog();
        loadQueue();
    } else {
        document.getElementById('floating-admin-toggle').style.display = 'none';
    }
    refreshAll();
}

