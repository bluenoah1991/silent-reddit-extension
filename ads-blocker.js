// Ads Blocker - Handles blocking and unblocking of advertisements
window.SilentReddit = window.SilentReddit || {};

SilentReddit.adsBlocker = {
    // Hide all ads on the page
    hideAll(targetNode = document) {
        targetNode.querySelectorAll(SilentReddit.SELECTORS.ADS).forEach(ad => {
            ad.style.setProperty('display', 'none', 'important');
        });
    },

    // Show all hidden ads
    showAll() {
        document.querySelectorAll(SilentReddit.SELECTORS.ADS).forEach(ad => {
            ad.style.removeProperty('display');
        });
    },

    // Hide a single ad node (for dynamic content)
    hideNode(node) {
        if (node && node.matches && node.matches(SilentReddit.SELECTORS.ADS)) {
            node.style.setProperty('display', 'none', 'important');
        }
    }
};

console.log('[SR] Ads blocker module loaded');
