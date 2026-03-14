// admin.js

/* === MAIN ADMIN RENDERER === */
function renderAdminLists() {
    renderAdminNews();
    renderAdminRules();
    renderAdminCoins();
    renderAdminCatalog();
    renderAdminRequests();
    renderAdminQueue();
    renderAdminLbPreview();
    renderAdminInterest();
    renderAdminJamsList();
    renderAdminGames();
    renderAdminChallenges();
    renderAdminSandbox();
}

/* === NEWS, RULES, COINS === */
function renderAdminNews() {
    const nList = document.getElementById('admin-news-list');
    if (nList) {
        nList.innerHTML = '';
        newsData.forEach(n => nList.innerHTML += `<div class="admin-list-wrapper"><div class="list-card passed" style="pointer-events:none; margin:0;"><div class="card-info"><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.date)}</p></div><div class="status-badge" style="color:var(--color-games)">${escapeHtml(n.badge)} ></div></div><button onclick="openNewsModal('${escapeJsString(n.id)}')" class="btn-mini" style="background:#f39c12;color:black;">Edit</button><button onclick="deleteNews('${escapeJsString(n.id)}')" class="btn-mini" style="background:#e74c3c;">Del</button></div>`);
    }
}
function openNewsModal(id = null) {
    editingId = id;
    if (id) {
        const i = newsData.find(n => n.id === id);
        document.getElementById('news-input-title').value = i.title;
        document.getElementById('news-input-date').value = i.date;
        document.getElementById('news-input-badge').value = i.badge;
    } else {
        document.getElementById('news-input-title').value = '';
        document.getElementById('news-input-date').value = '';
        document.getElementById('news-input-badge').value = '';
    }
    document.getElementById('news-modal').style.display = 'flex';
}
function closeNewsModal() {
    document.getElementById('news-modal').style.display = 'none';
}
function saveNews() {
    const t = document.getElementById('news-input-title').value;
    const d = document.getElementById('news-input-date').value;
    const b = document.getElementById('news-input-badge').value;
    if (t) {
        if (editingId) {
            DB.news.update(editingId, { title: t, date: d, badge: b });
        } else {
            DB.news.add({ title: t, date: d, badge: b });
        }
        newsData = DB.news.getAll();
        renderAdminLists();
        renderNews();
        closeNewsModal();
        showAlert("Success", "News saved!");
    }
}
function deleteNews(id) {
    showConfirm("Delete?", () => {
        DB.news.delete(id);
        newsData = DB.news.getAll();
        renderAdminLists();
        renderNews();
    });
}

function renderAdminRules() {
    const rList = document.getElementById('admin-rules-list');
    if (rList) {
        rList.innerHTML = '';
        rulesData.forEach(r => {
            const b = r.penalty ? `<div class="status-badge" style="color:#e74c3c;border:1px solid #e74c3c;">${escapeHtml(r.penalty)}</div>` : '';
            rList.innerHTML += `<div class="admin-list-wrapper"><div class="list-card pending" style="pointer-events:none; margin:0;"><div class="card-info"><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.desc)}</p></div>${b}</div><button onclick="openRulesModal('${escapeJsString(r.id)}')" class="btn-mini" style="background:#f39c12;color:black;">Edit</button><button onclick="deleteRule('${escapeJsString(r.id)}')" class="btn-mini" style="background:#e74c3c;">Del</button></div>`;
        }
        );
    }
}
function openRulesModal(id = null) {
    editingId = id;
    const ti = document.getElementById('rule-input-title');
    const di = document.getElementById('rule-input-desc');
    ti.placeholder = "Category";
    di.placeholder = "Rule";
    if (id) {
        const i = rulesData.find(r => r.id === id);
        ti.value = i.title;
        di.value = i.desc;
        document.getElementById('rule-input-penalty').value = i.penalty;
    } else {
        ti.value = '';
        di.value = '';
        document.getElementById('rule-input-penalty').value = '';
    }
    document.getElementById('rules-modal').style.display = 'flex';
}
function closeRulesModal() {
    document.getElementById('rules-modal').style.display = 'none';
}
function saveRule() {
    const title = document.getElementById('rule-input-title').value;
    const desc = document.getElementById('rule-input-desc').value;
    const penalty = document.getElementById('rule-input-penalty').value;
    if (title) {
        if (editingId) {
            DB.rules.update(editingId, { title, desc, penalty });
        } else {
            DB.rules.add({ title, desc, penalty });
        }
        rulesData = DB.rules.getAll();
        renderAdminLists();
        renderRules();
        closeRulesModal();
        showAlert("Success", "Rule saved!");
    }
}
function deleteRule(id) {
    showConfirm("Delete?", () => {
        DB.rules.delete(id);
        rulesData = DB.rules.getAll();
        renderAdminLists();
        renderRules();
    });
}

function renderAdminCoins() {
    const cList = document.getElementById('admin-coins-list');
    if (cList) {
        cList.innerHTML = '';
        coinsData.forEach((c, index) => {
            const upBtn = index > 0 ? `<button onclick="moveCoin(${index}, -1)" class="btn-arrow">⬆</button>` : '<span class="btn-arrow-placeholder"></span>';
            const downBtn = index < coinsData.length - 1 ? `<button onclick="moveCoin(${index}, 1)" class="btn-arrow">⬇</button>` : '<span class="btn-arrow-placeholder"></span>';
            cList.innerHTML += `<div class="admin-list-wrapper"><div style="display:flex; flex-direction:column; margin-right:5px;">${upBtn}${downBtn}</div><div style="flex-grow:1;background:#161932;padding:10px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;"><span style="color:white;font-weight:bold;">${escapeHtml(c.task)}</span><div>${formatCoinBreakdown(c.val)}</div></div><button onclick="openCoinModal('${escapeJsString(c.id)}')" class="btn-mini" style="background:#f39c12;color:black;">Edit</button><button onclick="deleteCoin('${escapeJsString(c.id)}')" class="btn-mini" style="background:#e74c3c;">Del</button></div>`;
        }
        );
    }
}
function openCoinModal(id = null) {
    editingId = id;
    if (id) {
        const i = coinsData.find(c => c.id === id);
        document.getElementById('coin-input-task').value = i.task;
        document.getElementById('coin-input-val').value = i.val;
    } else {
        document.getElementById('coin-input-task').value = '';
        document.getElementById('coin-input-val').value = '';
    }
    document.getElementById('coin-modal').style.display = 'flex';
}
function closeCoinModal() {
    document.getElementById('coin-modal').style.display = 'none';
}
function saveCoin() {
    const task = document.getElementById('coin-input-task').value;
    const val = document.getElementById('coin-input-val').value;
    if (task) {
        if (editingId) {
            DB.coins.update(editingId, { task, val });
        } else {
            DB.coins.add({ task, val });
        }
        coinsData = DB.coins.getAll();
        renderAdminLists();
        renderCoins();
        closeCoinModal();
        showAlert("Success", "Task saved!");
    }
}
function deleteCoin(id) {
    showConfirm("Delete?", () => {
        DB.coins.delete(id);
        coinsData = DB.coins.getAll();
        renderAdminLists();
        renderCoins();
    });
}
function moveCoin(index, dir) {
    if (index + dir < 0 || index + dir >= coinsData.length)
        return;
    const temp = coinsData[index];
    coinsData[index] = coinsData[index + dir];
    coinsData[index + dir] = temp;
    DB.coins.setAll(coinsData);
    renderAdminLists();
    renderCoins();
}

