const DEFAULT_SETTINGS = { enabled: true, blockAds: true, blockMedia: true, replaceLogo: true };
let currentSettings = { ...DEFAULT_SETTINGS };

async function loadSettings() {
    try {
        currentSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
        currentSettings = message.settings;
        applyOrRemoveBlocking();
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;

    let updated = false;
    ['enabled', 'blockAds', 'blockMedia', 'replaceLogo'].forEach(key => {
        if (changes[key]) {
            currentSettings[key] = changes[key].newValue;
            updated = true;
        }
    });

    if (updated) {
        console.log('Settings updated:', currentSettings);
        applyOrRemoveBlocking();
    }
});

function applyOrRemoveBlocking() {
    if (!currentSettings.enabled) {
        removeAllBlocking();
        restoreRedditLogo();
        return;
    }

    currentSettings.blockAds ? hideAds() : showAds();
    currentSettings.blockMedia ? hideMedia() : showMedia();
    currentSettings.replaceLogo ? replaceRedditLogo() : restoreRedditLogo();
}

const AD_SELECTORS = 'shreddit-ad-post, shreddit-comments-page-ad, games-section-badge-controller, shreddit-gallery-carousel';
const MEDIA_CONTAINER_SELECTOR = '[slot="post-media-container"]';

function showAds() {
    document.querySelectorAll(AD_SELECTORS).forEach(ad => ad.style.removeProperty('display'));
}

function hideAds() {
    document.querySelectorAll(AD_SELECTORS).forEach(ad =>
        ad.style.setProperty('display', 'none', 'important')
    );
}

function showMedia() {
    document.querySelectorAll(`${MEDIA_CONTAINER_SELECTOR}[data-silent-reddit-placeholder]`).forEach(container => {
        container.style.display = '';
        delete container.dataset.silentRedditPlaceholder;
    });
    document.querySelectorAll('.silent-reddit-text-placeholder').forEach(el => el.remove());
    document.querySelectorAll('[data-silent-reddit-processed]').forEach(el =>
        delete el.dataset.silentRedditProcessed
    );
}

function createPlaceholder(isVideo) {
    const placeholder = document.createElement('span');
    placeholder.className = 'silent-reddit-text-placeholder';
    placeholder.innerHTML = isVideo ? '🎬' : '🖼️';
    placeholder.title = `${isVideo ? 'Video' : 'Image'} hidden`;
    return placeholder;
}

function hideMedia() {
    document.querySelectorAll(MEDIA_CONTAINER_SELECTOR).forEach(container => {
        if (container.dataset.silentRedditPlaceholder) return;

        const hasVideo = container.querySelector('shreddit-embed, shreddit-async-loader[bundlename="embed"]');
        const hasImage = container.querySelector('img');

        if (hasImage || hasVideo) {
            container.dataset.silentRedditPlaceholder = 'true';
            container.style.setProperty('display', 'none', 'important');
            container.parentNode?.insertBefore(createPlaceholder(!!hasVideo), container.nextSibling);
        }
    });
}

function removeAllBlocking() {
    showAds();
    showMedia();
}

function shouldPreserveMedia(container) {
    if (container.dataset.silentRedditPlaceholder) return true;

    const img = container.querySelector('img');
    if (img) {
        if (img.classList.contains('shreddit-subreddit-icon__icon')) return true;
        if (img.closest('a[href*="/user/"]')) return true;
        if (img.closest('community-status-tooltip, community-status, faceplate-hovercard')) return true;
        if (img.closest('comment-forest-empty-state, #low-comments-banner')) return true;
        if (img.classList.contains('snoo-empty-comments', 'snoo-low-comment-count')) return true;
        if (container.closest('[slot="thumbnail"], [data-testid="post-thumbnail"]')) return true;

        const style = window.getComputedStyle(img);
        const width = parseInt(style.width) || img.width || 0;
        const height = parseInt(style.height) || img.height || 0;
        if (width < 32 && height < 32) return true;
    }

    return false;
}

function processMediaContainer(container) {
    if (shouldPreserveMedia(container)) return;

    const hasVideo = container.querySelector('shreddit-embed, shreddit-async-loader[bundlename="embed"]');
    const hasImage = container.querySelector('img');

    if (hasImage || hasVideo) {
        container.dataset.silentRedditPlaceholder = 'true';
        container.style.setProperty('display', 'none', 'important');
        container.parentNode?.insertBefore(createPlaceholder(!!hasVideo), container.nextSibling);
    }
}

function replaceRedditLogo() {
    const logoLink = document.querySelector('a#reddit-logo[href="/"]');
    if (!logoLink || logoLink.dataset.silentRedditReplaced) return;

    logoLink.dataset.silentRedditReplaced = 'true';
    logoLink.dataset.originalContent = logoLink.innerHTML;
    logoLink.innerHTML = '';
    logoLink.style.cssText = 'display: flex !important; align-items: center !important; text-decoration: none !important; height: 100% !important;';

    const soLogo = document.createElement('img');
    soLogo.src = chrome.runtime.getURL('stack-overflow-wordmark.svg');
    soLogo.alt = 'Stack Overflow';
    soLogo.style.cssText = 'height: 32px; width: auto; object-fit: contain; display: block; margin: 0 !important; padding: 0 !important;';

    logoLink.appendChild(soLogo);
}

function restoreRedditLogo() {
    const logoLink = document.querySelector('a#reddit-logo[href="/"]');
    if (!logoLink || !logoLink.dataset.silentRedditReplaced) return;

    logoLink.innerHTML = logoLink.dataset.originalContent || '';
    logoLink.style.cssText = '';
    delete logoLink.dataset.silentRedditReplaced;
    delete logoLink.dataset.originalContent;
}

function applyBlockingRules(targetNode = document.body) {
    if (!targetNode || !currentSettings.enabled || !targetNode.querySelectorAll) return;

    if (currentSettings.blockAds) {
        targetNode.querySelectorAll(AD_SELECTORS).forEach(ad =>
            ad.style.setProperty('display', 'none', 'important')
        );
    }

    if (currentSettings.blockMedia) {
        targetNode.querySelectorAll(MEDIA_CONTAINER_SELECTOR).forEach(processMediaContainer);
    }
}

function handleMutations(mutations) {
    if (!currentSettings.enabled) return;

    mutations.forEach(mutation => {
        if (mutation.type !== 'childList') return;

        mutation.addedNodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE || !node.matches) return;

            if (currentSettings.blockAds && node.matches(AD_SELECTORS)) {
                node.style.setProperty('display', 'none', 'important');
            }

            applyBlockingRules(node);
        });
    });

    currentSettings.replaceLogo ? replaceRedditLogo() : restoreRedditLogo();
}

function initObserver() {
    new MutationObserver(handleMutations).observe(document.body, {
        childList: true,
        subtree: true
    });
}

async function init() {
    await loadSettings();
    if (currentSettings.enabled) applyBlockingRules();
    currentSettings.replaceLogo ? replaceRedditLogo() : restoreRedditLogo();
    document.body ? initObserver() : document.addEventListener('DOMContentLoaded', initObserver);
}

document.readyState === 'loading' ?
    document.addEventListener('DOMContentLoaded', init) : init();
