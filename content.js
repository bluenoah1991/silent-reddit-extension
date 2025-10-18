// Silent Reddit - Main entry point for content script
// This file coordinates all modules to provide distraction-free Reddit browsing

(async function () {
    console.log('[SR] Extension initializing...');

    // Create settings manager
    const settingsManager = new SilentReddit.SettingsManager();

    // Load settings from Chrome storage
    await settingsManager.load();
    console.log('[SR] Settings loaded:', settingsManager.get());

    // Initialize coordinator with settings manager
    SilentReddit.coordinator.init(settingsManager);

    // Initialize mutation observer with settings manager
    SilentReddit.mutationObserver.init(settingsManager);

    // Function to apply initial blocking rules
    const applyInitialBlocking = () => {
        console.log('[SR] Applying initial blocking rules');
        SilentReddit.coordinator.applyOrRemove();
        SilentReddit.mutationObserver.start();
    };

    // Wait for DOM to be ready before applying blocking rules
    if (document.readyState === 'loading') {
        // DOM is still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', applyInitialBlocking);
    } else {
        // DOM is already loaded, apply immediately
        applyInitialBlocking();
    }

    // Listen for settings changes
    settingsManager.onChange((newSettings, changedSettings) => {
        console.log('[SR] Settings changed, applying updates');
        SilentReddit.coordinator.applyOrRemove();
    });

    // Start listening for storage changes
    settingsManager.startListening();

    console.log('[SR] Initialization complete');
})();
