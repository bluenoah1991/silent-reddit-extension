const DEFAULT_SETTINGS = { enabled: true, blockAds: true, blockMedia: true, replaceLogo: true };
let currentSettings = { ...DEFAULT_SETTINGS };

async function loadSettings() {
    try {
        currentSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

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
        stopSidebarIconsCheck();
        return;
    }

    currentSettings.blockAds ? hideAds() : showAds();
    currentSettings.blockMedia ? hideMedia() : showMedia();
    currentSettings.replaceLogo ? replaceRedditLogo() : restoreRedditLogo();

    // Restart sidebar icons check based on blockMedia setting
    if (currentSettings.blockMedia) {
        startSidebarIconsCheck();
    } else {
        stopSidebarIconsCheck();
    }
}

const AD_SELECTORS = 'shreddit-ad-post, shreddit-comments-page-ad, games-section-badge-controller, shreddit-gallery-carousel';
const MEDIA_CONTAINER_SELECTOR = '[slot="post-media-container"]';
const THUMBNAIL_SELECTOR = '[slot="thumbnail"], [data-testid="post-thumbnail"]';
const COMMUNITY_STATUS_SELECTOR = 'community-status-tooltip, community-status';

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

    document.querySelectorAll(`${THUMBNAIL_SELECTOR}[data-silent-reddit-hidden]`).forEach(thumbnail => {
        thumbnail.style.removeProperty('display');
        delete thumbnail.dataset.silentRedditHidden;
    });

    // Restore community status icons
    document.querySelectorAll(`${COMMUNITY_STATUS_SELECTOR}[data-silent-reddit-hidden]`).forEach(status => {
        status.style.removeProperty('display');
        delete status.dataset.silentRedditHidden;
    });

    // Restore subreddit icons (in posts)
    document.querySelectorAll('.shreddit-subreddit-icon__icon[data-silent-reddit-replaced]').forEach(icon => {
        if (icon.dataset.originalSrc) {
            icon.src = icon.dataset.originalSrc;
            delete icon.dataset.originalSrc;
        }
        icon.style.cssText = icon.dataset.originalStyle || '';
        delete icon.dataset.originalStyle;
        delete icon.dataset.silentRedditReplaced;
    });

    // Restore left-nav-community-item icons
    restoreNavCommunitiesIcons();

    // Restore recent pages icons
    restoreRecentPagesIcons();

    // Restore user avatars
    document.querySelectorAll('[slot="commentAvatar"] img[data-silent-reddit-replaced], a[href*="/user/"] img[data-silent-reddit-replaced]').forEach(avatar => {
        if (avatar.dataset.originalSrc) {
            avatar.src = avatar.dataset.originalSrc;
            delete avatar.dataset.originalSrc;
        }
        avatar.style.cssText = avatar.dataset.originalStyle || '';
        delete avatar.dataset.originalStyle;
        delete avatar.dataset.silentRedditReplaced;
    });

    // Restore snoovatar avatars
    document.querySelectorAll('.snoovatar[data-silent-reddit-replaced]').forEach(snoovatar => {
        snoovatar.style.cssText = snoovatar.dataset.originalStyle || '';
        delete snoovatar.dataset.originalStyle;
        delete snoovatar.dataset.silentRedditReplaced;
    });

    document.querySelectorAll('.silent-reddit-letter-avatar').forEach(avatar => avatar.remove());

    document.querySelectorAll('.community-banner[data-silent-reddit-banner-processed]').forEach(banner => {
        if (banner.dataset.originalBannerBg) {
            banner.style.cssText = banner.dataset.originalBannerBg;
            delete banner.dataset.originalBannerBg;
        } else {
            banner.style.removeProperty('background-image');
        }
        delete banner.dataset.silentRedditBannerProcessed;
    });
}

function createPlaceholder(isVideo) {
    const placeholder = document.createElement('span');
    placeholder.className = 'silent-reddit-text-placeholder';
    placeholder.innerHTML = isVideo ? '🎬' : '🖼️';
    placeholder.title = `${isVideo ? 'Video' : 'Image'} hidden`;
    return placeholder;
}

function hideMedia() {
    console.log('[Silent Reddit] hideMedia called');

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

    document.querySelectorAll(THUMBNAIL_SELECTOR).forEach(thumbnail => {
        if (!thumbnail.dataset.silentRedditHidden) {
            thumbnail.dataset.silentRedditHidden = 'true';
            thumbnail.style.setProperty('display', 'none', 'important');
        }
    });

    // Hide community status icons
    document.querySelectorAll(COMMUNITY_STATUS_SELECTOR).forEach(status => {
        if (!status.dataset.silentRedditHidden) {
            status.dataset.silentRedditHidden = 'true';
            status.style.setProperty('display', 'none', 'important');
        }
    });

    // Replace subreddit and user icons with letter avatars
    replaceSubredditIcons();
    replaceUserAvatars();

    hideCommunityBanners();
}

