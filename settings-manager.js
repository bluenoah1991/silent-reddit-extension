// Settings Manager - Handles loading and monitoring of extension settings
window.SilentReddit = window.SilentReddit || {};

SilentReddit.SettingsManager = class {
    constructor() {
        this.settings = { ...SilentReddit.DEFAULT_SETTINGS };
        this.changeCallbacks = [];
    }

    // Load settings from Chrome storage
    async load() {
        try {
            this.settings = await chrome.storage.sync.get(SilentReddit.DEFAULT_SETTINGS);
            console.log('[SR] Settings loaded:', this.settings);
        } catch (error) {
            console.error('[SR] Failed to load settings:', error);
            this.settings = { ...SilentReddit.DEFAULT_SETTINGS };
        }
    }

    // Get current settings
    get() {
        return this.settings;
    }

    // Register a callback for settings changes
    onChange(callback) {
        this.changeCallbacks.push(callback);
    }

    // Start listening for storage changes
    startListening() {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync') return;

            let updated = false;
            const changedSettings = {};

            ['enabled', 'blockAds', 'blockMedia', 'replaceLogo'].forEach(key => {
                if (changes[key]) {
                    this.settings[key] = changes[key].newValue;
                    changedSettings[key] = changes[key].newValue;
                    updated = true;
                }
            });

            if (updated) {
                console.log('[SR] Settings updated:', this.settings);
                // Notify all registered callbacks
                this.changeCallbacks.forEach(callback => {
                    try {
                        callback(this.settings, changedSettings);
                    } catch (error) {
                        console.error('[SR] Error in settings change callback:', error);
                    }
                });
            }
        });
    }
};

console.log('[SR] SettingsManager module loaded');
