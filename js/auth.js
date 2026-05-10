import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get, set, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

window.$('link-to-register').onclick = () => { window.vibrate(10); window.$('form-login').classList.add('hidden'); window.$('form-register').classList.remove('hidden'); };
window.$('link-to-login').onclick = () => { window.vibrate(10); window.$('form-register').classList.add('hidden'); window.$('form-login').classList.remove('hidden'); };

window.$('form-login').onsubmit = async (e) => { 
    e.preventDefault(); 
    window.setLoadingBtn('btn-login', true, 'Sign In');
    try {
        await signInWithEmailAndPassword(auth, window.$('login-email').value, window.$('login-password').value);
    } catch(err) {
        window.showToast(window.translateError(err), 'error');
        window.setLoadingBtn('btn-login', false, 'Sign In');
    }
};

window.$('form-register').onsubmit = async (e) => {
    e.preventDefault(); 
    window.setLoadingBtn('btn-register', true, 'Register');
    try {
        const cred = await createUserWithEmailAndPassword(auth, window.$('reg-email').value, window.$('reg-password').value);
        await set(ref(db, `users/${cred.user.uid}`), { 
            username: window.$('reg-username').value.trim(), email: window.$('reg-email').value, 
            balance: 0, kills: 0, winnings: 0, matches: 0, uid: cred.user.uid, 
            status: 'active', createdAt: serverTimestamp(), lastSpin: 0 
        });
    } catch(err) {
        window.showToast(window.translateError(err), 'error');
        window.setLoadingBtn('btn-register', false, 'Register');
    }
};

window.logoutApp = () => { signOut(auth); window.userData = null; window.location.reload(); };

window.initUserSession = () => {
    window.$('main-app').classList.remove('hidden');
    window.showLoader(false); window.$('global-loader').style.pointerEvents = 'none';
    history.replaceState({ screen: 'screen-home' }, '', '#screen-home');
    window.navTo('screen-home', true);
    
    window.$('home-username').innerText = window.userData.username || 'Player'; 
    window.$('home-avatar').src = window.getAvatar(window.userData.username || 'Player');
    window.$('home-balance').innerText = window.userData.balance || 0; 
    window.$('wallet-balance-big').innerText = window.userData.balance || 0;
    window.$('wallet-header-balance').innerText = window.userData.balance || 0;
    
    window.$('profile-name').innerText = window.userData.username || 'Player'; 
    window.$('profile-avatar').src = window.getAvatar(window.userData.username || 'Player');
    window.$('profile-uid').innerText = window.userData.uid;
    
    window.$('stat-kills').innerText = window.userData.kills || 0; 
    window.$('stat-winnings').innerText = window.userData.winnings || 0; 
    window.$('stat-matches').innerText = window.userData.matches || 0;
    
    if (window.renderHero) window.renderHero(); 
    if (window.renderCategories) window.renderCategories(); 
    if (window.setPlayTab) window.setPlayTab('Upcoming'); 
    if (window.updateSpinStatus) window.updateSpinStatus();
};

setPersistence(auth, browserLocalPersistence).then(() => {
    onAuthStateChanged(auth, async user => {
        window.authDetermined = true;
        if (user) {
            window.currentUser = user;
            const userRef = ref(db, `users/${user.uid}`);
            let snap = await get(userRef);
            
            if (!snap.exists()) {
                await set(userRef, { 
                    username: user.displayName || 'Player', email: user.email, 
                    balance: 0, kills: 0, winnings: 0, matches: 0, 
                    uid: user.uid, status: 'active', createdAt: serverTimestamp(),
                    lastSpin: 0 
                });
                snap = await get(userRef);
            }
            
            onValue(userRef, userSnap => {
                const data = userSnap.val();
                if (data) {
                    if (data.status === 'banned') { window.logoutApp(); return window.showToast("Account banned.", "error"); }
                    window.userData = data;
                    if (window.watchTransactions) window.watchTransactions(user.uid);
                    
                    if (window.currentScreen === 'screen-auth') window.initUserSession();
                    else {
                        window.$('home-balance').innerText = window.userData.balance || 0;
                        window.$('wallet-balance-big').innerText = window.userData.balance || 0;
                        window.$('wallet-header-balance').innerText = window.userData.balance || 0;
                        if (window.updateSpinStatus) window.updateSpinStatus();
                    }
                }
            });
        } else {
            window.$('main-app').classList.add('hidden');
            window.$('screen-auth').classList.add('active');
            window.updateNavVisibility('screen-auth');
            window.showLoader(false);
            window.$('global-loader').style.pointerEvents = 'none';
        }
    });
});
