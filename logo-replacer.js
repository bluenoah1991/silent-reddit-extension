// Logo Replacer - Handles Reddit logo replacement with Stack Overflow logo
window.SilentReddit = window.SilentReddit || {};

SilentReddit.logoReplacer = {
    // Replace Reddit logo with Stack Overflow logo
    replaceAll() {
        const logoLink = document.querySelector(SilentReddit.SELECTORS.REDDIT_LOGO);
        if (!logoLink || logoLink.hasAttribute(SilentReddit.DATA_ATTRS.LOGO_REPLACED)) {
            return;
        }

        // Save original content
        logoLink.setAttribute(SilentReddit.DATA_ATTRS.LOGO_REPLACED, 'true');
        logoLink.setAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_CONTENT, logoLink.innerHTML);

        // Clear and style the link
        logoLink.innerHTML = '';
        logoLink.style.cssText = 'display: flex !important; align-items: center !important; text-decoration: none !important; height: 100% !important;';

        // Create and append Stack Overflow logo
        const soLogo = document.createElement('img');
        soLogo.src = chrome.runtime.getURL('stack-overflow-wordmark.svg');
        soLogo.alt = 'Stack Overflow';
        soLogo.style.cssText = 'height: 32px; width: auto; object-fit: contain; display: block; margin: 0 !important; padding: 0 !important;';

        logoLink.appendChild(soLogo);
    },

    // Restore original Reddit logo
    restoreAll() {
        const logoLink = document.querySelector(SilentReddit.SELECTORS.REDDIT_LOGO);
        if (!logoLink || !logoLink.hasAttribute(SilentReddit.DATA_ATTRS.LOGO_REPLACED)) {
            return;
        }

        // Restore original content
        const originalContent = logoLink.getAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_CONTENT) || '';
        logoLink.innerHTML = originalContent;
        logoLink.style.cssText = '';

        // Remove data attributes
        logoLink.removeAttribute(SilentReddit.DATA_ATTRS.LOGO_REPLACED);
        logoLink.removeAttribute(SilentReddit.DATA_ATTRS.ORIGINAL_CONTENT);
    }
};

console.log('[SR] Logo replacer module loaded');
