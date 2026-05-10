// Important: Notification initializes global state binding variables
import './notification.js'; 
import './navigation.js';
import { db } from './firebase.js';
import './wallet.js';
import './spin.js';
import './tournament.js';
// Auth starts the primary session check last
import './auth.js'; 

import { ref, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Global DB Database Listeners
onValue(ref(db, 'categories'), snap => { 
    window.appData.categories = snap.val() || {}; 
    if (window.userData && window.renderCategories) window.renderCategories(); 
});

onValue(ref(db, 'tournaments'), snap => { 
    window.appData.tournaments = snap.val() || {}; 
    if (window.userData) {
        if (window.$('screen-play').classList.contains('active') && window.setPlayTab) window.setPlayTab(document.querySelector('#screen-play .tab-btn.active').dataset.status || 'Upcoming'); 
        if (window.$('screen-category-detail').classList.contains('active') && window.setCatTab) window.setCatTab(document.querySelector('#screen-category-detail .tab-btn.active').dataset.catStatus || 'Upcoming');
        if (window.$('screen-tournament-detail').classList.contains('active') && window.openTournamentDetail) window.openTournamentDetail(window.activeTournamentId, true);
    }
});

onValue(ref(db, 'banners'), snap => { 
    window.appData.banners = snap.val() || {}; 
    if (window.userData && window.renderHero) window.renderHero(); 
});

onValue(query(ref(db, 'users'), orderByChild('winnings'), limitToLast(50)), snap => {
    const usersArr =
