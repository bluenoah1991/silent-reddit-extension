// Coordinator - Manages coordination of all blocking modules based on settings
window.SilentReddit = window.SilentReddit || {};

SilentReddit.coordinator = {
    settingsManager: null,

    // Initialize coordinator with settings manager
    init(settingsManager) {
        this.settingsManager = settingsManager;
    },

    // Apply or remove all blocking rules based on current settings
    applyOrRemove() {
        const settings = this.settingsManager.get();

        if (!settings.enabled) {
            this.removeAll();
            SilentReddit.logoReplacer.restoreAll();
            SilentReddit.iconsReplacer.stopPeriodicCheck();
            return;
        }

        // Apply blocking based on individual settings
        if (settings.blockAds) {
            SilentReddit.adsBlocker.hideAll();
        } else {
            SilentReddit.adsBlocker.showAll();
        }

        if (settings.blockMedia) {
            SilentReddit.mediaBlocker.hideAll();
            SilentReddit.iconsReplacer.hideAll();
            SilentReddit.bannerBlocker.hideAll();
            SilentReddit.iconsReplacer.startPeriodicCheck();
        } else {
            SilentReddit.mediaBlocker.showAll();
            SilentReddit.iconsReplacer.showAll();
            SilentReddit.bannerBlocker.showAll();
            SilentReddit.iconsReplacer.stopPeriodicCheck();
        }

        // Logo replacement is independent of enabled state
        if (settings.replaceLogo) {
            SilentReddit.logoReplacer.replaceAll();
        } else {
            SilentReddit.logoReplacer.restoreAll();
        }
    },

    // Remove all blocking (show everything)
    removeAll() {
        SilentReddit.adsBlocker.showAll();
        SilentReddit.mediaBlocker.showAll();
        SilentReddit.iconsReplacer.showAll();
        SilentReddit.bannerBlocker.showAll();
    },

    // Apply blocking rules to a specific target node (for new content)
    applyToNode(targetNode) {
        const settings = this.settingsManager.get();

        if (!settings.enabled || !targetNode || !targetNode.querySelectorAll) {
            return;
        }

        // Apply blocking to new node
        if (settings.blockAds) {
            SilentReddit.adsBlocker.hideAll(targetNode);
        }

        if (settings.blockMedia) {
            SilentReddit.mediaBlocker.hideAll(targetNode);
            SilentReddit.iconsReplacer.hideAll(targetNode);
            SilentReddit.bannerBlocker.hideAll(targetNode);
        }
    }
};

console.log('[SR] Coordinator module loaded');