/* === CATALOG & INTEREST === */
function renderAdminCatalog() {
    const catList = document.getElementById('admin-cat-list');
    if (!catList)
        return;
    catList.innerHTML = '';
    const tiers = ['tier1', 'tier2', 'tier3', 'tier4'];
    const tierNames = {
        'tier1': 'Tier 1',
        'tier2': 'Tier 2',
        'tier3': 'Tier 3',
        'tier4': 'Tier 4'
    };
    tiers.forEach(t => {
        catList.innerHTML += `<div class="admin-tier-header">${tierNames[t]}</div>`;
        let g = `<div class="admin-store-grid">`;
        catalogData.filter(i => i.tier === t).forEach(i => {
            let img = i.image && i.image.length > 5 ? `<img src="${sanitizeUrl(i.image)}">` : `<i class="fa-solid ${escapeHtml(i.icon)}"></i>`;
            let h = i.visible === false ? 'hidden' : '';
            let typeBadge = i.category === 'custom' ? 'CUSTOM' : (i.category === 'premium' ? 'PREMIUM' : (i.category === 'limited' ? 'LIMITED' : 'STD'));
            g += `<div class="admin-store-card ${h}"><div class="admin-store-icon">${img}</div><div style="flex-grow:1;"><h4 style="margin:0;color:white;font-size:0.9rem;">${escapeHtml(i.name)}</h4><div style="font-size:0.6rem; color:#aaa;">${typeBadge} | ${escapeHtml(String(i.cost))} Gold</div></div><div class="admin-store-actions"><button onclick="editCatItem('${escapeJsString(i.id)}')" class="btn-mini" style="background:#f39c12;color:black;">Edit</button><button onclick="deleteCatItem('${escapeJsString(i.id)}')" class="btn-mini" style="background:#e74c3c;">Del</button></div></div>`;
        }
        );
        g += `</div>`;
        catList.innerHTML += g;
    }
    );
}
function showAddCatModal() {
    editingCatId = null;
    document.getElementById('cat-modal-title').innerText = "Add Prize";
    document.getElementById('ce-name').value = '';
    document.getElementById('ce-cost').value = '';
    document.getElementById('ce-img').value = '';
    document.getElementById('ce-desc').value = '';
    document.getElementById('ce-visible').checked = true;
    document.getElementById('ce-category').value = 'standard';
    document.getElementById('ce-variants-list').innerHTML = '';
    document.getElementById('ce-prem-color-check').checked = false;
    document.getElementById('ce-prem-color-fee').value = '';
    document.getElementById('ce-prem-fee-wrap').style.display = 'none';
    toggleCatOptions('standard');
    document.getElementById('cat-edit-modal').style.display = 'flex';
}
function addVariantRow(name = '', img = '') {
    const div = document.createElement('div');
    div.className = 'variant-row';
    div.innerHTML = `<input type="text" class="admin-input var-name" placeholder="Name" value="${name}" style="margin:0; flex:1;"><input type="text" class="admin-input var-img" placeholder="Image URL" value="${img}" style="margin:0; flex:2;"><button onclick="this.parentElement.remove()" class="btn-mini" style="background:#e74c3c; width:30px;">X</button>`;
    document.getElementById('ce-variants-list').appendChild(div);
}
function editCatItem(id) {
    editingCatId = id;
    const item = catalogData.find(x => x.id === id);
    if (!item)
        return;
    document.getElementById('cat-modal-title').innerText = "Edit Prize";
    document.getElementById('ce-name').value = item.name;
    document.getElementById('ce-cost').value = item.cost;
    document.getElementById('ce-tier').value = item.tier;
    document.getElementById('ce-img').value = item.image || '';
    document.getElementById('ce-desc').value = item.desc || '';
    document.getElementById('ce-visible').checked = item.visible !== false;
    const catSelect = document.getElementById('ce-category');
    catSelect.value = item.category || 'standard';
    toggleCatOptions(item.category);
    if (item.colorFee) {
        document.getElementById('ce-color-fee').value = item.colorFee;
        document.getElementById('ce-prem-color-fee').value = item.colorFee;
    }
    if (item.category === 'premium') {
        const hasColor = item.colorSelection === true;
        document.getElementById('ce-prem-color-check').checked = hasColor;
        document.getElementById('ce-prem-fee-wrap').style.display = hasColor ? 'block' : 'none';
    }
    document.getElementById('ce-variants-list').innerHTML = '';
    if (item.variations) {
        item.variations.forEach(v => addVariantRow(v.name, v.image));
    }
    document.getElementById('cat-edit-modal').style.display = 'flex';
}
function saveCatItem() {
    const n = document.getElementById('ce-name').value;
    const c = document.getElementById('ce-cost').value;
    const t = document.getElementById('ce-tier').value;
    const im = document.getElementById('ce-img').value;
    const d = document.getElementById('ce-desc').value;
    const vis = document.getElementById('ce-visible').checked;
    const cat = document.getElementById('ce-category').value;
    let variations = [];
    let colorFee = 0;
    let colorSelection = false;
    if (cat === 'premium') {
        document.querySelectorAll('#ce-variants-list .variant-row').forEach(row => {
            const vName = row.querySelector('.var-name').value.trim();
            const vImg = row.querySelector('.var-img').value.trim();
            if (vName)
                variations.push({
                    name: vName,
                    image: vImg
                });
        }
        );
        colorSelection = document.getElementById('ce-prem-color-check').checked;
        if (colorSelection) {
            colorFee = document.getElementById('ce-prem-color-fee').value;
        }
    }
    if (cat === 'custom') {
        colorFee = document.getElementById('ce-color-fee').value;
    }
    if (n) {
        const data = {
            name: n,
            cost: c,
            tier: t,
            icon: 'fa-cube',
            category: cat,
            desc: d,
            image: im,
            visible: vis,
            variations: variations,
            colorFee: colorFee,
            colorSelection: colorSelection
        };
        if (editingCatId) {
            const existing = DB.catalog.get(editingCatId);
            DB.catalog.update(editingCatId, { ...data, interest: existing?.interest || 0 });
        } else {
            DB.catalog.add({ ...data, interest: 0 });
        }
        catalogData = DB.catalog.getAll();
        renderCatalog();
        renderAdminLists();
        closeCatModal();
    }
}
function deleteCatItem(id) {
    showConfirm("Delete?", () => {
        DB.catalog.delete(id);
        catalogData = DB.catalog.getAll();
        renderCatalog();
        renderAdminLists();
    });
}
function closeCatModal() {
    document.getElementById('cat-edit-modal').style.display = 'none';
}
function toggleCatOptions(v) {
    document.getElementById('ce-options-container').style.display = v === 'premium' ? 'block' : 'none';
    document.getElementById('ce-custom-container').style.display = v === 'custom' ? 'block' : 'none';
}
function renderAdminInterest() {
    const intList = document.getElementById('admin-interest-list');
    if (!intList)
        return;
    intList.innerHTML = '';
    const st = catalogData.filter(c => (c.category === 'standard' || c.category === 'limited') && (c.interest || 0) > 0);
    if (st.length === 0) {
        intList.innerHTML = '<p style="color:#666; width:100%; text-align:center; padding:20px; font-size:0.9rem;">No active interest.</p>';
    } else {
        st.sort((a, b) => b.interest - a.interest);
        st.forEach(s => {
            let img = s.image && s.image.length > 5 ? `<img src="${sanitizeUrl(s.image)}">` : `<i class="fa-solid ${escapeHtml(s.icon)}"></i>`;
            let extraClass = s.category === 'limited' ? 'style="border:1px solid #e74c3c;"' : '';
            let namePrefix = s.category === 'limited' ? '<span style="color:#e74c3c;font-size:0.7rem;">[LTD]</span> ' : '';
            intList.innerHTML += `<div class="interest-card-square" ${extraClass}><div class="interest-visual">${img}</div><div style="width:100%;"><h4 style="margin:5px 0; color:white; font-size:0.9rem;">${namePrefix}${escapeHtml(s.name)}</h4><div class="interest-count-badge">${escapeHtml(String(s.interest))} Requests</div></div><div style="width:100%;"><button class="interest-reset-btn" onclick="resetInterest('${escapeJsString(s.id)}')">RESET</button></div></div>`;
        }
        );
    }
}

