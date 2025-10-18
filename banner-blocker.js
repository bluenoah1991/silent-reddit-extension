// Banner Blocker - Handles hiding of community banner background images
window.SilentReddit = window.SilentReddit || {};

SilentReddit.bannerBlocker = {
    // Hide all community banners
    hideAll(targetNode = document) {
        targetNode.querySelectorAll(SilentReddit.SELECTORS.COMMUNITY_BANNER).forEach(banner => {
            // Skip if already processed
            if (banner.hasAttribute(SilentReddit.DATA_ATTRS.BANNER_PROCESSED)) {
                return;
            }

            // Save original background and hide
            banner.setAttribute(SilentReddit.DATA_ATTRS.BANNER_PROCESSED, 'true');
            banner.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_BANNER_BG, banner.style.cssText);
            banner.style.setProperty('background-image', 'none', 'important');
        });
    },

    // Show all community banners
    showAll() {
        document.querySelectorAll(SilentReddit.SELECTORS.BANNER_PROCESSED).forEach(banner => {
            // Restore original background
            const originalBg = banner.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_BANNER_BG);
            if (originalBg) {
                banner.style.cssText = originalBg;
            } else {
                banner.style.removeProperty('background-image');
            }

            // Remove data attributes
            banner.removeAttribute(SilentReddit.DATA_ATTRS.BANNER_PROCESSED);
            banner.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_BANNER_BG);
        });
    }
};

console.log('[SR] Banner blocker module loaded');
