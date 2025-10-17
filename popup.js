const DEFAULT_SETTINGS = {
    enabled: true,
    blockAds: true,
    blockMedia: true
};

const toggles = {
    enabled: document.getElementById('enableToggle'),
    blockAds: document.getElementById('blockAdsToggle'),
    blockMedia: document.getElementById('blockMediaToggle')
};

const statusDiv = document.getElementById('status');

async function loadSettings() {
    try {
        return await chrome.storage.sync.get(DEFAULT_SETTINGS);
    } catch (error) {
        console.error('Failed to load settings:', error);
        return DEFAULT_SETTINGS;
    }
}

async function saveSettings(settings) {
    try {
        await chrome.storage.sync.set(settings);
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
}

function updateUI(settings) {
    Object.keys(toggles).forEach(key => {
        toggles[key].checked = settings[key];
    });
    
    statusDiv.className = settings.enabled ? 'status enabled' : 'status disabled';
    statusDiv.textContent = settings.enabled ? '✓ 功能已启用' : '✗ 功能已禁用';
    
    toggles.blockAds.disabled = !settings.enabled;
    toggles.blockMedia.disabled = !settings.enabled;
}

async function handleToggleChange() {
    const settings = Object.fromEntries(
        Object.entries(toggles).map(([key, toggle]) => [key, toggle.checked])
    );
    
    if (await saveSettings(settings)) {
        updateUI(settings);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url?.includes('reddit.com')) {
                chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings }).catch(() => {});
            }
        } catch {}
    }
}

async function init() {
    const settings = await loadSettings();
    updateUI(settings);
    Object.values(toggles).forEach(toggle => 
        toggle.addEventListener('change', handleToggleChange)
    );
}

init();