/* === QUEUE & REQUESTS === */
function renderAdminRequests() {
    const c = document.getElementById('admin-requests-list');
    if (!c)
        return;
    c.innerHTML = '';
    const pending = requestsData.filter(r => r.status === 'Waiting for Payment');
    if (pending.length === 0) {
        c.innerHTML = '<p style="color:#666; padding:10px;">No incoming payment requests.</p>';
        return;
    }
    pending.forEach(r => {
        c.innerHTML += `<div class="req-item"><div style="flex:1;"><div style="color:white; font-weight:bold;">${escapeHtml(r.name)}</div><div style="color:var(--color-catalog); font-weight:600;">${escapeHtml(r.item)}</div><div style="color:#888; font-size:0.75rem;">${escapeHtml(r.details)}</div><div style="color:#aaa; font-size:0.7rem; margin-top:2px;">${new Date(r.createdAt).toLocaleDateString()}</div></div><div class="req-actions"><button onclick="approveRequest('${escapeJsString(r.id)}')" style="background:#2ecc71; color:black;">PAID</button><button onclick="deleteRequest('${escapeJsString(r.id)}')" style="background:#e74c3c; color:white;">DEL</button></div></div>`;
    }
    );
}
function renderAdminQueue() {
    const qList = document.getElementById('admin-queue-manage-list');
    if (!qList)
        return;

    qList.innerHTML = '';

    // Filter active items
    const activeQ = queueData.filter(q => q.status !== 'Picked Up' && q.status !== 'Waiting for Payment');

    // Sort Chronologically (Oldest First)
    activeQ.sort((a, b) => a.createdAt - b.createdAt);

    if (activeQ.length === 0) {
        qList.innerHTML = '<p style="color:#666; padding:10px;">Queue is empty.</p>';
        return;
    }

    activeQ.forEach(q => {
        const id = q.id ? `'${q.id}'` : `'${queueData.indexOf(q)}'`;
        const detHtml = q.details ? `| ${escapeHtml(q.details)}` : '';

        // Determine Color
        let colorCode = '#444';
        const s = q.status.toLowerCase();

        if (s.includes('ready')) {
            colorCode = '#2ecc71';
            // Green
        } else if (s.includes('printing')) {
            colorCode = '#9b59b6';
            // Purple
        } else if (s.includes('pending')) {
            colorCode = '#7f8c8d';
            // Gray
        } else if (s.includes('waiting')) {
            colorCode = '#3498db';
            // Blue
        }

        // Added border-left: 4px solid ${colorCode} to the style attribute
        qList.innerHTML += `
            <div class="admin-list-item" style="display:block; margin-bottom:10px; background:#161932; padding:10px; border-radius:6px; border:1px solid #34495e; border-left: 4px solid ${colorCode};">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${escapeHtml(q.name)}</strong> 
                    <span class="status-badge" style="color:white; background:${colorCode};">${escapeHtml(q.status)}</span>
                </div>
                <div style="color:#aaa; font-size:0.8rem;">
                    ${escapeHtml(q.item)} ${detHtml}
                </div>
                <div style="margin-top:5px; display:flex; gap:5px;">
                    <button onclick="updateQueueStatus(${id},'Pending')" class="admin-btn" style="width:auto; padding:2px 8px; font-size:0.7rem; background:#555;">Pend</button>
                    <button onclick="updateQueueStatus(${id},'Printing')" class="admin-btn" style="width:auto; padding:2px 8px; font-size:0.7rem; background:#9b59b6;">Print</button>
                    <button onclick="updateQueueStatus(${id},'Ready!')" class="admin-btn" style="width:auto; padding:2px 8px; font-size:0.7rem; background:#2ecc71;">Ready</button>
                    <button onclick="updateQueueStatus(${id},'Picked Up')" class="admin-btn" style="width:auto; padding:2px 8px; font-size:0.7rem; background:#1abc9c;">Done</button>
                </div>
            </div>
        `;
    }
    );
}
function toggleHistoryView() {
    showHistory = !showHistory;
    const b = document.querySelector('#admin-queue .btn-edit');
    if (b)
        b.innerText = showHistory ? "Hide History" : "History";
    const h = document.getElementById('admin-queue-history-list');
    if (h) {
        h.style.display = showHistory ? 'block' : 'none';
        renderQueueHistory();
    }
}
function renderQueueHistory() {
    const h = document.getElementById('history-content');
    if (!h)
        return;
    h.innerHTML = '';
    const p = queueData.filter(q => q.status === 'Picked Up');
    if (p.length === 0)
        h.innerHTML = '<p style="color:#666;font-size:0.8rem;">No history.</p>';
    else
        p.forEach(q => {
            const detHtml = q.details ? ` - ${escapeHtml(q.details)}` : '';
            h.innerHTML += `<div class="admin-list-item" style="opacity:0.6"><strong>${escapeHtml(q.name)}</strong> - ${escapeHtml(q.item)} ${detHtml} <span style="font-size:0.7rem">${q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}</span></div>`;
        }
        );
}

