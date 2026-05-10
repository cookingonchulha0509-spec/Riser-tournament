window.updateNavVisibility = (targetId) => {
    const hiddenNavScreens =['screen-auth', 'screen-tournament-detail', 'screen-join', 'screen-deposit', 'screen-category-detail', 'modal-privacy'];
    if (hiddenNavScreens.includes(targetId)) window.$('main-nav').classList.add('hidden-nav');
    else window.$('main-nav').classList.remove('hidden-nav');
};

window.navTo = (targetId, isBack = false) => {
    if (window.currentScreen === targetId) return;
    
    if (!isBack) {
        window.historyStack.push(targetId);
        history.pushState({ screen: targetId }, '', `#${targetId}`);
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (activeNav) activeNav.classList.add('active');
    
    if (window.$(window.currentScreen)) window.$(window.currentScreen).classList.remove('active');
    if (window.$(targetId)) { window.$(targetId).classList.add('active'); window.$(targetId).scrollTo(0,0); }
    window.currentScreen = targetId;
    window.updateNavVisibility(targetId);
    
    if (targetId === 'screen-leaderboard' && window.renderLeaderboard) window.renderLeaderboard();
};

window.addEventListener('popstate', (e) => {
    if (window.currentScreen === 'screen-auth') return;

    if (window.historyStack.length > 1) {
        window.historyStack.pop();
        const prevScreen = window.historyStack[window.historyStack.length - 1];
        window.navTo(prevScreen, true);
    } else {
        if (window.backPressCount === 0) {
            window.showToast('Press back again to exit', 'info');
            window.backPressCount++;
            history.pushState({ screen: 'screen-home' }, '', '#screen-home'); 
            setTimeout(() => window.backPressCount = 0, 2000);
        } else {
            window.history.back();
        }
    }
});

window.navToPlayTab = (status) => { window.navTo('screen-play'); window.setPlayTab(status); };
window.openPrivacyModal = () => { window.$('modal-privacy').classList.add('active'); window.$('main-nav').classList.add('hidden-nav'); };