function hideCommunityBanners(targetNode = document) {
    targetNode.querySelectorAll('.community-banner').forEach(banner => {
        if (!banner.dataset.silentRedditBannerProcessed) {
            banner.dataset.silentRedditBannerProcessed = 'true';
            banner.dataset.originalBannerBg = banner.style.cssText;
            banner.style.setProperty('background-image', 'none', 'important');
        }
    });
}

function getSubredditNameFromIcon(icon) {
    // Try to find subreddit name from nearby link
    const link = icon.closest('a[href^="/r/"]');
    if (link) {
        const match = link.href.match(/\/r\/([^/?]+)/);
        if (match) return match[1];
    }

    // Try to find from alt text
    const alt = icon.alt || '';
    const altMatch = alt.match(/r\/([^\s]+)/);
    if (altMatch) return altMatch[1];

    return null;
}

// Color palette and hash function for avatar generation
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'
];

function getColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function createLetterAvatar(name) {
    if (!name) return null;

    const letter = name.charAt(0).toUpperCase();
    const color = getColorFromName(name);

    const avatar = document.createElement('div');
    avatar.className = 'silent-reddit-letter-avatar';
    avatar.textContent = letter;
    avatar.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${color};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: inherit;
        margin: 0 !important;
        padding: 0 !important;
    `;

    return avatar;
}

// Create SVG data URL for img src attribute
function createLetterAvatarDataURL(name) {
    if (!name) return null;

    const letter = name.charAt(0).toUpperCase();
    const color = getColorFromName(name);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="32" font-weight="bold" font-family="Arial, sans-serif">${letter}</text>
    </svg>`;

    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Helper function to extract community name from various sources
function extractCommunityName(element, prefixedName = null) {
    // Try prefixedName first
    if (prefixedName) {
        return prefixedName.replace('r/', '');
    }

    // Try to find from parent link
    const link = element.closest('a[href*="/r/"]');
    if (link) {
        const match = link.href.match(/\/r\/([^\/\?]+)/);
        if (match) return match[1];
    }

    return null;
}

// Replace icons in post subreddit headers
function replacePostSubredditIcons(targetNode) {
    targetNode.querySelectorAll('.shreddit-subreddit-icon__icon:not([data-silent-reddit-replaced])').forEach(icon => {
        const subredditName = getSubredditNameFromIcon(icon);
        if (!subredditName) return;

        const letterAvatar = createLetterAvatar(subredditName);
        if (!letterAvatar) return;

        icon.dataset.silentRedditReplaced = 'true';
        icon.dataset.originalSrc = icon.src;
        icon.dataset.originalStyle = icon.style.cssText;
        icon.style.setProperty('display', 'none', 'important');
        icon.parentNode?.insertBefore(letterAvatar, icon);
    });
}

// Replace icons in left-nav-communities-controller
function replaceNavCommunitiesIcons() {
    const controller = document.querySelector('left-nav-communities-controller');
    if (!controller?.shadowRoot) return;

    const items = controller.shadowRoot.querySelectorAll('left-nav-community-item');
    items.forEach(item => {
        if (!item.shadowRoot) return;

        const prefixedName = item.getAttribute('prefixedname');
        const imgs = item.shadowRoot.querySelectorAll('img:not([data-silent-reddit-replaced])');

        imgs.forEach(img => {
            const communityName = extractCommunityName(img, prefixedName);
            if (communityName && !img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                img.src = createLetterAvatarDataURL(communityName);
                img.srcset = '';
                img.dataset.silentRedditReplaced = 'true';
            }
        });

        if (imgs.length > 0 && prefixedName) {
            item.setAttribute('data-silent-reddit-replaced', 'true');
        }
    });
}

// Restore icons in left-nav-communities-controller
function restoreNavCommunitiesIcons() {
    const controller = document.querySelector('left-nav-communities-controller');
    if (!controller?.shadowRoot) return;

    const items = controller.shadowRoot.querySelectorAll('left-nav-community-item[data-silent-reddit-replaced]');
    items.forEach(item => {
        if (!item.shadowRoot) return;

        const imgs = item.shadowRoot.querySelectorAll('img[data-silent-reddit-replaced]');
        imgs.forEach(img => {
            if (img.dataset.originalSrc) {
                img.src = img.dataset.originalSrc;
                delete img.dataset.originalSrc;
            }
            img.srcset = '';
            delete img.dataset.silentRedditReplaced;
        });

        item.removeAttribute('data-silent-reddit-replaced');
    });
}

// Replace icons in reddit-recent-pages
function replaceRecentPagesIcons() {
    const recentPages = document.querySelector('reddit-recent-pages');
    if (!recentPages?.shadowRoot) return;

    const imgs = recentPages.shadowRoot.querySelectorAll('img:not([data-silent-reddit-replaced])');
    imgs.forEach(img => {
        const isCommunityIcon = img.src && (
            img.src.includes('communityIcon') ||
            img.src.includes('redditmedia')
        );

        if (isCommunityIcon) {
            const communityName = extractCommunityName(img);
            if (communityName && !img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                img.src = createLetterAvatarDataURL(communityName);
                img.srcset = '';
                img.dataset.silentRedditReplaced = 'true';
            }
        }
    });
}

// Restore icons in reddit-recent-pages
function restoreRecentPagesIcons() {
    const recentPages = document.querySelector('reddit-recent-pages');
    if (!recentPages?.shadowRoot) return;

    const imgs = recentPages.shadowRoot.querySelectorAll('img[data-silent-reddit-replaced]');
    imgs.forEach(img => {
        if (img.dataset.originalSrc) {
            img.src = img.dataset.originalSrc;
            delete img.dataset.originalSrc;
        }
        img.srcset = '';
        delete img.dataset.silentRedditReplaced;
    });
}

// Main function to replace all subreddit icons
function replaceSubredditIcons(targetNode = document) {
    replacePostSubredditIcons(targetNode);
    replaceNavCommunitiesIcons();
    replaceRecentPagesIcons();
}

function getUsernameFromAvatar(avatar) {
    // Try to find username from nearby link
    const link = avatar.closest('a[href*="/user/"]');
    if (link) {
        const match = link.href.match(/\/user\/([^/?]+)/);
        if (match) return match[1];
    }

    // Try to find from alt text in img or image element
    const img = avatar.querySelector ? avatar.querySelector('img, image') : (avatar.tagName === 'IMG' || avatar.tagName === 'image' ? avatar : null);
    if (img) {
        const alt = img.alt || img.getAttribute('alt') || '';
        const altMatch = alt.match(/u\/([^\s]+)/);
        if (altMatch) return altMatch[1];
    }

    return null;
}

function replaceUserAvatars(targetNode = document) {
    // Replace both regular img avatars and SVG snoovatar avatars

    // Handle regular img avatars
    const imgSelectors = [
        '[slot="commentAvatar"] img',
        'a[href*="/user/"] img'
    ];

    imgSelectors.forEach(selector => {
        targetNode.querySelectorAll(selector).forEach(avatar => {
            // Skip if already replaced or is a subreddit icon
            if (avatar.dataset.silentRedditReplaced ||
                avatar.classList.contains('shreddit-subreddit-icon__icon')) {
                return;
            }

            const username = getUsernameFromAvatar(avatar);
            if (!username) return;

            const letterAvatar = createLetterAvatar(username);
            if (!letterAvatar) return;

            // Save original state
            avatar.dataset.silentRedditReplaced = 'true';
            avatar.dataset.originalSrc = avatar.src;
            avatar.dataset.originalStyle = avatar.style.cssText;

            // Hide the avatar
            avatar.style.setProperty('display', 'none', 'important');

            // Insert letter avatar
            avatar.parentNode?.insertBefore(letterAvatar, avatar);
        });
    });

    // Handle SVG snoovatar avatars
    targetNode.querySelectorAll('[slot="commentAvatar"] .snoovatar, a[href*="/user/"] .snoovatar').forEach(snoovatar => {
        if (snoovatar.dataset.silentRedditReplaced) return;

        const username = getUsernameFromAvatar(snoovatar);
        if (!username) return;

        const letterAvatar = createLetterAvatar(username);
        if (!letterAvatar) return;

        // Save original state
        snoovatar.dataset.silentRedditReplaced = 'true';
        snoovatar.dataset.originalStyle = snoovatar.style.cssText;

        // Hide the snoovatar
        snoovatar.style.setProperty('display', 'none', 'important');

        // Insert letter avatar before the snoovatar
        snoovatar.parentNode?.insertBefore(letterAvatar, snoovatar);
    });

    // Handle any avatar containers that might have been missed
    targetNode.querySelectorAll('[slot="commentAvatar"] [rpl][avatar]').forEach(container => {
        // Skip if already processed
        if (container.querySelector('.silent-reddit-letter-avatar')) return;

        const username = getUsernameFromAvatar(container);
        if (!username) return;

        const letterAvatar = createLetterAvatar(username);
        if (!letterAvatar) return;

        // Find the actual avatar element to hide
        const avatarElement = container.querySelector('.snoovatar, img');
        if (avatarElement && !avatarElement.dataset.silentRedditReplaced) {
            avatarElement.dataset.silentRedditReplaced = 'true';
            avatarElement.dataset.originalStyle = avatarElement.style.cssText;
            avatarElement.style.setProperty('display', 'none', 'important');
        }

        // Insert letter avatar
        container.appendChild(letterAvatar);
    });
}

function removeAllBlocking() {
    showAds();
    showMedia();
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
    console.log('[Silent Reddit] applyBlockingRules called, targetNode:', targetNode?.nodeName || 'null');

    if (!targetNode || !currentSettings.enabled || !targetNode.querySelectorAll) return;

    if (currentSettings.blockAds) {
        targetNode.querySelectorAll(AD_SELECTORS).forEach(ad =>
            ad.style.setProperty('display', 'none', 'important')
        );
    }

    if (currentSettings.blockMedia) {
        console.log('[Silent Reddit] blockMedia is enabled, processing...');
        targetNode.querySelectorAll(MEDIA_CONTAINER_SELECTOR).forEach(container => {
            if (container.dataset.silentRedditPlaceholder) return;

            const hasVideo = container.querySelector('shreddit-embed, shreddit-async-loader[bundlename="embed"]');
            const hasImage = container.querySelector('img');

            if (hasImage || hasVideo) {
                container.dataset.silentRedditPlaceholder = 'true';
                container.style.setProperty('display', 'none', 'important');
                container.parentNode?.insertBefore(createPlaceholder(!!hasVideo), container.nextSibling);
            }
        });
        targetNode.querySelectorAll(THUMBNAIL_SELECTOR).forEach(thumbnail => {
            if (!thumbnail.dataset.silentRedditHidden) {
                thumbnail.dataset.silentRedditHidden = 'true';
                thumbnail.style.setProperty('display', 'none', 'important');
            }
        });
        // Hide community status icons
        targetNode.querySelectorAll(COMMUNITY_STATUS_SELECTOR).forEach(status => {
            if (!status.dataset.silentRedditHidden) {
                status.dataset.silentRedditHidden = 'true';
                status.style.setProperty('display', 'none', 'important');
            }
        });
        // Replace subreddit and user icons
        replaceSubredditIcons(targetNode);
        replaceUserAvatars(targetNode);
        hideCommunityBanners(targetNode);
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

let sidebarIconsInterval = null;
let sidebarIconsTimeout = null;

function startSidebarIconsCheck() {
    // Clear any existing timers first
    stopSidebarIconsCheck();

    if (currentSettings.enabled && currentSettings.blockMedia) {
        const checkSidebarIcons = () => {
            replaceNavCommunitiesIcons();
            replaceRecentPagesIcons();
        };

        // First check after 2 seconds, then every 3 seconds
        sidebarIconsTimeout = setTimeout(checkSidebarIcons, 2000);
        sidebarIconsInterval = setInterval(checkSidebarIcons, 3000);
    }
}

function stopSidebarIconsCheck() {
    if (sidebarIconsTimeout) {
        clearTimeout(sidebarIconsTimeout);
        sidebarIconsTimeout = null;
    }
    if (sidebarIconsInterval) {
        clearInterval(sidebarIconsInterval);
        sidebarIconsInterval = null;
    }
}

function initObserver() {
    new MutationObserver(handleMutations).observe(document.body, {
        childList: true,
        subtree: true
    });

    // Periodically check for nav community items (Shadow DOM elements load dynamically)
    startSidebarIconsCheck();
}

async function init() {
    console.log('[Silent Reddit] Extension initializing...');
    await loadSettings();
    console.log('[Silent Reddit] Settings loaded:', currentSettings);
    if (currentSettings.enabled) applyBlockingRules();
    currentSettings.replaceLogo ? replaceRedditLogo() : restoreRedditLogo();
    document.body ? initObserver() : document.addEventListener('DOMContentLoaded', initObserver);
    console.log('[Silent Reddit] Initialization complete');
}

document.readyState === 'loading' ?
    document.addEventListener('DOMContentLoaded', init) : init();