/* === ROSTER & LEADERBOARD === */
function renderAdminLbPreview() {
    const c = document.getElementById('admin-lb-preview-list');
    if (!c)
        return;
    c.innerHTML = '';
    const sorted = [...leaderboardData].sort((a, b) => b.points - a.points);
    if (sorted.length === 0) {
        c.innerHTML = '<p style="color:#666; padding:10px;">No ninjas yet.</p>';
        return;
    }
    sorted.forEach((ninja, index) => {
        const u = ninja.username ? ` <span style="font-size:0.7rem; color:#aaa;">(${ninja.username})</span>` : '';
        c.innerHTML += `<div class="admin-lb-preview-row"><div class="admin-lb-rank">#${index + 1}</div><div class="admin-lb-name">${formatName(ninja.name)}${u}</div><div class="admin-lb-points">${ninja.points}</div></div>`;
    }
    );
}
function adminSearchNinja() {
    const q = document.getElementById('admin-lb-search').value.toLowerCase();
    const resDiv = document.getElementById('admin-lb-results');
    resDiv.innerHTML = '';
    if (q.length < 2)
        return;
    const found = leaderboardData.filter(n => n.name.toLowerCase().includes(q) || (n.username && n.username.toLowerCase().includes(q)));
    found.slice(0, 5).forEach(n => {
        const u = n.username ? ` (${n.username})` : '';
        resDiv.innerHTML += `<div style="background:#111; padding:10px; margin-bottom:5px; border-radius:4px; cursor:pointer; border:1px solid #333;" onclick="selectNinjaToEdit('${n.id}')">${formatName(n.name)} <span style="color:#888; font-size:0.8rem;">${u}</span> <span style="color:var(--color-games); font-weight:bold; float:right;">${n.points} pts</span></div>`;
    }
    );
}
function selectNinjaToEdit(id) {
    const n = leaderboardData.find(x => x.id === id);
    if (!n)
        return;
    editingNinjaId = id;
    document.getElementById('admin-lb-results').innerHTML = '';
    document.getElementById('admin-lb-search').value = '';
    document.getElementById('admin-lb-edit').style.display = 'block';
    document.getElementById('admin-lb-name').innerText = formatName(n.name) + (n.username ? ` (${n.username})` : '');
    document.getElementById('admin-lb-current').innerText = n.points;
    document.getElementById('admin-lb-belt-display').innerText = n.belt || 'White';
    document.getElementById('admin-lb-belt').value = '';
    document.getElementById('admin-lb-obsidian').value = '';
    document.getElementById('admin-lb-gold').value = '';
    document.getElementById('admin-lb-silver').value = '';
    document.getElementById('admin-note-text').value = '';
    renderNinjaNotesAdmin(n);
}
function adminUpdatePoints() {
    if (!editingNinjaId)
        return;
    const obs = parseInt(document.getElementById('admin-lb-obsidian').value) || 0;
    const gold = parseInt(document.getElementById('admin-lb-gold').value) || 0;
    const silver = parseInt(document.getElementById('admin-lb-silver').value) || 0;
    const val = (obs * 25) + (gold * 5) + (silver * 1);
    if (val === 0 && !confirm("Update points by 0?"))
        return;
    const n = leaderboardData.find(x => x.id === editingNinjaId);
    if (!n)
        return;
    const newPoints = (n.points || 0) + val;
    DB.leaderboard.update(editingNinjaId, { points: newPoints });
    leaderboardData = DB.leaderboard.getAll();
    renderLeaderboard();
    document.getElementById('admin-lb-edit').style.display = 'none';
    document.getElementById('admin-lb-obsidian').value = '';
    document.getElementById('admin-lb-gold').value = '';
    document.getElementById('admin-lb-silver').value = '';
    showAlert("Success", `Updated ${formatName(n.name)} to ${newPoints} pts`);
}
function adminUpdateBelt() {
    if (!editingNinjaId)
        return;
    const newBelt = document.getElementById('admin-lb-belt').value;
    if (!newBelt) {
        showAlert("Error", "Please select a belt level");
        return;
    }
    const n = leaderboardData.find(x => x.id === editingNinjaId);
    if (!n)
        return;
    DB.leaderboard.update(editingNinjaId, { belt: newBelt });
    leaderboardData = DB.leaderboard.getAll();
    renderLeaderboard();
    document.getElementById('admin-lb-belt-display').innerText = newBelt;
    document.getElementById('admin-lb-belt').value = '';
    showAlert("Success", `Updated ${formatName(n.name)} belt to ${newBelt}`);
}
function adminAddNinja() {
    const name = document.getElementById('admin-roster-add-name').value;
    if (!name)
        return;
    const formatted = formatName(name);
    const username = generateUsername(name, leaderboardData);
    const data = {
        name: formatted,
        username: username,
        points: 0,
        belt: 'White'
    };
    DB.leaderboard.add(data);
    leaderboardData = DB.leaderboard.getAll();
    renderLeaderboard();
    document.getElementById('admin-roster-add-name').value = '';
    showAlert("Success", `Added ${formatted} (User: ${username})`);
}
function processCSVFile() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];
    if (!file) {
        showAlert("Error", "Please select a CSV file first.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');
        if (lines.length < 2) {
            showAlert("Error", "CSV is empty or missing headers.");
            return;
        }
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const idxFirst = headers.indexOf('participant first name');
        const idxLast = headers.indexOf('participant last name');
        const idxRank = headers.indexOf('rank');
        const idxMem = headers.indexOf('membership');
        const idxUser = headers.indexOf('ninja username');
        if (idxFirst === -1 || idxLast === -1) {
            showAlert("Error", "CSV missing 'Participant First Name' or 'Participant Last Name'");
            return;
        }
        let addedCount = 0;
        let sessionNinjas = [...leaderboardData];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const parts = parseCSVLine(line);
            const getVal = (idx) => (idx !== -1 && idx < parts.length) ? parts[idx] : "";
            const fName = getVal(idxFirst);
            const lName = getVal(idxLast);
            if (!fName)
                continue;
            const displayName = formatName(fName + " " + lName);
            let belt = getVal(idxRank);
            if (!belt) {
                const mem = getVal(idxMem).toLowerCase();
                if (mem.includes('jr'))
                    belt = "JR White";
                else if (mem.includes('robotics'))
                    belt = "Robotics";
                else if (mem.includes('ai academy'))
                    belt = "AI";
                else
                    belt = "White";
            }
            let username = getVal(idxUser);
            if (!username) {
                username = generateUsername(fName + "." + lName, sessionNinjas);
            }
            const exists = sessionNinjas.some(n => (n.username && n.username.toLowerCase() === username.toLowerCase()) || n.name === displayName);
            if (!exists) {
                const newNinja = {
                    name: displayName,
                    username: username,
                    points: 0,
                    belt: belt,
                    createdAt: Date.now()
                };
                DB.leaderboard.add(newNinja);
                sessionNinjas.push(newNinja);
                addedCount++;
            }
        }
        leaderboardData = DB.leaderboard.getAll();
        renderLeaderboard();
        showAlert("Sync Complete", `Added ${addedCount} new ninjas.`);
        fileInput.value = '';
    }
        ;
    reader.readAsText(file);
}
function clearZeroPointNinjas() {
    showConfirm("Remove all ninjas with 0 points?", () => {
        const count = DB.leaderboard.deleteWhere(n => n.points === 0);
        leaderboardData = DB.leaderboard.getAll();
        renderLeaderboard();
        showAlert("Cleared", `Removed ${count} entries.`);
    });
}

