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

        // Hide thumbnails
        targetNode.querySelectorAll(SilentReddit.SELECTORS.THUMBNAIL).forEach(thumbnail => {
            if (!thumbnail.hasAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN)) {
                thumbnail.setAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN, 'true');
                thumbnail.style.setProperty('display', 'none', 'important');
            }
        });

        // Hide community status icons
        targetNode.querySelectorAll(SilentReddit.SELECTORS.COMMUNITY_STATUS).forEach(status => {
            if (!status.hasAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN)) {
                status.setAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN, 'true');
                status.style.setProperty('display', 'none', 'important');
            }
        });

        // Hide comment media (videos and figures in comments)
        targetNode.querySelectorAll(SilentReddit.SELECTORS.COMMENT_MEDIA).forEach(media => {
            if (!media.hasAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN)) {
                media.setAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN, 'true');
                media.style.setProperty('display', 'none', 'important');
            }
        });
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

        // Restore thumbnails
        document.querySelectorAll(SilentReddit.SELECTORS.THUMBNAIL_HIDDEN).forEach(thumbnail => {
            thumbnail.style.removeProperty('display');
            thumbnail.removeAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN);
        });

        // Restore community status icons
        document.querySelectorAll(SilentReddit.SELECTORS.COMMUNITY_STATUS_HIDDEN).forEach(status => {
            status.style.removeProperty('display');
            status.removeAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN);
        });

        // Restore comment media
        document.querySelectorAll(SilentReddit.SELECTORS.COMMENT_MEDIA_HIDDEN).forEach(media => {
            media.style.removeProperty('display');
            media.removeAttribute(SilentReddit.DATA_ATTRS.MEDIA_HIDDEN);
        });
    }
};

console.log('[SR] Media blocker module loaded');
