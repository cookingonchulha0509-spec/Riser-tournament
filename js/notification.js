// Initialize Global State bindings safely required by module scoping
window.$ = id => document.getElementById(id);
window.appData = { categories: {}, tournaments: null, banners: {}, walletHistory: {}, leaderboard:[] };
window.currentUser = null;
window.userData = null;
window.activeTournamentId = null;
window.activeCategoryName = null;
window.currentScreen = 'screen-auth';
window.authDetermined = false;
window.historyStack = ['screen-home'];
window.backPressCount = 0;
window.txListener = null;

window.translateError = (err) => {
    const code = err.code || err.message;
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return "Incorrect email or password.";
    if (code.includes('user-not-found')) return "No account found with this email.";
    if (code.includes('email-already-in-use')) return "This email is already registered.";
    if (code.includes('network-request-failed')) return "Connection error. Check your internet.";
    if (code.includes('too-many-requests')) return "Too many attempts. Please wait a moment.";
    return "Authentication failed. Please try again.";
};

window.vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

window.showLoader = show => window.$('global-loader').style.opacity = show ? '1' : '0';

window.setLoadingBtn = (btnId, isLoading, defaultText) => {
    const btn = window.$(btnId);
    if(isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<div class="minimal-spinner" style="width:20px;height:20px;border-width:2px;border-top-color:#FFF;border-color:rgba(255,255,255,0.3);"></div>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = defaultText;
    }
};

window.showToast = (msg, type = 'success') => {
    const container = window.$('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = type === 'error' ? `<i class="fa-solid fa-circle-exclamation" style="color:var(--danger); font-size:18px;"></i> <span style="flex:1;">${msg}</span>` : type === 'info' ? `<i class="fa-solid fa-circle-info" style="color:var(--color-orange); font-size:18px;"></i> <span style="flex:1;">${msg}</span>` : `<i class="fa-solid fa-circle-check" style="color:var(--color-mint); font-size:18px;"></i> <span style="flex:1;">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
};

window.getAvatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000&color=F00&bold=true`;
