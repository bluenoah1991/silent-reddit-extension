// Icons Replacer - Handles replacement of subreddit and user avatars with letter avatars
window.SilentReddit = window.SilentReddit || {};

SilentReddit.iconsReplacer = {
    // Periodic check timer IDs
    _intervalId: null,
    _timeoutId: null,

    // Generate a color from a name using hash function
    _getColorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return SilentReddit.AVATAR_COLORS[Math.abs(hash) % SilentReddit.AVATAR_COLORS.length];
    },

    // Create a DOM letter avatar element
    _createLetterAvatar(name) {
        if (!name) return null;

        const letter = name.charAt(0).toUpperCase();
        const color = this._getColorFromName(name);

        const avatar = document.createElement('div');
        avatar.className = SilentReddit.CSS_CLASSES.LETTER_AVATAR;
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
    },

    // Create SVG data URL for img src attribute
    _createLetterAvatarDataURL(name) {
        if (!name) return null;

        const letter = name.charAt(0).toUpperCase();
        const color = this._getColorFromName(name);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="32" fill="${color}"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="32" font-weight="bold" font-family="Arial, sans-serif">${letter}</text>
        </svg>`;

        return 'data:image/svg+xml;base64,' + btoa(svg);
    },

    // Extract subreddit name from icon element
    _getSubredditNameFromIcon(icon) {
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
    },

    // Extract community name from element
    _extractCommunityName(element, prefixedName = null) {
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
    },

    // Extract username from avatar element
    _getUsernameFromAvatar(avatar) {
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
    },

    // Replace icons in post subreddit headers
    _replacePostSubredditIcons(targetNode) {
        const selector = SilentReddit.SELECTORS.SUBREDDIT_ICON + ':not([' + SilentReddit.DATA_ATTRS.ICON_REPLACED + '])';
        targetNode.querySelectorAll(selector).forEach(icon => {
            const subredditName = this._getSubredditNameFromIcon(icon);
            if (!subredditName) return;

            const letterAvatar = this._createLetterAvatar(subredditName);
            if (!letterAvatar) return;

            icon.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
            icon.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, icon.src);
            icon.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, icon.style.cssText);
            icon.style.setProperty('display', 'none', 'important');
            icon.parentNode?.insertBefore(letterAvatar, icon);
        });
    },

    // Replace icons in left-nav-communities-controller (Shadow DOM)
    _replaceNavCommunitiesIcons() {
        const controller = document.querySelector(SilentReddit.SELECTORS.NAV_COMMUNITIES_CONTROLLER);
        if (!controller?.shadowRoot) return;

        const items = controller.shadowRoot.querySelectorAll(SilentReddit.SELECTORS.NAV_COMMUNITY_ITEM);
        items.forEach(item => {
            if (!item.shadowRoot) return;

            const prefixedName = item.getAttribute('prefixedname');
            const selector = 'img:not([' + SilentReddit.DATA_ATTRS.ICON_REPLACED + '])';
            const imgs = item.shadowRoot.querySelectorAll(selector);

            imgs.forEach(img => {
                const communityName = this._extractCommunityName(img, prefixedName);
                if (communityName && !img.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC)) {
                    img.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, img.src);
                    img.src = this._createLetterAvatarDataURL(communityName);
                    img.srcset = '';
                    img.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
                }
            });
        });
    },

    // Replace icons in reddit-recent-pages (Shadow DOM)
    _replaceRecentPagesIcons() {
        const recentPages = document.querySelector(SilentReddit.SELECTORS.RECENT_PAGES);
        if (!recentPages?.shadowRoot) return;

        const selector = 'img:not([' + SilentReddit.DATA_ATTRS.ICON_REPLACED + '])';
        const imgs = recentPages.shadowRoot.querySelectorAll(selector);
        imgs.forEach(img => {
            const isCommunityIcon = img.src && (
                img.src.includes('communityIcon') ||
                img.src.includes('redditmedia')
            );

            if (isCommunityIcon) {
                const communityName = this._extractCommunityName(img);
                if (communityName && !img.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC)) {
                    img.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, img.src);
                    img.src = this._createLetterAvatarDataURL(communityName);
                    img.srcset = '';
                    img.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
                }
            }
        });
    },

    // Replace user avatar images
    _replaceUserAvatarImages(targetNode) {
        const selectors = SilentReddit.SELECTORS.USER_AVATAR_IMG.split(',').map(s => s.trim());

        selectors.forEach(selector => {
            targetNode.querySelectorAll(selector).forEach(avatar => {
                // Skip if already replaced or is a subreddit icon
                if (avatar.hasAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED) ||
                    avatar.classList.contains('shreddit-subreddit-icon__icon')) {
                    return;
                }

                const username = this._getUsernameFromAvatar(avatar);
                if (!username) return;

                const letterAvatar = this._createLetterAvatar(username);
                if (!letterAvatar) return;

                // Save original state
                avatar.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
                avatar.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, avatar.src);
                avatar.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, avatar.style.cssText);

                // Hide the avatar
                avatar.style.setProperty('display', 'none', 'important');

                // Insert letter avatar
                avatar.parentNode?.insertBefore(letterAvatar, avatar);
            });
        });
    },

    // Replace SVG snoovatar avatars
    _replaceSnoovatarAvatars(targetNode) {
        targetNode.querySelectorAll(SilentReddit.SELECTORS.SNOOVATAR).forEach(snoovatar => {
            if (snoovatar.hasAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED)) return;

            const username = this._getUsernameFromAvatar(snoovatar);
            if (!username) return;

            const letterAvatar = this._createLetterAvatar(username);
            if (!letterAvatar) return;

            // Save original state
            snoovatar.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
            snoovatar.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, snoovatar.style.cssText);

            // Hide the snoovatar
            snoovatar.style.setProperty('display', 'none', 'important');

            // Insert letter avatar
            snoovatar.parentNode?.insertBefore(letterAvatar, snoovatar);
        });
    },

    // Replace avatar containers
    _replaceAvatarContainers(targetNode) {
        targetNode.querySelectorAll(SilentReddit.SELECTORS.AVATAR_CONTAINER).forEach(container => {
            // Skip if already processed
            if (container.querySelector('.' + SilentReddit.CSS_CLASSES.LETTER_AVATAR)) return;

            const username = this._getUsernameFromAvatar(container);
            if (!username) return;

            const letterAvatar = this._createLetterAvatar(username);
            if (!letterAvatar) return;

            // Find the actual avatar element to hide
            const avatarElement = container.querySelector('.snoovatar, img');
            if (avatarElement && !avatarElement.hasAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED)) {
                avatarElement.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
                avatarElement.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, avatarElement.style.cssText);
                avatarElement.style.setProperty('display', 'none', 'important');
            }

            // Insert letter avatar
            container.appendChild(letterAvatar);
        });
    },

    // Restore icons in left-nav-communities-controller
    _restoreNavCommunitiesIcons() {
        const controller = document.querySelector(SilentReddit.SELECTORS.NAV_COMMUNITIES_CONTROLLER);
        if (!controller?.shadowRoot) return;

        const items = controller.shadowRoot.querySelectorAll(SilentReddit.SELECTORS.NAV_COMMUNITY_ITEM);
        items.forEach(item => {
            if (!item.shadowRoot) return;

            const selector = 'img[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']';
            const imgs = item.shadowRoot.querySelectorAll(selector);
            imgs.forEach(img => {
                const originalSrc = img.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
                if (originalSrc) {
                    img.src = originalSrc;
                    img.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
                }
                img.srcset = '';
                img.removeAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED);
            });
        });
    },

    // Restore icons in reddit-recent-pages
    _restoreRecentPagesIcons() {
        const recentPages = document.querySelector(SilentReddit.SELECTORS.RECENT_PAGES);
        if (!recentPages?.shadowRoot) return;

        const selector = 'img[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']';
        const imgs = recentPages.shadowRoot.querySelectorAll(selector);
        imgs.forEach(img => {
            const originalSrc = img.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            if (originalSrc) {
                img.src = originalSrc;
                img.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            }
            img.srcset = '';
            img.removeAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED);
        });
    },

    // Public method: Hide all icons and replace with letter avatars
    hideAll(targetNode = document) {
        // Replace subreddit icons in posts
        this._replacePostSubredditIcons(targetNode);

        // Replace user avatars
        this._replaceUserAvatarImages(targetNode);
        this._replaceSnoovatarAvatars(targetNode);
        this._replaceAvatarContainers(targetNode);

        // Replace Shadow DOM icons (only on full page, not on nodes)
        if (targetNode === document) {
            this._replaceNavCommunitiesIcons();
            this._replaceRecentPagesIcons();
        }
    },

    // Public method: Show all original icons
    showAll() {
        // Restore subreddit icons in posts
        const subredditSelector = SilentReddit.SELECTORS.SUBREDDIT_ICON + '[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']';
        document.querySelectorAll(subredditSelector).forEach(icon => {
            const originalSrc = icon.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            if (originalSrc) {
                icon.src = originalSrc;
                icon.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            }
            icon.style.cssText = icon.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE) || '';
            icon.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE);
            icon.removeAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED);
        });

        // Restore left-nav-community-item icons
        this._restoreNavCommunitiesIcons();

        // Restore recent pages icons
        this._restoreRecentPagesIcons();

        // Restore user avatar images
        const userAvatarSelector = '[slot="commentAvatar"] img[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + '], a[href*="/user/"] img[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']';
        document.querySelectorAll(userAvatarSelector).forEach(avatar => {
            const originalSrc = avatar.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            if (originalSrc) {
                avatar.src = originalSrc;
                avatar.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            }
            avatar.style.cssText = avatar.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE) || '';
            avatar.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE);
            avatar.removeAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED);
        });

        // Restore snoovatar avatars
        const snoovatarSelector = '.snoovatar[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']';
        document.querySelectorAll(snoovatarSelector).forEach(snoovatar => {
            snoovatar.style.cssText = snoovatar.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE) || '';
            snoovatar.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE);
            snoovatar.removeAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED);
        });

        // Remove all letter avatars
        document.querySelectorAll('.' + SilentReddit.CSS_CLASSES.LETTER_AVATAR).forEach(avatar => avatar.remove());
    },

    // Public method: Start periodic check for Shadow DOM elements
    startPeriodicCheck() {
        // Clear any existing timers first
        this.stopPeriodicCheck();

        const checkShadowDOM = () => {
            try {
                this._replaceNavCommunitiesIcons();
                this._replaceRecentPagesIcons();
            } catch (error) {
                console.error('[SR] Error in Shadow DOM check:', error);
            }
        };

        // First check after 2 seconds, then every 3 seconds
        this._timeoutId = setTimeout(checkShadowDOM, 2000);
        this._intervalId = setInterval(checkShadowDOM, 3000);
    },

    // Public method: Stop periodic check
    stopPeriodicCheck() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }
};

console.log('[SR] Icons replacer module loaded');
