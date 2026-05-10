import { db } from './firebase.js';
import { ref, get, update, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

window.watchTransactions = (uid) => {
    if (window.txListener) window.txListener();
    window.txListener = onValue(ref(db, `walletHistory/${uid}`), snap => { 
        window.appData.walletHistory = snap.val() || {}; 
        window.renderWallet(); 
    });
};

window.setWalletTab = (tab) => {
    document.querySelectorAll('[data-w-tab]').forEach(el => {
        el.classList.remove('active'); el.style.color = '#999'; el.style.borderBottom = '2px solid transparent';
    });
    const activeEl = document.querySelector(`[data-w-tab="${tab}"]`);
    activeEl.classList.add('active'); activeEl.style.color = '#000'; activeEl.style.borderBottom = '2px solid var(--color-purple)';
    
    window.$('wallet-tx-list').style.display = tab === 'tx' ? 'flex' : 'none';
    window.$('wallet-wd-section').style.display = tab === 'wd' ? 'flex' : 'none';
};

window.renderWallet = () => {
    const txs = Object.values(window.appData.walletHistory || {}).sort((a,b) => new Date(b.date) - new Date(a.date));
    window.$('wallet-tx-list').innerHTML = txs.length > 0 ? txs.map(tx => {
        const isUp = tx.type === 'up';
        return `<div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:#FFF; border:1px solid #E0E0E0; border-radius:12px; margin-bottom:12px; box-shadow:0 4px 6px rgba(0,0,0,0.03);">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:${isUp ? 'rgba(30,142,62,0.1)' : 'rgba(217,48,37,0.1)'}; color:${isUp ? 'var(--success)' : 'var(--danger)'}; font-size:18px;">
                            <i class="fa-solid ${isUp ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                        </div>
                        <div>
                            <div style="font-size:15px; font-weight:800; color:#000; text-transform:capitalize;">${tx.note}</div>
                            <div style="font-size:12px; color:#999; margin-top:4px; font-weight:700;">${new Date(tx.date).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                    <div style="font-weight:800; font-size:18px; color:${isUp?'var(--success)':'#000'};">${isUp?'+':'-'} <i class="fa-solid fa-coins text-gold" style="font-size:14px;"></i> ${tx.amount}</div>
                </div>`;
    }).join('') : `<div style="text-align:center; padding: 40px; color:#999; font-weight:700;">No transactions yet.</div>`;
};

window.openDepositScreen = () => {
    window.$('deposit-amt').value = '';
    window.$('deposit-state-1').classList.remove('hidden'); window.$('deposit-state-2').classList.add('hidden');
    window.navTo('screen-deposit');
};

window.processDepositAmount = async () => {
    const amt = parseInt(window.$('deposit-amt').value);
    if (!amt || amt < 10) return window.showToast('Minimum deposit is ₹10.', 'error');
    window.setLoadingBtn('btn-deposit-init', true, '');
    try {
        const lockRef = ref(db, 'gateway_lock'); const now = Date.now();
        const lock = (await get(lockRef)).val();
        if (lock && lock.lockedUntil > now && lock.uid !== window.currentUser.uid) { 
            window.setLoadingBtn('btn-deposit-init', false, 'PROCEED TO PAY'); 
            return window.showToast('Gateway busy. Try in a minute.', 'error'); 
        }

        const lockedUntil = now + 120000;
        await set(lockRef, { uid: window.currentUser.uid, amount: amt, status: 'waiting', lockedUntil, createdAt: now });

        window.$('deposit-pay-amt').innerText = `₹${amt}`;
        window.$('deposit-state-1').classList.add('hidden'); window.$('deposit-state-2').classList.remove('hidden');
        
        let depositTimerInterval = setInterval(async () => {
            const diff = lockedUntil - Date.now();
            if (diff <= 0) {
                clearInterval(depositTimerInterval); window.showToast('Session expired.', 'error'); history.back();
            } else window.$('deposit-timer').innerText = `Session: ${String(Math.floor(diff/60000)).padStart(2,'0')}:${String(Math.floor((diff%60000)/1000)).padStart(2,'0')}`;
        }, 1000);

        onValue(lockRef, (snap) => {
            const l = snap.val();
            if (l && l.uid === window.currentUser.uid && l.status === 'success') {
                clearInterval(depositTimerInterval);
                window.$('deposit-success-amount').innerHTML = `+<i class="fa-solid fa-coins"></i> ${l.amount} added successfully!`;
                window.$('deposit-success-anim').classList.add('active');
                set(lockRef, null).catch(()=>{});
                setTimeout(() => { window.$('deposit-success-anim').classList.remove('active'); history.back(); }, 2500); 
            }
        });
    } catch(e) { window.showToast('Gateway error', 'error'); }
    window.setLoadingBtn('btn-deposit-init', false, 'PROCEED TO PAY');
};

let isWithdrawing = false;
window.$('btn-submit-withdraw').onclick = async () => {
    if (isWithdrawing) return;
    const upi = window.$('withdraw-upi').value.trim(); const amt = parseInt(window.$('withdraw-amt').value);
    if (!upi || !amt) return window.showToast('Fill all fields.', 'error');
    if (amt < 25) return window.showToast('Minimum withdrawal is 25 Coins.', 'error'); 
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi)) return window.showToast('Invalid UPI ID.', 'error');

    isWithdrawing = true; window.setLoadingBtn('btn-submit-withdraw', true, '');
    try {
        const currentBal = (await get(ref(db, `users/${window.userData.uid}/balance`))).val() || 0;
        if (amt > currentBal) throw new Error('Insufficient Coins.');
        
        const updates = {};
        updates[`users/${window.userData.uid}/balance`] = currentBal - amt;
        const newTxKey = push(ref(db, `walletHistory/${window.userData.uid}`)).key;
        updates[`walletHistory/${window.userData.uid}/${newTxKey}`] = { amount: amt, type: 'down', note: `Withdrawal: ${upi}`, date: new Date().toISOString() };
        
        const newWdKey = push(ref(db, 'withdrawals')).key;
        updates[`withdrawals/${newWdKey}`] = { uid: window.userData.uid, upi, amount: amt, status: 'pending', date: new Date().toISOString(), username: window.userData.username };
        
        await update(ref(db), updates);
        
        window.showToast('Withdrawal Requested Successfully!'); 
        window.$('withdraw-upi').value = ''; window.$('withdraw-amt').value = '';
        window.setWalletTab('tx');
    } catch(e) { window.showToast(e.message || 'Network error', 'error'); } finally { 
        isWithdrawing = false; window.setLoadingBtn('btn-submit-withdraw', false, 'REQUEST WITHDRAWAL');
    }
};
