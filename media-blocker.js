// Media Blocker - Handles hiding of images, videos, thumbnails, and community status icons
window.SilentReddit = window.SilentReddit || {};

SilentReddit.mediaBlocker = {
    // Create a text placeholder for hidden media
    _createPlaceholder(isVideo) {
        const placeholder = document.createElement('span');
        placeholder.className = SilentReddit.CSS_CLASSES.TEXT_PLACEHOLDER;
        placeholder.innerHTML = isVideo ? '🎬' : '🖼️';
        placeholder.title = `${isVideo ? 'Video' : 'Image'} hidden`;
        return placeholder;
    },

    // Helper: Hide elements matching a selector
    _hideElements(targetNode, selector) {
        targetNode.querySelectorAll(selector).forEach(element => {
            if (!element.hasAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN)) {
                element.setAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN, 'true');
                element.style.setProperty('display', 'none', 'important');
            }
        });
    },

    // Helper: Show elements matching a selector
    _showElements(selector) {
        document.querySelectorAll(selector).forEach(element => {
            element.style.removeProperty('display');
            element.removeAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN);
        });
    },

    // Hide all media content (media containers, thumbnails, community status icons)
    hideAll(targetNode = document) {
        // Hide media containers (images and videos in posts)
        targetNode.querySelectorAll(SilentReddit.SELECTORS.MEDIA_CONTAINER).forEach(container => {
            // Skip if already processed
            if (container.hasAttribute(SilentReddit.DATA_ATTRS.MEDIA_PLACEHOLDER)) {
                return;
            }

            const hasVideo = container.querySelector('shreddit-embed, shreddit-async-loader[bundlename="embed"]');
            const hasImage = container.querySelector('img');

            if (hasImage || hasVideo) {
                container.setAttribute(SilentReddit.DATA_ATTRS.MEDIA_PLACEHOLDER, 'true');
                container.style.setProperty('display', 'none', 'important');
                container.parentNode?.insertBefore(this._createPlaceholder(!!hasVideo), container.nextSibling);
            }
        });

        // Hide thumbnails, community status icons, comment media, and GIFs
        this._hideElements(targetNode, SilentReddit.SELECTORS.THUMBNAIL);
        this._hideElements(targetNode, SilentReddit.SELECTORS.COMMUNITY_STATUS);
        this._hideElements(targetNode, SilentReddit.SELECTORS.COMMENT_MEDIA);
        this._hideElements(targetNode, SilentReddit.SELECTORS.FACEPLATE_GIF);
    },

    // Show all hidden media content
    showAll() {
        // Restore media containers
        document.querySelectorAll(SilentReddit.SELECTORS.MEDIA_WITH_PLACEHOLDER).forEach(container => {
            container.style.display = '';
            container.removeAttribute(SilentReddit.DATA_ATTRS.MEDIA_PLACEHOLDER);
        });

        // Remove all placeholder elements
        document.querySelectorAll(`.${SilentReddit.CSS_CLASSES.TEXT_PLACEHOLDER}`).forEach(el => el.remove());

        // Restore all hidden media elements
        this._showElements(SilentReddit.SELECTORS.THUMBNAIL_HIDDEN);
        this._showElements(SilentReddit.SELECTORS.COMMUNITY_STATUS_HIDDEN);
        this._showElements(SilentReddit.SELECTORS.COMMENT_MEDIA_HIDDEN);
        this._showElements(SilentReddit.SELECTORS.FACEPLATE_GIF_HIDDEN);
    }
};

console.log('[SR] Media blocker module loaded');