/* === JAMS & CHALLENGES === */
function renderAdminJamsList() {
    const c = document.getElementById('admin-jams-list');
    if (!c)
        return;
    c.innerHTML = '';
    jamsData.forEach(j => {
        const color = j.color || '#2ecc71';
        c.innerHTML += `<div class="admin-list-wrapper"><div class="list-card" onclick="openAdminJamModal('${escapeJsString(j.id)}')" style="margin:0; border-left-color:${escapeHtml(color)}; cursor:pointer; flex-grow:1;"><div class="card-info"><h3>${escapeHtml(j.title)}</h3><p>${escapeHtml(j.dates)}</p></div><div class="status-badge" style="color:${escapeHtml(color)}">${escapeHtml(j.status || 'Active')}</div></div><button onclick="deleteJam('${escapeJsString(j.id)}')" class="btn-mini" style="background:#e74c3c; margin-left:10px;">Del</button></div>`;
    }
    );
}
function openAdminJamModal(id = null) {
    editingJamId = id;
    document.getElementById('jam-submissions-area').style.display = 'none';
    if (id) {
        const j = jamsData.find(x => x.id === id);
        document.getElementById('jam-modal-header').innerText = "Edit Jam";
        document.getElementById('jam-title').value = j.title;
        document.getElementById('jam-dates').value = j.dates;
        document.getElementById('jam-type').value = j.type;
        document.getElementById('jam-image').value = j.image;
        document.getElementById('jam-header').value = j.header;
        document.getElementById('jam-desc').value = j.desc;
        document.getElementById('jam-details').value = j.details;
        document.getElementById('jam-color').value = j.color || '#f1c40f';
        document.getElementById('jam-submissions-area').style.display = 'block';
        renderJamSubmissionsList(id, j.winners || []);
    } else {
        document.getElementById('jam-modal-header').innerText = "Create Jam";
        document.getElementById('jam-title').value = '';
        document.getElementById('jam-dates').value = '';
        document.getElementById('jam-image').value = '';
        document.getElementById('jam-header').value = '';
        document.getElementById('jam-desc').value = '';
        document.getElementById('jam-details').value = '';
        document.getElementById('jam-color').value = '#f1c40f';
    }
    document.getElementById('jam-admin-modal').style.display = 'flex';
}
function saveJam() {
    const data = {
        title: document.getElementById('jam-title').value,
        dates: document.getElementById('jam-dates').value,
        type: document.getElementById('jam-type').value,
        image: document.getElementById('jam-image').value,
        header: document.getElementById('jam-header').value,
        desc: document.getElementById('jam-desc').value,
        details: document.getElementById('jam-details').value,
        color: document.getElementById('jam-color').value,
        status: 'active'
    };
    if (!data.title)
        return;
    if (editingJamId) {
        DB.jams.update(editingJamId, data);
    } else {
        DB.jams.add(data);
    }
    jamsData = DB.jams.getAll();
    renderJams();
    renderAdminLists();
    document.getElementById('jam-admin-modal').style.display = 'none';
}
function deleteJam(id) {
    showConfirm("Delete this Jam?", () => {
        DB.jams.delete(id);
        jamsData = DB.jams.getAll();
        renderJams();
        renderAdminJamsList();
    });
}
function renderJamSubmissionsList(jamId, currentWinners) {
    const list = document.getElementById('jam-subs-list');
    list.innerHTML = '';
    const subs = jamSubmissions.filter(s => s.jamId === jamId);
    if (subs.length === 0) {
        list.innerHTML = '<p style="color:#666;">No submissions yet.</p>';
        return;
    }
    subs.forEach(s => {
        const isWinner = currentWinners.some(w => w.id === s.id);
        const check = isWinner ? 'checked' : '';
        list.innerHTML += `<div style="display:flex; align-items:center; background:#111; padding:5px; margin-bottom:5px; border-radius:4px;"><input type="checkbox" class="winner-check" value="${escapeHtml(s.id)}" ${check} style="margin-right:10px;"><div style="flex-grow:1;"><div style="color:white;">${escapeHtml(s.ninjaName)}</div><div style="color:#888; font-size:0.7rem;">${escapeHtml(s.gameTitle)}</div></div><a href="${sanitizeUrl(s.link)}" target="_blank" rel="noopener noreferrer" style="color:var(--color-jams); font-size:0.8rem;">Link</a></div>`;
    }
    );
}
function revealWinners() {
    if (!editingJamId)
        return;
    const checkboxes = document.querySelectorAll('.winner-check:checked');
    const winnerIds = Array.from(checkboxes).map(c => c.value);
    const winners = jamSubmissions.filter(s => winnerIds.includes(s.id));
    const update = {
        status: 'revealed',
        revealedAt: Date.now(),
        winners: winners
    };
    DB.jams.update(editingJamId, update);
    jamsData = DB.jams.getAll();
    renderJams();
    showAlert("Success", "Winners Revealed!");
    document.getElementById('jam-admin-modal').style.display = 'none';
}

function renderAdminChallenges() {
    const list = document.getElementById('admin-challenges-list');
    if (!list)
        return;
    list.innerHTML = '';
    if (challengesData.length === 0) {
        list.innerHTML = '<p style="color:#666;">No active challenges.</p>';
        return;
    }
    challengesData.forEach(c => {
        const icon = getChallengeIcon(c.type);
        list.innerHTML += `<div class="admin-list-wrapper"><div class="list-card" style="margin:0; border-left: 4px solid #3498db;"><div class="card-info"><h3><i class="fa-solid ${icon}"></i> ${escapeHtml(c.type)}</h3><p>${escapeHtml(c.desc)} (${escapeHtml(c.reward)})</p></div></div><button onclick="openChallengeModal('${escapeJsString(c.id)}')" class="btn-mini" style="background:#f39c12;color:black;">Edit</button><button onclick="deleteChallenge('${escapeJsString(c.id)}')" class="btn-mini" style="background:#e74c3c;">Del</button></div>`;
    }
    );
}
function openChallengeModal(id = null) {
    editingChallengeId = id;
    if (id) {
        const c = challengesData.find(x => x.id === id);
        document.getElementById('chal-type').value = c.type;
        document.getElementById('chal-desc').value = c.desc;
        document.getElementById('chal-reward').value = c.reward;
        document.getElementById('chal-duration').value = c.duration || '';
    } else {
        document.getElementById('chal-type').value = 'MakeCode Arcade';
        document.getElementById('chal-desc').value = '';
        document.getElementById('chal-reward').value = '';
        document.getElementById('chal-duration').value = '';
    }
    document.getElementById('challenge-admin-modal').style.display = 'flex';
}
function saveChallenge() {
    const type = document.getElementById('chal-type').value;
    const desc = document.getElementById('chal-desc').value;
    const reward = document.getElementById('chal-reward').value;
    const duration = document.getElementById('chal-duration').value;
    if (!desc)
        return showAlert("Error", "Description required");
    const data = {
        type,
        desc,
        reward,
        duration
    };
    if (editingChallengeId) {
        DB.challenges.update(editingChallengeId, data);
    } else {
        DB.challenges.add(data);
    }
    challengesData = DB.challenges.getAll();
    renderChallenges();
    renderAdminChallenges();
    document.getElementById('challenge-admin-modal').style.display = 'none';
}
function deleteChallenge(id) {
    showConfirm("Delete this challenge?", () => {
        DB.challenges.delete(id);
        challengesData = DB.challenges.getAll();
        renderChallenges();
        renderAdminChallenges();
    });
}

function renderAdminGames() {
    const activeGame = gamesData.find(g => g.status === 'active');
    if (activeGame) {
        document.getElementById('ag-title').value = activeGame.title;
        document.getElementById('ag-image').value = activeGame.image;
        document.getElementById('ag-desc').value = activeGame.desc;
        document.getElementById('ag-link').value = activeGame.link || '';
        // Load Link
        renderAdminGameScores(activeGame);
    } else {
        document.getElementById('ag-title').value = '';
        document.getElementById('ag-image').value = '';
        document.getElementById('ag-desc').value = '';
        document.getElementById('ag-link').value = '';
        // Clear Link
        document.getElementById('admin-game-scores-list').innerHTML = '<p style="color:#666;">No active game. Create one above.</p>';
    }
}

