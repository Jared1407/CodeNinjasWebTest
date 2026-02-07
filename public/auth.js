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
    // Use the actual user data from the server (includes role-based isAdmin)
    currentUser = LocalAuth.currentUser || { name: "Sensei", isAdmin: false };
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
        // Show add sensei button for admin users
        document.getElementById('admin-sensei-btn').style.display = 'block';
        // Auto-show admin view for senseis
        document.getElementById('admin-view').classList.add('active');
        // Load admin data
        loadCatalog();
        loadQueue();
        loadLeaderboard();
        loadJams();
        loadGames();
    } else {
        document.getElementById('floating-admin-toggle').style.display = 'none';
        document.getElementById('admin-sensei-btn').style.display = 'none';
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

