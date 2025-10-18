// Mutation Observer - Handles DOM changes and applies blocking rules to new content
window.SilentReddit = window.SilentReddit || {};

SilentReddit.mutationObserver = {
    settingsManager: null,
    observer: null,

    // Initialize observer with settings manager
    init(settingsManager) {
        this.settingsManager = settingsManager;
    },

    // Handle mutations callback
    _handleMutations(mutations) {
        const settings = this.settingsManager.get();
        if (!settings.enabled) return;

        mutations.forEach(mutation => {
            if (mutation.type !== 'childList') return;

            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE || !node.matches) return;

                // Quick check for ads to hide immediately
                if (settings.blockAds) {
                    SilentReddit.adsBlocker.hideNode(node);
                }

                // Apply all blocking rules to the new node
                SilentReddit.coordinator.applyToNode(node);
            });
        });

        // Check logo state (might have been changed by page navigation)
        if (settings.replaceLogo) {
            SilentReddit.logoReplacer.replaceAll();
        } else {
            SilentReddit.logoReplacer.restoreAll();
        }
    },

    // Start observing DOM changes
    start() {
        if (this.observer) {
            console.log('[SR] Observer already running');
            return;
        }

        this.observer = new MutationObserver(this._handleMutations.bind(this));
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[SR] Mutation observer started');
    },

    // Stop observing DOM changes
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            console.log('[SR] Mutation observer stopped');
        }
    }
};

console.log('[SR] Mutation observer module loaded');