function saveActiveGame() {
    const title = document.getElementById('ag-title').value;
    const image = document.getElementById('ag-image').value;
    const desc = document.getElementById('ag-desc').value;
    const link = document.getElementById('ag-link').value;
    // Get Link

    if (!title)
        return showAlert("Error", "Title required.");

    // Add link to data object
    const gameData = {
        title,
        image,
        desc,
        link,
        status: 'active',
        month: new Date().toLocaleString('default', {
            month: 'long'
        })
    };

    let activeGame = gamesData.find(g => g.status === 'active');
    if (activeGame) {
        DB.games.update(activeGame.id, gameData);
    } else {
        DB.games.add({ ...gameData, scores: [] });
    }
    gamesData = DB.games.getAll();
    renderGames();
    renderAdminGames();
    showAlert("Saved", "Game Updated!");
}
function renderAdminGameScores(game) {
    const list = document.getElementById('admin-game-scores-list');
    list.innerHTML = '';
    if (!game.scores || game.scores.length === 0) {
        list.innerHTML = '<p style="color:#666;">No scores yet. Search for ninjas above to add them.</p>';
        return;
    }
    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    game.scores.sort((a, b) => b.score - a.score).forEach((s, idx) => {
        const medal = idx < 5 ? medals[idx] : `${idx + 1}.`;
        const deleteId = s.ninjaId || s.name; // Support both old and new format
        list.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; margin-bottom:5px; border-radius:4px;">
            <span>${medal} ${escapeHtml(s.name)} - <strong>${s.score}</strong></span>
            <button onclick="deleteGameScore('${deleteId}')" style="background:#e74c3c; border:none; color:white; border-radius:4px; cursor:pointer; padding:4px 8px;">✕</button>
        </div>`;
    });
}

/* === NINJA SEARCH FOR GAME SCORES === */
function searchNinjaForGame() {
    const search = document.getElementById('ag-ninja-search').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('ag-ninja-results');

    if (search.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }

    // Filter leaderboard for matching ninjas
    const matches = leaderboardData.filter(n =>
        (n.name && n.name.toLowerCase().includes(search)) ||
        (n.username && n.username.toLowerCase().includes(search))
    ).slice(0, 8); // Limit to 8 results

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div style="padding:10px; color:#666;">No ninjas found</div>';
        resultsDiv.style.display = 'block';
        return;
    }

    resultsDiv.innerHTML = matches.map(n => `
        <div onclick="selectNinjaForScore('${n.id}', '${escapeHtml(n.name)}')" 
             style="padding:10px; cursor:pointer; border-bottom:1px solid #222; color:#fff;"
             onmouseover="this.style.background='#222'" onmouseout="this.style.background='transparent'">
            ${escapeHtml(n.name)} ${n.username ? '<span style="color:#666;">@' + escapeHtml(n.username) + '</span>' : ''}
        </div>
    `).join('');
    resultsDiv.style.display = 'block';
}

function selectNinjaForScore(ninjaId, name) {
    document.getElementById('ag-selected-ninja-id').value = ninjaId;
    document.getElementById('ag-score-name').value = name;
    document.getElementById('ag-ninja-search').value = '';
    document.getElementById('ag-ninja-results').style.display = 'none';
    document.getElementById('ag-score-val').focus();
}

function addGameScore() {
    const ninjaId = document.getElementById('ag-selected-ninja-id').value;
    const name = document.getElementById('ag-score-name').value;
    const score = parseInt(document.getElementById('ag-score-val').value);

    if (!ninjaId || !name) {
        return showAlert("Error", "Please select a ninja from the search.");
    }
    if (isNaN(score)) {
        return showAlert("Error", "Please enter a valid score.");
    }

    const activeGame = gamesData.find(g => g.status === 'active');
    if (!activeGame)
        return showAlert("Error", "Create a game first.");

    const newScores = activeGame.scores || [];
    // Remove existing entry for same ninja (by ID)
    const filtered = newScores.filter(s => s.ninjaId !== ninjaId);
    filtered.push({
        ninjaId,
        name,
        score
    });

    DB.games.update(activeGame.id, { scores: filtered });
    gamesData = DB.games.getAll();
    renderGames();
    renderAdminGames();

    // Clear inputs
    document.getElementById('ag-selected-ninja-id').value = '';
    document.getElementById('ag-score-name').value = '';
    document.getElementById('ag-score-val').value = '';
}

function deleteGameScore(idOrName) {
    const activeGame = gamesData.find(g => g.status === 'active');
    if (!activeGame)
        return;
    // Support both old (name) and new (ninjaId) formats
    const newScores = activeGame.scores.filter(s =>
        s.ninjaId !== idOrName && s.name !== idOrName
    );
    DB.games.update(activeGame.id, { scores: newScores });
    gamesData = DB.games.getAll();
    renderGames();
    renderAdminGames();
}

function archiveActiveGame() {
    const activeGame = gamesData.find(g => g.status === 'active');
    if (!activeGame)
        return;

    // Get point values from inputs
    const points = [
        parseInt(document.getElementById('ag-pts-1').value) || 15,
        parseInt(document.getElementById('ag-pts-2').value) || 10,
        parseInt(document.getElementById('ag-pts-3').value) || 5,
        parseInt(document.getElementById('ag-pts-4').value) || 3,
        parseInt(document.getElementById('ag-pts-5').value) || 2
    ];

    // Sort scores and get top 5
    const sortedScores = (activeGame.scores || []).sort((a, b) => b.score - a.score);
    const top5 = sortedScores.slice(0, 5);

    // Build confirmation message
    let awardMsg = "End this game and award points?\n\n";
    if (top5.length > 0) {
        awardMsg += "Points to award:\n";
        top5.forEach((s, i) => {
            awardMsg += `${i + 1}. ${s.name}: +${points[i]} pts\n`;
        });
    } else {
        awardMsg += "No scores recorded - no points will be awarded.";
    }

    showConfirm(awardMsg, async () => {
        showLoading('Awarding points...');
        try {
            // Award points to top 5
            for (let i = 0; i < top5.length; i++) {
                const score = top5[i];
                const ninja = leaderboardData.find(n => n.id === score.ninjaId);
                if (ninja) {
                    const newPoints = (ninja.points || 0) + points[i];
                    await DB.leaderboard.update(ninja.id, { points: newPoints });
                }
            }

            // Archive the game with winner info
            await DB.games.update(activeGame.id, {
                status: 'archived',
                awardedPoints: points,
                winners: top5.map((s, i) => ({ ...s, pointsAwarded: points[i] }))
            });

            // Reload data
            leaderboardData = await DB.leaderboard.getAllAsync();
            gamesData = DB.games.getAll();

            renderGames();
            renderAdminGames();
            renderLeaderboard();

            showAlert("Success", `Game ended! ${top5.length} ninja${top5.length !== 1 ? 's' : ''} awarded points.`);
        } finally {
            hideLoading();
        }
    }, 'success');
}

/* === SYSTEM === */
function manageFilaments() {
    const list = prompt("Edit Filament Colors (Comma Separated):", filamentData.join(', '));
    if (list) {
        filamentData = list.split(',').map(s => s.trim()).filter(s => s);
        // Save via LocalDB settings
        const existing = DB.settings.get('filaments');
        if (existing) {
            DB.settings.update('filaments', { colors: filamentData });
        } else {
            DB.settings.add({ id: 'filaments', colors: filamentData });
        }
        showAlert("Updated", "Filament list updated.");
    }
}
function openGitHubUpload() {
    if (GITHUB_REPO_URL.includes("github.com"))
        window.open(GITHUB_REPO_URL.replace(/\/$/, "") + "/upload/main", '_blank');
    else
        showAlert("Error", "Configure GITHUB_REPO_URL");
}
function openJamModal(id) {
    const j = jamsData.find(x => x.id === id);
    if (!j)
        return;
    document.getElementById('modal-title').innerText = j.title;
    document.getElementById('modal-desc').innerText = `Details for ${j.title}`;
    document.getElementById('modal-deadline').innerText = j.deadline;
    document.getElementById('jam-modal').style.display = 'flex';
}
function closeJamModal() {
    document.getElementById('jam-modal').style.display = 'none';
}

/* ================= QUEUE MANAGEMENT ================= */

// Manually add an item to the queue (Admin Side)
function adminAddQueueItem() {
    const name = prompt("Ninja Name:");
    if (!name)
        return;
    const item = prompt("Item Name / Description:");
    if (!item)
        return;
    const details = prompt("Details (Color/Link) [Optional]:") || "";

    const queueItem = {
        name: name,
        item: item,
        details: details,
        status: "Pending",
        createdAt: Date.now(),
        addedByAdmin: true,
        adminAddedAt: new Date().toISOString()
    };

    DB.queue.add(queueItem);
    queueData = DB.queue.getAll();
    renderAdminQueue();
    renderQueue();
    showAlert("Success", "Item added to queue.");
}

// Move a Request -> Queue
function approveRequest(id) {
    const req = requestsData.find(r => r.id === id);
    if (!req)
        return;

    // Use custom modal with 'success' (Green) theme
    showConfirm(`Mark request for ${req.item} by ${req.name} as PAID?`, () => {

        // Points already deducted at submission time

        const queueItem = {
            name: req.name,
            item: req.item,
            details: req.details || '',
            status: "Pending",
            createdAt: Date.now(),
            paidAt: Date.now(),
            originRequestId: id
        };

        // Add to Queue and delete from Requests
        DB.queue.add(queueItem);
        DB.requests.delete(id);
        queueData = DB.queue.getAll();
        requestsData = DB.requests.getAll();
        renderAdminLists();

    }, 'success');
}

function deleteRequest(id) {
    const req = requestsData.find(r => r.id === id);
    if (!req) return;

    showConfirm(`Deny request for ${req.item} by ${req.name}? Points will be refunded.`, () => {
        // Refund points to ninja
        const cost = parseInt(req.cost) || 0;
        if (cost > 0) {
            // Find ninja by stored ID, name, or userId
            let ninja = null;
            if (req.ninjaId) {
                ninja = leaderboardData.find(n => n.id === req.ninjaId);
            }
            if (!ninja) {
                ninja = leaderboardData.find(n =>
                    n.name.toLowerCase() === req.name.toLowerCase() ||
                    (n.username && n.username.toLowerCase() === (req.userId || '').toLowerCase())
                );
            }

            if (ninja) {
                const newPoints = (ninja.points || 0) + cost;
                DB.leaderboard.update(ninja.id, { points: newPoints });
                leaderboardData = DB.leaderboard.getAll();
                console.log(`Refunded ${cost} points to ${ninja.name}. New balance: ${newPoints}`);
            }
        }

        DB.requests.delete(id);
        requestsData = DB.requests.getAll();
        renderAdminRequests();
        renderAdminLbPreview();
    });
}

function updateQueueStatus(id, status) {
    // If id is string, use it. If number (index), find object.
    let docId = id;
    if (typeof id === 'number') {
        docId = queueData[id].id;
    }

    DB.queue.update(docId, { status: status });
    queueData = DB.queue.getAll();
    renderQueue();
    renderAdminQueue();
}

function resetInterest(id) {
    if (!confirm("Reset interest count for this item?"))
        return;

    DB.catalog.update(id, { interest: 0 });
    catalogData = DB.catalog.getAll();
    renderAdminInterest();
}

/* === NINJA NOTES === */
function renderNinjaNotesAdmin(ninja) {
    const list = document.getElementById('admin-ninja-notes-list');
    if (!list) return;
    list.innerHTML = '';
    const notes = ninja.notes || [];
    if (notes.length === 0) {
        list.innerHTML = '<p style="color:#666; font-size:0.8rem; margin:0;">No notes for this ninja.</p>';
        return;
    }
    notes.forEach(note => {
        const date = new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        list.innerHTML += `
        <div class="admin-note-item">
            <div style="flex:1;">
                <div style="color:white; font-size:0.85rem;">${escapeHtml(note.text)}</div>
                <div style="color:#888; font-size:0.7rem; margin-top:3px;">\u2014 ${escapeHtml(note.author)} \u00b7 ${date}</div>
            </div>
            <button onclick="deleteNinjaNote('${note.id}')" class="btn-mini" style="background:#e74c3c; flex-shrink:0;">\u2715</button>
        </div>`;
    });
}

function addNinjaNote() {
    if (!editingNinjaId) return;
    const text = document.getElementById('admin-note-text').value.trim();
    if (!text) return showAlert('Error', 'Please write a note first.');
    const ninja = leaderboardData.find(x => x.id === editingNinjaId);
    if (!ninja) return;
    const notes = ninja.notes || [];
    const authorName = (currentUser && currentUser.name) ? currentUser.name : 'Sensei';
    notes.push({
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        text: text,
        author: authorName,
        createdAt: Date.now()
    });
    DB.leaderboard.update(editingNinjaId, { notes: notes });
    leaderboardData = DB.leaderboard.getAll();
    document.getElementById('admin-note-text').value = '';
    renderNinjaNotesAdmin(leaderboardData.find(x => x.id === editingNinjaId));
    showAlert('Note Added', `Note saved for ${formatName(ninja.name)}.`);
}

function deleteNinjaNote(noteId) {
    if (!editingNinjaId) return;
    const ninja = leaderboardData.find(x => x.id === editingNinjaId);
    if (!ninja) return;
    const notes = (ninja.notes || []).filter(n => n.id !== noteId);
    DB.leaderboard.update(editingNinjaId, { notes: notes });
    leaderboardData = DB.leaderboard.getAll();
    renderNinjaNotesAdmin(leaderboardData.find(x => x.id === editingNinjaId));
}

/* === SANDBOX SUBMISSIONS === */
function renderAdminSandbox() {
    // 1. Render Challenges Manager List
    renderAdminSandboxChallenges();

    // 2. Render Pending Submissions List
    const list = document.getElementById('admin-sandbox-list');
    if (!list) return;
    list.innerHTML = '';

    // Show only Pending submissions
    const pending = sandboxSubmissionsData.filter(s => s.status === 'Pending');
    if (pending.length === 0) {
        list.innerHTML = '<p style="color:#666; padding:10px;">No pending sandbox submissions.</p>';
        return;
    }

    pending.forEach(s => {
        const date = new Date(s.submittedAt).toLocaleDateString();
        list.innerHTML += `<div class="req-item">
            <div style="flex:1;">
                <div style="color:white; font-weight:bold;">${escapeHtml(s.ninjaName)}</div>
                <div style="color:var(--color-games); font-weight:600;">${escapeHtml(s.challengeName)}</div>
                <div style="color:#888; font-size:0.8rem; margin-top:2px;">
                    <a href="${sanitizeUrl(s.link)}" target="_blank" style="color:#3498db; text-decoration:none;">View Project Link <i class="fa-solid fa-external-link-alt"></i></a>
                </div>
                <div style="color:#aaa; font-size:0.7rem; margin-top:2px;">${date}</div>
            </div>
            <div class="req-actions">
                <button onclick="approveSandboxSubmission('${escapeJsString(s.id)}')"\n                    style="background:#2ecc71; color:black; font-weight:bold;">APPROVE (+${s.pointsPossible})</button>
                <button onclick="denySandboxSubmission('${escapeJsString(s.id)}')"\n                    style="background:#e74c3c; color:white; font-weight:bold;">DENY</button>
            </div>
        </div>`;
    });
}

function approveSandboxSubmission(id) {
    const sub = sandboxSubmissionsData.find(s => s.id === id);
    if (!sub) return;

    showConfirm(`Approve project for ${sub.ninjaName} and award ${sub.pointsPossible} points?`, () => {
        // Update submission status
        DB.sandboxSubmissions.update(id, {
            status: 'Approved',
            reviewedAt: Date.now()
        });

        // Award points to Ninja
        const ninja = leaderboardData.find(n => n.id === sub.ninjaId);
        if (ninja) {
            const newPoints = (ninja.points || 0) + (sub.pointsPossible || 0);
            DB.leaderboard.update(ninja.id, { points: newPoints });
            showAlert("Approved!", `Awarded ${sub.pointsPossible} points to ${ninja.name}.`);
        } else {
            showAlert("Warning", "Submission approved, but Ninja was not found to award points.");
        }

        // Refresh Data
        sandboxSubmissionsData = DB.sandboxSubmissions.getAll();
        leaderboardData = DB.leaderboard.getAll();
        renderAdminSandbox();
        renderLeaderboard();
        renderAdminLbPreview();
    }, 'success');
}

function denySandboxSubmission(id) {
    const sub = sandboxSubmissionsData.find(s => s.id === id);
    if (!sub) return;

    showConfirm(`Deny project submission from ${sub.ninjaName}? No points will be awarded.`, () => {
        // Update submission status
        DB.sandboxSubmissions.update(id, {
            status: 'Denied',
            reviewedAt: Date.now()
        });

        sandboxSubmissionsData = DB.sandboxSubmissions.getAll();
        renderAdminSandbox();
        showAlert("Denied", "Submission was denied.");
    });
}

function renderAdminSandboxChallenges() {
    const list = document.getElementById('admin-sandbox-challenges-list');
    if (!list) return;
    list.innerHTML = '';

    // Sort challenges by level then by name
    const sorted = [...(sandboxChallengesData || [])].sort((a, b) => {
        if (a.level !== b.level) return String(a.level).localeCompare(String(b.level));
        return (a.name || '').localeCompare(b.name || '');
    });

    if (sorted.length === 0) {
        list.innerHTML = '<p style="color:#666; padding:10px;">No custom challenges found.</p>';
        return;
    }

    sorted.forEach(c => {
        list.innerHTML += `<div class="req-item" style="border-left: 3px solid var(--color-catalog);">
            <div style="flex:1;">
                <div style="color:white; font-weight:bold;">${escapeHtml(c.name)}</div>
                <div style="color:#aaa; font-size:0.8rem;">Level ${escapeHtml(c.level)} | ${escapeHtml(c.difficulty)} | 🪙 ${c.points} pts</div>
                <div style="color:#888; font-size:0.75rem; margin-top:2px; max-width:80%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${escapeHtml(c.objective || c.desc || 'No description')}
                </div>
            </div>
            <div class="req-actions">
                <button onclick="openSandboxChallengeModal('${escapeJsString(c.id)}')" class="btn-mini" style="background:#f39c12; color:black;"><i class="fa-solid fa-pen"></i> Edit</button>
                <button onclick="deleteSandboxChallenge('${escapeJsString(c.id)}')" class="btn-mini" style="background:#e74c3c; color:white;"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });
}

