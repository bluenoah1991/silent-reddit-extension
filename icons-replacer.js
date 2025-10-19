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
            aspect-ratio: 1/1;
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
        // Try to find subreddit name from nearby link (check parent and search-community container)
        const link = icon.closest('a[href^="/r/"]') ||
            icon.closest('[data-testid="search-community"]')?.querySelector('a[href^="/r/"]');
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
        // Try to find username from nearby link (check various containers)
        const link = avatar.closest('a[href*="/user/"]') ||
            avatar.closest('[data-testid="search-author"]')?.querySelector('a[href*="/user/"]') ||
            avatar.closest('li')?.querySelector('faceplate-tracker[source="moderator_list"] a[href*="/user/"]');

        if (link) {
            const match = link.href.match(/\/user\/([^/?]+)/);
            if (match) return match[1];
        }

        // Try to extract from link text content (for search comment list with href="#")
        const parentLink = avatar.closest('a[href="#"]');
        if (parentLink) {
            const linkText = Array.from(parentLink.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('');
            if (linkText) {
                const textMatch = linkText.match(/^u\/([^\s]+)|^([A-Za-z0-9_-]+)$/);
                if (textMatch) return textMatch[1] || textMatch[2];
            }
        }

        // Try to find from alt text in img or image element
        const img = avatar.querySelector ? avatar.querySelector('img, image') :
            (avatar.tagName === 'IMG' || avatar.tagName === 'image' ? avatar : null);
        if (img) {
            const alt = img.alt || img.getAttribute('alt') || '';
            const altMatch = alt.match(/u\/([^\s]+)/);
            if (altMatch) return altMatch[1];
        }

        // Try to extract from adjacent text node
        const avatarContainer = avatar.closest('[rpl][avatar]');
        if (avatarContainer?.nextSibling?.nodeType === Node.TEXT_NODE) {
            const text = avatarContainer.nextSibling.textContent.trim();
            const textMatch = text.match(/^u\/([^\s]+)|^([^\s]+)$/);
            if (textMatch) return textMatch[1] || textMatch[2];
        }

        // Try to extract from data-faceplate-tracking-context
        const trackedElement = avatar.closest('[data-faceplate-tracking-context]');
        if (trackedElement) {
            try {
                const trackingData = JSON.parse(trackedElement.getAttribute('data-faceplate-tracking-context'));
                return trackingData?.post?.authorName || trackingData?.comment?.authorName || null;
            } catch (e) {
                // Ignore JSON parse errors
            }
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

            // Check if icon is an img element or a container
            if (icon.tagName === 'IMG') {
                // For img elements, check parent for existing letter avatar
                const parent = icon.parentNode;
                if (!parent) return;

                // Skip if letter avatar already exists in parent
                if (parent.querySelector('.' + SilentReddit.CSS_CLASSES.LETTER_AVATAR)) return;

                // Save src and hide
                icon.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, icon.src);
                icon.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, icon.style.cssText);
                icon.style.setProperty('display', 'none', 'important');
                parent.insertBefore(letterAvatar, icon);
            } else {
                // For container elements (like span.shreddit-subreddit-icon__icon)
                // Skip if letter avatar already exists inside
                if (icon.querySelector('.' + SilentReddit.CSS_CLASSES.LETTER_AVATAR)) return;

                // Hide all child content and insert letter avatar inside the container
                icon.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, icon.style.cssText);

                // Hide all children
                Array.from(icon.children).forEach(child => {
                    child.style.setProperty('display', 'none', 'important');
                });

                // Insert letter avatar inside the container
                icon.appendChild(letterAvatar);
            }
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

    // Replace user avatar images and snoovatars
    _replaceUserAvatars(targetNode) {
        // Combine img and snoovatar selectors
        const combinedSelectors = [
            SilentReddit.SELECTORS.USER_AVATAR_IMG,
            SilentReddit.SELECTORS.SNOOVATAR
        ].join(', ');

        targetNode.querySelectorAll(combinedSelectors).forEach(element => {
            // Skip if already replaced or is a subreddit icon
            if (element.hasAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED) ||
                element.classList.contains('shreddit-subreddit-icon__icon')) {
                return;
            }

            const username = this._getUsernameFromAvatar(element);
            if (!username) return;

            const letterAvatar = this._createLetterAvatar(username);
            if (!letterAvatar) return;

            // Mark as replaced
            element.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
            element.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, element.style.cssText);

            // Save src for img elements
            if (element.tagName === 'IMG') {
                element.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, element.src);
            }

            // Hide the element
            element.style.setProperty('display', 'none', 'important');

            // Insert letter avatar before the element
            element.parentNode?.insertBefore(letterAvatar, element);
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

    // Replace moderator list avatars
    _replaceModeratorListAvatars(targetNode) {
        targetNode.querySelectorAll(SilentReddit.SELECTORS.MODERATOR_LIST_ITEM).forEach(tracker => {
            // Find the list item containing this tracker
            const listItem = tracker.closest('li');
            if (!listItem) return;

            // Find all avatars in this list item
            const avatars = listItem.querySelectorAll('img, .snoovatar');
            avatars.forEach(avatar => {
                // Skip if already replaced
                if (avatar.hasAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED)) return;

                // Extract username from the tracker's link
                const link = tracker.querySelector('a[href*="/user/"]');
                if (!link) return;

                const match = link.href.match(/\/user\/([^/?]+)/);
                if (!match) return;

                const username = match[1];
                const letterAvatar = this._createLetterAvatar(username);
                if (!letterAvatar) return;

                // Handle img elements
                if (avatar.tagName === 'IMG') {
                    avatar.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
                    avatar.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC, avatar.src);
                    avatar.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, avatar.style.cssText);
                    avatar.style.setProperty('display', 'none', 'important');
                    avatar.parentNode?.insertBefore(letterAvatar, avatar);
                }
                // Handle snoovatar containers
                else if (avatar.classList.contains('snoovatar')) {
                    avatar.setAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED, 'true');
                    avatar.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE, avatar.style.cssText);
                    avatar.style.setProperty('display', 'none', 'important');
                    avatar.parentNode?.insertBefore(letterAvatar, avatar);
                }
            });
        });
    },

    // Restore Shadow DOM images
    _restoreShadowDOMImages(selector) {
        const element = document.querySelector(selector);
        if (!element?.shadowRoot) return;

        const items = selector === SilentReddit.SELECTORS.NAV_COMMUNITIES_CONTROLLER
            ? element.shadowRoot.querySelectorAll(SilentReddit.SELECTORS.NAV_COMMUNITY_ITEM)
            : [element];

        items.forEach(item => {
            const shadowRoot = item.shadowRoot || item;
            const imgs = shadowRoot.querySelectorAll('img[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']');

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

    // Restore icons in left-nav-communities-controller
    _restoreNavCommunitiesIcons() {
        this._restoreShadowDOMImages(SilentReddit.SELECTORS.NAV_COMMUNITIES_CONTROLLER);
    },

    // Restore icons in reddit-recent-pages
    _restoreRecentPagesIcons() {
        this._restoreShadowDOMImages(SilentReddit.SELECTORS.RECENT_PAGES);
    },

    // Public method: Hide all icons and replace with letter avatars
    hideAll(targetNode = document) {
        // Replace subreddit icons in posts
        this._replacePostSubredditIcons(targetNode);

        // Replace user avatars (img and snoovatar)
        this._replaceUserAvatars(targetNode);
        this._replaceAvatarContainers(targetNode);

        // Replace moderator list avatars
        this._replaceModeratorListAvatars(targetNode);

        // Replace Shadow DOM icons (only on full page, not on nodes)
        if (targetNode === document) {
            this._replaceNavCommunitiesIcons();
            this._replaceRecentPagesIcons();
        }
    },

    // Restore element to original state
    _restoreElement(element) {
        // Restore src for img elements
        if (element.tagName === 'IMG') {
            const originalSrc = element.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            if (originalSrc) {
                element.src = originalSrc;
                element.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_SRC);
            }
        }

        // Restore original style
        const originalStyle = element.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE);
        element.style.cssText = originalStyle || '';
        element.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_STYLE);
        element.removeAttribute(SilentReddit.DATA_ATTRS.ICON_REPLACED);
    },

    // Public method: Show all original icons
    showAll() {
        // Restore subreddit icons in posts
        const subredditSelector = SilentReddit.SELECTORS.SUBREDDIT_ICON + '[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']';
        document.querySelectorAll(subredditSelector).forEach(icon => {
            this._restoreElement(icon);

            // Show all children that were hidden
            Array.from(icon.children).forEach(child => {
                if (!child.classList.contains(SilentReddit.CSS_CLASSES.LETTER_AVATAR)) {
                    child.style.display = '';
                }
            });
        });

        // Restore Shadow DOM icons
        this._restoreNavCommunitiesIcons();
        this._restoreRecentPagesIcons();

        // Restore all user avatars (img and snoovatar combined)
        const avatarSelector = [
            SilentReddit.SELECTORS.USER_AVATAR_IMG,
            SilentReddit.SELECTORS.SNOOVATAR
        ].map(s => s + '[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']').join(', ');

        document.querySelectorAll(avatarSelector).forEach(element => this._restoreElement(element));

        // Restore moderator list avatars
        document.querySelectorAll(SilentReddit.SELECTORS.MODERATOR_LIST_ITEM).forEach(tracker => {
            const listItem = tracker.closest('li');
            if (listItem) {
                const replacedAvatars = listItem.querySelectorAll('[' + SilentReddit.DATA_ATTRS.ICON_REPLACED + ']');
                replacedAvatars.forEach(avatar => this._restoreElement(avatar));
            }
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
