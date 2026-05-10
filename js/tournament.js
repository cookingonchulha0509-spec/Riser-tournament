import { db } from './firebase.js';
import { ref, get, update, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

window.currentSelectedSlot = null;
window.heroSlideIndex = 0;
window.heroSlideInterval = null;

window.renderLeaderboard = () => {
    const usersArr = window.appData.leaderboard ||[];
    if (usersArr.length === 0) {
        window.$('leaderboard-list').innerHTML = '<div style="text-align:center; color:#999; padding:40px; font-weight:600;">No rankings yet.</div>';
        return;
    }
    
    window.$('leaderboard-list').innerHTML = usersArr.map((u, i) => `
        <div style="display:flex; align-items:center; background:#FFF; border-radius:12px; padding:16px; margin-bottom:12px; border:1px solid #E0E0E0; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <div style="font-size:18px; font-weight:800; width:40px; text-align: center; color:${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'#333'};">${i<3 ? `<i class="fa-solid fa-medal"></i>` : `#${i+1}`}</div>
            <img src="${window.getAvatar(u.username)}" style="width:44px; height:44px; border-radius:50%; margin-right:16px; border:2px solid #EEE;">
            <div style="flex:1;">
                <div style="font-weight:800; font-size:15px; color:#000;">${u.username}</div>
                <div style="font-size:12px; color:#666; font-weight:600; margin-top:2px;">Kills: ${u.kills || 0} &nbsp;|&nbsp; Matches: ${u.matches || 0}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; color: #999; font-weight: 700;">EARNINGS</div>
                <div style="font-weight:800; font-size:16px; color:var(--color-orange);"><i class="fa-solid fa-coins text-gold"></i> ${u.winnings || 0}</div>
            </div>
        </div>
    `).join('');
};

window.renderHero = () => {
    const list = Object.values(window.appData.banners || {}).filter(b => b.active !== false && b.active !== 'false').sort((a,b) => (parseInt(a.sortOrder)||0) - (parseInt(b.sortOrder)||0));
    const slider = window.$('hero-slider');
    if (list.length > 0) {
        slider.innerHTML = list.map(b => `<div style="min-width: 100%; height: 160px; scroll-snap-align: center; border-radius: 8px; overflow: hidden; cursor:pointer; box-shadow:0 4px 8px rgba(0,0,0,0.3);" onclick="vibrate(10); ${b.url ? `window.open('${b.url}', '_blank')` : ''}"><img src="${b.img}" style="width:100%; height:100%; object-fit:cover;"></div>`).join('');
        clearInterval(window.heroSlideInterval);
        window.heroSlideInterval = setInterval(() => { if (!slider.children.length) return; window.heroSlideIndex = (window.heroSlideIndex + 1) % slider.children.length; slider.scrollTo({ left: slider.children[window.heroSlideIndex].offsetLeft, behavior: 'smooth' }); }, 4000);
    } else { slider.innerHTML = ''; }
};

window.renderCategories = () => {
    const list = Object.entries(window.appData.categories || {}).filter(([_, c]) => c.active !== false && c.active !== "false").sort((a,b) => (parseInt(a[1].sortOrder)||0) - (parseInt(b[1].sortOrder)||0));
    window.$('category-grid').innerHTML = list.length > 0 ? list.map(([id, c]) => `<div style="height: 120px; border-radius: 8px; overflow:hidden; position:relative; cursor:pointer; background:var(--color-navy-header); box-shadow: 0 4px 6px rgba(0,0,0,0.2);" onclick="vibrate(10); openCategory('${id}')"><img src="${c.img}" style="width:100%; height:100%; object-fit:cover; opacity:0.7;"><div style="position:absolute; bottom:0; left:0; right:0; background: rgba(0,0,0,0.8); padding: 6px; text-align:center; color:#FFF; font-size:11px; font-weight:800; text-transform:uppercase;">${c.name}</div></div>`).join('') : '';
};

window.generateCard = (id, t) => {
    const joined = t.joined || 0;
    const prog = t.totalSlots > 0 ? (joined / t.totalSlots) * 100 : 0;
    const isFull = joined >= t.totalSlots;
    const isMine = t.players && t.players[window.userData.uid];
    const dateStr = new Date(t.time).toLocaleString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    
    let btnHtml = '';
    if (t.status === 'Upcoming') {
        if (isMine) btnHtml = `<button class="btn" style="background:#333; color:#FFF; padding:10px 24px; font-size:14px; border-radius:4px; max-width: max-content;" onclick="event.stopPropagation(); window.openTournamentDetail('${id}', true); window.navTo('screen-tournament-detail'); window.switchTdTab('players');">JOINED</button>`;
        else if (isFull) btnHtml = `<button class="btn" style="background:var(--danger); color:#FFF; padding:10px 24px; font-size:14px; border-radius:4px; max-width: max-content;" onclick="event.stopPropagation();">FULL</button>`;
        else btnHtml = `<button class="btn btn-purple" style="padding:10px 32px; font-size:14px; border-radius:4px; max-width: max-content;" onclick="event.stopPropagation(); window.startJoinProcess('${id}');">JOIN NOW</button>`;
    } else {
        btnHtml = `<button class="btn" style="background:#999; color:#FFF; padding:10px 24px; font-size:14px; border-radius:4px; max-width: max-content;" onclick="event.stopPropagation();">${t.status}</button>`;
    }

    return `
    <div style="background: #FFF; border: 1px solid #E0E0E0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer;" onclick="vibrate(10); window.openTournamentDetail('${id}')">
        <div style="height: 160px; position: relative; background: #000;">
            <img src="${t.img}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.9)); padding: 12px; font-size: 11px; color: #FFF; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                ${t.title}
            </div>
        </div>
        <div style="padding: 16px;">
            <p style="font-size: 12px; color: #666; margin:0 0 16px 0; font-weight: 700;"><i class="fa-regular fa-clock"></i> ${dateStr}</p>
            <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 16px;">
                <div><div style="font-size: 11px; color: #999; font-weight: 800; margin-bottom:4px;">PRIZE POOL</div><div style="font-size: 16px; font-weight: 800; color: #000;"><i class="fa-solid fa-coins text-gold"></i> ${t.prizePool}</div></div>
                <div><div style="font-size: 11px; color: #999; font-weight: 800; margin-bottom:4px;">PER KILL</div><div style="font-size: 16px; font-weight: 800; color: #000;"><i class="fa-solid fa-coins text-gold"></i> ${t.perKill}</div></div>
                <div><div style="font-size: 11px; color: #999; font-weight: 800; margin-bottom:4px;">ENTRY FEE</div><div style="font-size: 16px; font-weight: 800; color: #000;"><i class="fa-solid fa-coins text-gold"></i> ${t.entryFee}</div></div>
            </div>
            <div style="display: flex; justify-content: space-between; text-align: center; border-bottom: 1px solid #EEE; padding-bottom: 16px; margin-bottom: 16px;">
                <div><div style="font-size: 11px; color: #999; font-weight: 800; margin-bottom:4px;">TEAM</div><div style="font-size: 14px; font-weight: 800; color: #333;">${t.teamSize || 'Duo'}</div></div>
                <div><div style="font-size: 11px; color: #999; font-weight: 800; margin-bottom:4px;">MAP</div><div style="font-size: 14px; font-weight: 800; color: #333;">${t.map || 'Bermuda'}</div></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; margin-right: 16px;">
                    <div style="width: 100%; height: 6px; background: #EEE; border-radius: 3px; overflow:hidden;"><div style="height: 100%; background: var(--color-orange); width: ${prog}%; border-radius: 3px;"></div></div>
                    <div style="font-size: 12px; color: #333; margin-top: 6px; font-weight: 700;">${joined}/${t.totalSlots} Slots Filled</div>
                </div>
                ${btnHtml}
            </div>
        </div>
    </div>`;
};

window.openCategory = (catId) => {
    const cat = window.appData.categories[catId]; if (!cat) return;
    window.activeCategoryName = cat.name; window.$('cd-title').innerText = cat.name;
    window.setCatTab('Upcoming'); window.navTo('screen-category-detail');
};

window.setCatTab = (status) => {
    document.querySelectorAll('#screen-category-detail .tab-btn').forEach(el => el.classList.remove('active')); document.querySelector(`#screen-category-detail .tab-btn[data-cat-status="${status}"]`).classList.add('active');
    if (!window.appData.tournaments) return;
    const filtered = Object.entries(window.appData.tournaments).filter(([_, t]) => t.category === window.activeCategoryName && t.status === status);
    window.$('cd-tournaments-list').innerHTML = filtered.length > 0 ? filtered.map(([id, t]) => window.generateCard(id, t)).join('') : `<div style="text-align:center; padding: 60px 20px;"><h4 style="color: #999; font-size:14px;">No ${status.toLowerCase()} matches.</h4></div>`;
};

window.setPlayTab = (status) => {
    document.querySelectorAll('#screen-play .tab-btn').forEach(el => el.classList.remove('active')); document.querySelector(`#screen-play .tab-btn[data-status="${status}"]`).classList.add('active');
    if (!window.appData.tournaments) return;
    const filtered = Object.entries(window.appData.tournaments).filter(([_, t]) => t.status === status);
    window.$('play-tournaments-list').innerHTML = filtered.length > 0 ? filtered.map(([id, t]) => window.generateCard(id, t)).join('') : `<div style="text-align:center; padding: 60px 20px;"><h4 style="color: #999; font-size:14px;">No ${status.toLowerCase()} matches.</h4></div>`;
};

window.switchTdTab = (tab) => {['info', 'players', 'leaderboard'].forEach(t => {
        window.$('td-tab-' + t).classList.add('hidden');
        const btn = document.querySelector(`.td-tab-btn[data-tab="${t}"]`);
        if(btn) btn.classList.remove('active');
    });
    window.$('td-tab-' + tab).classList.remove('hidden');
    const abtn = document.querySelector(`.td-tab-btn[data-tab="${tab}"]`);
    if(abtn) abtn.classList.add('active');
};

window.openTournamentDetail = (id, refreshOnly = false) => {
    window.activeTournamentId = id; const t = window.appData.tournaments[id]; if (!t) return;
    if (!refreshOnly) window.currentSelectedSlot = null;

    window.$('td-img').src = t.img; 
    window.$('td-title-header').innerText = t.title;
    window.$('td-title').innerText = t.title + " - Match #" + (id.substring(id.length - 3) || '000');
    
    window.$('td-entry').innerText = t.entryFee; window.$('td-prize').innerText = t.prizePool; window.$('td-kill').innerText = t.perKill; 
    window.$('td-map').innerText = t.map || 'Bermuda'; window.$('td-type').innerText = t.teamSize || 'Solo';
    window.$('td-desc').innerText = t.description || 'Welcome to this premium match. Ensure you follow all instructions carefully. Room details will automatically unlock before the match begins.';
    window.$('td-rules').innerText = t.rules || "1. Use exact in-game name.\n2. No Hacks/Emulators (Instant ban).\n3. Room details unlock before match starts.";

    const dateStr = new Date(t.time).toLocaleString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    if (window.$('td-schedule-text')) window.$('td-schedule-text').innerText = dateStr;

    window.$('td-joined-count').innerText = t.joined || 0;
    
    const playersArr = Object.values(t.players || {}).sort((a,b) => a.slot - b.slot);
    window.$('td-players-list').innerHTML = playersArr.length ? playersArr.map(p => `
        <div style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #E0E0E0;">
            <div style="width: 36px; height: 36px; background: var(--color-navy); color: #FFF; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 800; margin-right: 16px;">${p.slot}</div>
            <span style="font-weight: 800; font-size: 15px; color: #000;">${p.username}</span>
        </div>
    `).join('') : '<div style="padding:40px 20px; text-align:center; color:#999; font-weight:600;">No players joined yet.</div>';

    if (t.status === 'Completed') {
        window.$('td-tab-leaderboard').classList.remove('hidden');
        document.querySelector(`.td-tab-btn[data-tab="leaderboard"]`).style.display = 'block';
        let topPlayers = playersArr.slice(0, 10);
        if (topPlayers.length > 0) {
            window.$('td-leaderboard-content').innerHTML = topPlayers.map((p, i) => `
                <div style="padding:16px; border-bottom: 1px solid #E0E0E0; display:flex; align-items:center; gap:16px;">
                    <div style="font-size:16px; font-weight:800; color:#333; width: 24px;">#${i+1}</div> 
                    <img src="${window.getAvatar(p.username)}" style="width:36px; height:36px; border-radius:50%;">
                    <span style="font-weight:800; font-size:15px; color:#000;">${p.username}</span>
                </div>
            `).join('');
        } else {
            window.$('td-leaderboard-content').innerHTML = '<div style="padding:40px; color:#999; text-align:center;">Results not updated.</div>';
        }
    } else {
        document.querySelector(`.td-tab-btn[data-tab="leaderboard"]`).style.display = 'none';
    }
    
    if (!refreshOnly) { window.switchTdTab('info'); window.navTo('screen-tournament-detail'); }
};

window.startJoinProcess = (id) => {
    window.activeTournamentId = id;
    window.$('join-ingame').value = window.userData.username || ''; 
    window.currentSelectedSlot = null;
    window.$('join-step-1').classList.remove('hidden'); window.$('join-step-2').classList.add('hidden');
    window.navTo('screen-join');
};

window.goToJoinStep2 = () => {
    const name = window.$('join-ingame').value.trim();
    if (!name) return window.showToast('Exact game name required.', 'error');
    const t = window.appData.tournaments[window.activeTournamentId];
    window.$('btn-confirm-join').innerHTML = `PAY & JOIN <i class="fa-solid fa-coins text-gold" style="margin-left:4px;"></i> ${t.entryFee}`;
    window.renderJoinSlotGrid();
    window.$('join-step-1').classList.add('hidden'); window.$('join-step-2').classList.remove('hidden');
};

window.backToJoinStep1 = () => { window.$('join-step-2').classList.add('hidden'); window.$('join-step-1').classList.remove('hidden'); };

window.renderJoinSlotGrid = () => {
    const t = window.appData.tournaments[window.activeTournamentId];
    const filled = {}; Object.values(t.players || {}).forEach(p => { if (p.slot) filled[p.slot] = true; });
    let html = '';
    for (let i=1; i<=t.totalSlots; i++) {
        if (filled[i]) html += `<div class="slot-box filled">${i}</div>`;
        else { const isSel = window.currentSelectedSlot === i; html += `<div class="slot-box ${isSel ? 'selected' : ''}" onclick="vibrate(10); window.selectJoinSlot(${i})">${i}</div>`; }
    }
    window.$('join-slot-grid').innerHTML = html;
    if (window.currentSelectedSlot) window.$('join-selected-text').innerText = `Selected: Slot #${window.currentSelectedSlot}`;
    else window.$('join-selected-text').innerText = `Select an empty slot`;
};

window.selectJoinSlot = (i) => { window.currentSelectedSlot = i; window.renderJoinSlotGrid(); };

window.isJoining = false;
window.$('btn-confirm-join').onclick = async () => {
    if (window.isJoining) return;
    const t = window.appData.tournaments[window.activeTournamentId];
    const name = window.$('join-ingame').value.trim();
    if (!name) return window.showToast('In-game name required.', 'error');
    if (!window.currentSelectedSlot) return window.showToast('Select an empty slot.', 'error');
    
    window.isJoining = true; 
    window.setLoadingBtn('btn-confirm-join', true, '');

    try {
        const currentBal = (await get(ref(db, `users/${window.userData.uid}/balance`))).val() || 0;
        const freshT = (await get(ref(db, `tournaments/${window.activeTournamentId}`))).val();
        
        if (currentBal < freshT.entryFee) throw new Error('Insufficient Coins. Please add coins first.');
        if (Object.values(freshT.players || {}).some(p => p.slot == window.currentSelectedSlot)) throw new Error('Slot taken. Please choose another.'); 
        if (freshT.players && freshT.players[window.userData.uid]) throw new Error('You have already joined this match.'); 

        const updates = {};
        updates[`users/${window.userData.uid}/balance`] = currentBal - freshT.entryFee;
        updates[`users/${window.userData.uid}/matches`] = (window.userData.matches || 0) + 1;
        
        const newTxKey = push(ref(db, `walletHistory/${window.userData.uid}`)).key;
        updates[`walletHistory/${window.userData.uid}/${newTxKey}`] = { 
            amount: freshT.entryFee, type: 'down', note: `Entry: ${freshT.title}`, date: new Date().toISOString() 
        };
        
        updates[`tournaments/${window.activeTournamentId}/players/${window.userData.uid}`] = { 
            username: name, slot: window.currentSelectedSlot, joinedAt: new Date().toISOString(), uid: window.userData.uid 
        };
        updates[`tournaments/${window.activeTournamentId}/joined`] = (freshT.joined || 0) + 1;

        await update(ref(db), updates); 
        
        window.showToast('Successfully Joined!'); 
        history.back(); 
        window.openTournamentDetail(window.activeTournamentId, true);
        window.switchTdTab('players');
    } catch(e) { 
        window.showToast(e.message || 'Error joining match.', 'error'); 
    } finally { 
        window.isJoining = false; 
        window.setLoadingBtn('btn-confirm-join', false, `PAY & JOIN <i class="fa-solid fa-coins text-gold" style="margin-left:4px;"></i> ${t.entryFee}`);
    }
};