function openSandboxChallengeModal(id = null) {
    editingChallengeId = id;
    if (id) {
        // Edit existing
        const c = sandboxChallengesData.find(x => x.id === id);
        if (!c) return;
        document.getElementById('sc-modal-title').innerText = 'Edit Sandbox Challenge';
        document.getElementById('sc-level').value = c.level;
        document.getElementById('sc-points').value = c.points;
        document.getElementById('sc-name').value = c.name;
        document.getElementById('sc-difficulty').value = c.difficulty || '';
        document.getElementById('sc-desc').value = c.objective || c.desc || '';
        document.getElementById('sc-theme').value = c.theme || '';
        document.getElementById('sc-time').value = c.time || '';
    } else {
        // Create new
        document.getElementById('sc-modal-title').innerText = 'New Sandbox Challenge';
        document.getElementById('sc-level').value = '1';
        document.getElementById('sc-points').value = '25';
        document.getElementById('sc-name').value = '';
        document.getElementById('sc-difficulty').value = '⭐';
        document.getElementById('sc-desc').value = '';
        document.getElementById('sc-theme').value = '';
        document.getElementById('sc-time').value = '';
    }
    document.getElementById('sandbox-challenge-admin-modal').style.display = 'flex';
}

function saveSandboxChallenge() {
    const level = document.getElementById('sc-level').value;
    const points = parseInt(document.getElementById('sc-points').value) || 0;
    const name = document.getElementById('sc-name').value.trim();
    const difficulty = document.getElementById('sc-difficulty').value.trim();
    const desc = document.getElementById('sc-desc').value.trim();
    const theme = document.getElementById('sc-theme').value.trim();
    const time = document.getElementById('sc-time').value.trim();

    if (!name || !desc) {
        showAlert('Missing Info', 'A name and description are required.');
        return;
    }

    const data = {
        level,
        points,
        name,
        difficulty,
        objective: desc,
        desc: desc,
        theme,
        time
    };

    if (editingChallengeId) {
        DB.sandboxChallenges.update(editingChallengeId, data);
        showAlert('Saved', 'Challenge updated.');
    } else {
        data.number = sandboxChallengesData.filter(x => x.level === level).length + 1;
        DB.sandboxChallenges.add(data);
        showAlert('Saved', 'New challenge added.');
    }

    sandboxChallengesData = DB.sandboxChallenges.getAll();
    if (typeof renderSandbox === 'function') renderSandbox(); // Update ninja UI if active
    renderAdminSandboxChallenges();
    document.getElementById('sandbox-challenge-admin-modal').style.display = 'none';
}

function deleteSandboxChallenge(id) {
    showConfirm('Delete this sandbox challenge permanently?', () => {
        DB.sandboxChallenges.delete(id);
        sandboxChallengesData = DB.sandboxChallenges.getAll();
        if (typeof renderSandbox === 'function') renderSandbox(); // Update ninja UI if active
        renderAdminSandboxChallenges();
        showAlert('Deleted', 'Challenge has been removed.');
    });
}
