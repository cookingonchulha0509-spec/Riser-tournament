import { db } from './firebase.js';
import { ref, get, update, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

window.drawWheel = () => {
    const canvas = window.$('spin-wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors =['#6200EE', '#88D4C0', '#FF8C00', '#E91E63', '#00BCD4', '#4CAF50'];
    const prizes =[2, 3, 5, 7, 10, 15];
    const numSegments = prizes.length;
    const arc = (2 * Math.PI) / numSegments;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 260 * dpr;
    canvas.height = 260 * dpr;
    canvas.style.width = '260px';
    canvas.style.height = '260px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 260, 260);
    
    for (let i=0; i<numSegments; i++) {
        ctx.beginPath();
        ctx.fillStyle = colors[i];
        ctx.moveTo(130, 130);
        ctx.arc(130, 130, 130, i * arc, (i + 1) * arc);
        ctx.lineTo(130, 130);
        ctx.fill();
        
        ctx.save();
        ctx.translate(130, 130);
        ctx.rotate(i * arc + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFF";
        ctx.font = "800 20px Inter";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(prizes[i] + " 🪙", 110, 8);
        ctx.restore();
    }
};

window.openSpinModal = () => {
    if (!window.userData) return;
    const now = Date.now();
    const lastSpin = window.userData.lastSpin || 0;
    const diff = now - lastSpin;
    const cooldown = 24 * 60 * 60 * 1000;
    
    if (diff < cooldown) {
        window.showToast(`Wait for countdown to finish!`, 'error');
        return;
    }
    
    window.drawWheel();
    window.$('spin-wheel-canvas').style.transition = 'none';
    window.$('spin-wheel-canvas').style.transform = 'rotate(0deg)';
    window.$('btn-spin-action').disabled = false;
    window.$('btn-spin-action').innerText = "SPIN THE WHEEL";
    window.$('modal-spin').classList.add('active');
};

window.isSpinning = false;
window.executeSpin = () => {
    if (window.isSpinning) return;
    window.isSpinning = true;
    window.setLoadingBtn('btn-spin-action', true, '');
    
    const prizes = [2, 3, 5, 7, 10, 15];
    const rand = Math.random();
    let winIndex = 0;
    
    if (rand < 0.05) winIndex = 5; 
    else if (rand < 0.15) winIndex = 4; 
    else if (rand < 0.35) winIndex = 3; 
    else winIndex = Math.floor(Math.random() * 3); 
    
    const prize = prizes[winIndex];
    const canvas = window.$('spin-wheel-canvas');
    const arcDeg = 360 / prizes.length;
    const targetAngle = (360 * 5) - (winIndex * arcDeg) - (arcDeg / 2) - 90;
    
    canvas.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    canvas.style.transform = `rotate(${targetAngle}deg)`;
    
    setTimeout(async () => {
        window.isSpinning = false;
        window.$('modal-spin').classList.remove('active');
        
        try {
            const currentBal = (await get(ref(db, `users/${window.userData.uid}/balance`))).val() || 0;
            const updates = {};
            updates[`users/${window.userData.uid}/balance`] = currentBal + prize;
            updates[`users/${window.userData.uid}/lastSpin`] = serverTimestamp();
            
            const newTxKey = push(ref(db, `walletHistory/${window.userData.uid}`)).key;
            updates[`walletHistory/${window.userData.uid}/${newTxKey}`] = { 
                amount: prize, type: 'up', note: `Daily Spin Reward`, date: new Date().toISOString() 
            };
            
            await update(ref(db), updates);
            
            window.$('reward-amount').innerText = `+${prize} Coins!`;
            window.$('reward-message').innerText = "Added directly to your wallet.";
            window.$('reward-popup').classList.add('active');
            setTimeout(() => window.$('reward-popup').classList.remove('active'), 5000);
            
            window.updateSpinStatus();
        } catch(e) { window.showToast('Network Error.', 'error'); }
    }, 4500);
};

window.updateSpinStatus = () => {
    if (!window.userData) return;
    const statusEl = window.$('spin-status');
    if (!statusEl) return;

    const updateClock = () => {
        const now = Date.now();
        const lastSpin = window.userData.lastSpin || 0;
        const diff = now - lastSpin;
        const cooldown = 24 * 60 * 60 * 1000;
        
        if (diff < cooldown) {
            const remaining = cooldown - diff;
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            statusEl.innerText = `NEXT SPIN IN: ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
            statusEl.style.color = '#A0AABF';
        } else {
            statusEl.innerText = `READY TO SPIN!`;
            statusEl.style.color = 'var(--color-mint)';
        }
    };
    
    updateClock();
    setInterval(updateClock, 1000);
};
